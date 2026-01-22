from rest_framework import views, status
from rest_framework.response import Response
from django.conf import settings
from .models import Transaction, TransactionStatus
from .serializers import InitiatePaymentSerializer, TransactionSerializer
from .chapa import ChapaMixin
from .services import ServiceIntegrator
import uuid
import logging

logger = logging.getLogger(__name__)

class InitiatePaymentView(views.APIView):
    """
    Receives request from Frontend, creates a local Pending Transaction,
    and calls Chapa to get the Redirect URL.
    """
    def post(self, request):
        # 1. Validate Input (Frontend sends amount, email, order_id, etc.)
        serializer = InitiatePaymentSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Payment Validation Failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # 2. Generate a Unique Reference for Chapa
        # We cannot use order_id alone because a user might retry payment for the same order.
        tx_ref = f"medivo-{uuid.uuid4()}"

        try:
            # 3. Create Local Transaction Record
            transaction = Transaction.objects.create(
                order_id=data.get('order_id'), # Crucial: Link to Order Service
                user_id=data['user_id'],
                amount=data['amount'],
                currency="ETB",
                tx_ref=tx_ref,
                status=TransactionStatus.CREATED,
                description=f"Payment for Order #{data.get('order_id')}"
            )

            # 4. Interact with Chapa
            chapa = ChapaMixin()
            chapa_response = chapa.initialize_transaction(
                email=data['email'],
                amount=str(data['amount']), # Chapa expects string
                tx_ref=tx_ref,
                first_name=data.get('first_name', 'Guest'),
                last_name=data.get('last_name', 'User'),
                return_url=data['return_url'], # The 'Payment Success' page on Frontend
                customization={
                    "title": "Medivo Pharmacy",
                    "description": f"Order #{data.get('order_id')}"
                }
            )

            # 5. Handle Chapa Response
            if chapa_response.get('status') == 'success':
                transaction.checkout_url = chapa_response['data']['checkout_url']
                transaction.status = TransactionStatus.PENDING # Waiting for user to pay
                transaction.response_dump = chapa_response
                transaction.save()
                
                return Response({
                    "checkout_url": transaction.checkout_url,
                    "tx_ref": transaction.tx_ref
                }, status=status.HTTP_201_CREATED)
            else:
                # Chapa rejected the initialization
                transaction.status = TransactionStatus.FAILED
                transaction.response_dump = chapa_response
                transaction.save()
                logger.error(f"Chapa Init Failed: {chapa_response}")
                return Response(
                    {"detail": "Payment gateway rejected the request.", "chapa_error": chapa_response}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            logger.exception("Internal Payment Error")
            return Response(
                {"detail": "Internal server error processing payment."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChapaWebhookView(views.APIView):
    """
    Chapa calls this endpoint automatically when a payment is successful.
    """
    def post(self, request):
        # 1. Basic Security: In prod, verify 'x-chapa-signature' header here
        
        data = request.data
        tx_ref = data.get('tx_ref') or data.get('reference')
        
        if not tx_ref:
            return Response({"error": "No reference provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction = Transaction.objects.get(tx_ref=tx_ref)
        except Transaction.DoesNotExist:
            logger.warning(f"Webhook received for unknown tx_ref: {tx_ref}")
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

        # 2. Prevent Double Processing
        if transaction.status == TransactionStatus.SUCCESS:
            return Response({"status": "already_processed"}, status=status.HTTP_200_OK)

        # 3. Verify with Chapa (Double Check)
        # Never trust the webhook body alone; ask Chapa servers directly.
        chapa = ChapaMixin()
        verification = chapa.verify_transaction(tx_ref)
        
        if verification.get('status') == 'success':
            # A. Update Local State
            transaction.status = TransactionStatus.SUCCESS
            transaction.response_dump = verification
            transaction.save()
            
            # B. Trigger Microservice Saga (Notify Order/Inventory Services)
            # We pass the ORDER ID, not the tx_ref, because other services know Order ID.
            try:
                ServiceIntegrator.handle_payment_success(
                    order_id=transaction.order_id,
                    transaction_ref=tx_ref
                )
            except Exception as e:
                logger.error(f"Failed to notify services for {tx_ref}: {str(e)}")
                # We still return 200 to Chapa because the payment *was* successful
            
            return Response({"status": "verified_and_processed"}, status=status.HTTP_200_OK)
        else:
            transaction.status = TransactionStatus.FAILED
            transaction.save()
            
            # Notify failure to unlock inventory if needed
            ServiceIntegrator.handle_payment_failure(transaction.order_id)
            
            return Response({"status": "verification_failed"}, status=status.HTTP_200_OK)

class TransactionStatusView(views.APIView):
    """
    Frontend polls this to check if payment succeeded (optional fallback).
    """
    def get(self, request, tx_ref):
        try:
            transaction = Transaction.objects.get(tx_ref=tx_ref)
            serializer = TransactionSerializer(transaction)
            return Response(serializer.data)
        except Transaction.DoesNotExist:
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)
