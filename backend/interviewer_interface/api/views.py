from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import TestTemplateSerializer

from ..models import TestTemplate


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
