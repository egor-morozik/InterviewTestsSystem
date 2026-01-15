from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import TestTemplate
from .serializers import TestTemplateSerializer


class TestTemplateListView(APIView):
    permission_classes = [AllowAny]  # Временно разрешаем доступ без авторизации

    def get(self, request):
        templates = TestTemplate.objects.all()
        serializer = TestTemplateSerializer(templates, many=True)
        return Response(serializer.data)


class TestTemplateDetailView(APIView):
    permission_classes = [AllowAny]  # Временно разрешаем доступ без авторизации

    def get(self, request, pk):
        template = TestTemplate.objects.get(pk=pk)
        serializer = TestTemplateSerializer(template)
        return Response(serializer.data)


# Current user endpoint
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_hr": getattr(user, "is_hr", False),
            "is_tech_lead": getattr(user, "is_tech_lead", False),
            "is_staff": user.is_staff,
        })
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import TestTemplate
from .serializers import TestTemplateSerializer


class TestTemplateListView(APIView):
    permission_classes = [AllowAny]  # Временно разрешаем доступ без авторизации

    def get(self, request):
        templates = TestTemplate.objects.all()
        serializer = TestTemplateSerializer(templates, many=True)
        return Response(serializer.data)


class TestTemplateDetailView(APIView):
    permission_classes = [AllowAny]  # Временно разрешаем доступ без авторизации

    def get(self, request, pk):
        template = TestTemplate.objects.get(pk=pk)
        serializer = TestTemplateSerializer(template)
        return Response(serializer.data)
