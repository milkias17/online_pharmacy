from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Order
from .serializers import OrderSerializer

class CreateOrderView(APIView):
    def post(self, request):
        serializer = OrderSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            return Response({
                "message": "Order created successfully",
                "order_id": str(order.id),
                "total_amount": order.total_amount
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# List Orders (Optional: by user_id)
# -----------------------------
class ListOrdersView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if user_id:
            orders = Order.objects.filter(user_id=user_id).order_by("-created_at")
        else:
            orders = Order.objects.all().order_by("-created_at")
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# -----------------------------
# Get Order Details
# -----------------------------
class OrderDetailView(APIView):
    def get(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


# -----------------------------
# Update Order Status
# -----------------------------
class UpdateOrderStatusView(APIView):
    def patch(self, request, order_id):
        new_status = request.data.get("status")
        if not new_status:
            return Response({"error": "status field is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({"error": f"Invalid status. Valid choices: {[s for s,_ in Order.STATUS_CHOICES]}"},
                            status=status.HTTP_400_BAD_REQUEST)
        
        order.status = new_status
        order.save()
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


# -----------------------------
# Delete Order
# -----------------------------
class DeleteOrderView(APIView):
    def delete(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        order.delete()  # This will also delete related OrderItems because of on_delete=models.CASCADE
        return Response({"message": f"Order {order_id} deleted successfully"}, status=status.HTTP_200_OK)

