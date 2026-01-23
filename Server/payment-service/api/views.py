import uuid
import logging
from rest_framework import views, status
from rest_framework.response import Response
from .models import Transaction, TransactionStatus
from .serializers import InitiatePaymentSerializer
from .chapa import ChapaMixin
from confluent_kafka import Producer
import json
import os

logger = logging.getLogger(__name__)

# Initialize Kafka Producer
p = Producer({'bootstrap.servers': os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka-service:9092')})

class InitiatePaymentView(views.APIView):
    """
    Step 1 of the Saga: User wants to pay.
    We create a record and get the Chapa URL.
    """
    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        tx_ref = f"medivo-{uuid.uuid4().hex[:8]}"

        try:
            # 1. Save Transaction to Supabase (Identity Persistence)
            transaction = Transaction.objects.create(
                user_id=data['user_id'],
                order_id=data.get('order_id'),
                amount=data['amount'],
                tx_ref=tx_ref,
                status=TransactionStatus.PENDING,
                description=f"Payment for Order {data.get('order_id')}"
            )

            # 2. Call Chapa (External Gateway Proxy)
            chapa = ChapaMixin()
            chapa_res = chapa.initialize_transaction(
                email=data['email'],
                amount=data['amount'],
                tx_ref=tx_ref,
                first_name=data.get('first_name', 'Customer'),
                last_name=data.get('last_name', 'User'),
                return_url=data['return_url']
            )

            if chapa_res.get('status') == 'success':
                transaction.checkout_url = chapa_res['data']['checkout_url']
                transaction.save()
                
                # OPTIONAL: In a 'Choreographed Saga', the Order service 
                # might already be waiting. We return the URL to the frontend.
                return Response({
                    "status": "success",
                    "checkout_url": transaction.checkout_url,
                    "tx_ref": tx_ref
                }, status=status.HTTP_201_CREATED)
            
            return Response({"error": "Chapa rejected initialization"}, status=400)

        except Exception as e:
            logger.error(f"Distributed Transaction Failure: {str(e)}")
            return Response({"detail": "Internal Server Error"}, status=500)

class ChapaWebhookView(views.APIView):
    """
    Step 2: Chapa calls this when money is received.
    This triggers the ASYNCHRONOUS part of the system.
    """
    def post(self, request):
        tx_ref = request.data.get('tx_ref')
        try:
            transaction = Transaction.objects.get(tx_ref=tx_ref)
            transaction.status = TransactionStatus.SUCCESS
            transaction.save()

            # --- THE KAFKA MOMENT ---
            # We shout to the system that the payment is DONE.
            event_data = {
                "event": "PAYMENT_SUCCESS",
                "order_id": transaction.order_id,
                "user_id": transaction.user_id,
                "amount": str(transaction.amount)
            }
            p.produce('payment_events', json.dumps(event_data))
            p.flush()
            
            return Response({"status": "event_published"}, status=200)
        except Transaction.DoesNotExist:
            return Response({"error": "Unknown Transaction"}, status=404)
