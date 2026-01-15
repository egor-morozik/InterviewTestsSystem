from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import TestTemplate
from .serializers import TestTemplateSerializer

from django.contrib.auth import authenticate, login
from rest_framework import status
from rest_framework.permissions import AllowAny


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


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        if not username or not password:
            return Response({"detail": "username and password required"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({"detail": "invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        login(request, user)
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
        })


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
