from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import TestTemplate, Question
from .serializers import TestTemplateSerializer

from django.contrib.auth import authenticate, login
from django.db.models.deletion import ProtectedError
from rest_framework import status
from rest_framework.permissions import AllowAny


class TestTemplateListView(APIView):
    """
    Доступ к наборам вопросов
    """

    permission_classes = [AllowAny]  

    def get(self, request):
        templates = TestTemplate.objects.all()
        serializer = TestTemplateSerializer(templates, many=True)
        return Response(serializer.data)


class TestTemplateDetailView(APIView):
    """
    Подробное рассмотрение конкретного набора вопросов
    """

    permission_classes = [AllowAny]  

    def get(self, request, pk):
        template = TestTemplate.objects.get(pk=pk)
        serializer = TestTemplateSerializer(template)
        return Response(serializer.data)

    def patch(self, request, pk):
        try:
            template = TestTemplate.objects.get(pk=pk)
        except TestTemplate.DoesNotExist:
            return Response({"error": "Template not found"}, status=404)

        if 'name' in request.data:
            template.name = request.data.get('name')
        if 'description' in request.data:
            template.description = request.data.get('description')
        if 'time_limit' in request.data:
            try:
                template.time_limit = int(request.data.get('time_limit') or 0)
            except (ValueError, TypeError):
                template.time_limit = 0

        if 'questions' in request.data:
            questions = request.data.get('questions') or []
            TestTemplateQuestion = TestTemplate._meta.get_field('questions').remote_field.through
            TestTemplateQuestion.objects.filter(template=template).delete()
            order = 0
            for item in questions:
                if isinstance(item, dict):
                    qid = item.get('question_id') or item.get('id')
                    order = item.get('order', order)
                else:
                    qid = item
                try:
                    q = Question.objects.get(id=qid)
                    TestTemplateQuestion.objects.create(template=template, question=q, order=order)
                except Question.DoesNotExist:
                    continue
                order += 1

        template.save()
        serializer = TestTemplateSerializer(template)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            template = TestTemplate.objects.get(pk=pk)
        except TestTemplate.DoesNotExist:
            return Response({"error": "Template not found"}, status=404)
        try:
            template.delete()
            return Response(status=204)
        except ProtectedError:
            return Response({"error": "Cannot delete template because it is used by invitations"}, status=400)


class LoginView(APIView):
    """
    Вход в аккаунт сотрудника
    """

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


class CurrentUserView(APIView):
    """
    Информация о текущем пользователе
    """

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

