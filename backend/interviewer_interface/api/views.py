from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.interviewer_interface.api.serializers import \
    TestTemplateSerializer

from ..models import TestTemplate


class TestTemplateListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        templates = TestTemplate.objects.all()
        serializer = TestTemplateSerializer(templates, many=True)
        return Response(serializer.data)


class TestTemplateDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        template = TestTemplate.objects.get(pk=pk)
        serializer = TestTemplateSerializer(template)
        return Response(serializer.data)
