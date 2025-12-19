from rest_framework.permissions import BasePermission

class IsVerified(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_verified

class IsPharmacyAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'pharmacy_admin'

class IsPharmacyOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['pharmacy', 'pharmacy_admin']