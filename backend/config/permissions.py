from rest_framework.permissions import BasePermission


class IsHR(BasePermission):
    def has_permission(self, request, view):
        return bool(getattr(request.user, "is_hr", False))


class IsTechLead(BasePermission):
    def has_permission(self, request, view):
        return bool(getattr(request.user, "is_tech_lead", False))


class IsHROrTechLead(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user:
            return False
        return bool(
            getattr(user, "is_hr", False)
            or getattr(user, "is_tech_lead", False)
            or getattr(user, "is_staff", False)
        )
