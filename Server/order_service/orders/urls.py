
from django.urls import path
from .views import (
    CreateOrderView,
    ListOrdersView,
    OrderDetailView,
    UpdateOrderStatusView,
    DeleteOrderView
)

urlpatterns = [
    path("orders/", CreateOrderView.as_view(), name="create-order"),
    path("orders/list/", ListOrdersView.as_view(), name="list-orders"),
    path("orders/<uuid:order_id>/", OrderDetailView.as_view(), name="order-detail"),
    path("orders/<uuid:order_id>/status/", UpdateOrderStatusView.as_view(), name="update-order-status"),
    path("orders/<uuid:order_id>/delete/", DeleteOrderView.as_view(), name="delete-order"),
]
