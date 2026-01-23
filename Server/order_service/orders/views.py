from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Order
from .serializers import OrderSerializer
from .messaging import publish_order_created 

class CreateOrderView(APIView):
    def post(self, request):
        serializer = OrderSerializer(data=request.data)
        if serializer.is_valid():
            # 1. SAVE TO DISTRIBUTED DB (SUPABASE)
            order = serializer.save()
            
            # 2. TRIGGER ASYNCHRONOUS SAGA (KAFKA)
            try:
                # We extract the first item to simplify the demo for the Java service
                first_item = request.data.get('items')[0]
                
                order_payload = {
                    "event": "ORDER_CREATED",
                    "order_id": str(order.id),
                    "user_id": str(order.user_id),
                    # Use .get() to avoid crashing if one name is missing
                    "medicine_id": first_item.get('medicine_id') or first_item.get('medicineId'),
                    "quantity": first_item.get('quantity'),
                    "total_amount": float(order.total_amount)
                }
                
                publish_order_created(order_payload)
                
            except Exception as e:
                # We log the error but don't stop the request 
                # (The order is already in the DB!)
                print(f"⚠️ Kafka event failed but order saved: {str(e)}")

            return Response({
                "message": "Order created successfully",
                "order_id": str(order.id),
                "total_amount": order.total_amount
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ListOrdersView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        orders = Order.objects.filter(user_id=user_id).order_by("-created_at") if user_id else Order.objects.all().order_by("-created_at")
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class OrderDetailView(APIView):
    def get(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)

class UpdateOrderStatusView(APIView):
    def patch(self, request, order_id):
        new_status = request.data.get("status")
        try:
            order = Order.objects.get(id=order_id)
            order.status = new_status
            order.save()
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)

class DeleteOrderView(APIView):
    def delete(self, request, order_id):
        Order.objects.filter(id=order_id).delete()
        return Response({"message": "Deleted"}, status=200)
