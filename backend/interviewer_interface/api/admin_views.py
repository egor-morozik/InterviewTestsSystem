from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
import httpx
import logging

logger = logging.getLogger(__name__)

from candidate_interface.models import Candidate, Invitation
from interviewer_interface.models import InterviewerUser, TestTemplate
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

from ..models import Choice, Question, Tag, TestTemplate
from .serializers import (
    QuestionCreateSerializer,
    QuestionSerializer,
    TagSerializer,
    TestTemplateCreateSerializer,
    TestTemplateSerializer,
)


class AdminDashboardView(APIView):
    permission_classes = [AllowAny]  # Временно разрешаем доступ без авторизации

    def get(self, request):
        """Статистика для дашборда"""
        total_candidates = Candidate.objects.count()
        total_invitations = Invitation.objects.count()
        completed_invitations = Invitation.objects.filter(completed=True).count()
        pending_invitations = Invitation.objects.filter(
            completed=False, sent=True
        ).count()
        total_templates = TestTemplate.objects.count()

        return Response(
            {
                "total_candidates": total_candidates,
                "total_invitations": total_invitations,
                "completed_invitations": completed_invitations,
                "pending_invitations": pending_invitations,
                "total_templates": total_templates,
            }
        )


class CandidateListView(APIView):
    permission_classes = [AllowAny]  # Временно разрешаем доступ без авторизации

    def get(self, request):
        """Список всех кандидатов"""
        candidates = Candidate.objects.all().order_by("-id")
        data = [
            {
                "id": c.id,
                "email": c.email,
                "full_name": c.full_name,
                "invitations_count": c.invitations.count(),
            }
            for c in candidates
        ]
        return Response(data)

    def post(self, request):
        """Создать нового кандидата"""
        email = request.data.get("email")
        full_name = request.data.get("full_name")

        if not email or not full_name:
            return Response(
                {"error": "Email и ФИО обязательны"}, status=status.HTTP_400_BAD_REQUEST
            )

        candidate, created = Candidate.objects.get_or_create(
            email=email, defaults={"full_name": full_name}
        )

        if not created:
            return Response(
                {"error": "Кандидат с таким email уже существует"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "id": candidate.id,
                "email": candidate.email,
                "full_name": candidate.full_name,
            },
            status=status.HTTP_201_CREATED,
        )


class InvitationListView(APIView):
    permission_classes = [AllowAny]  # Временно разрешаем доступ без авторизации

    def get(self, request):
        """Список всех приглашений"""
        invitations = (
            Invitation.objects.select_related(
                "candidate", "test_template", "assigned_tech_lead"
            )
            .all()
            .order_by("-id")
        )

        data = [
            {
                "id": inv.id,
                "candidate": {
                    "id": inv.candidate.id,
                    "email": inv.candidate.email,
                    "full_name": inv.candidate.full_name,
                },
                "test_template": {
                    "id": inv.test_template.id,
                    "name": inv.test_template.name,
                },
                "unique_link": str(inv.unique_link),
                "interview_type": inv.interview_type,
                "interview_type_display": inv.get_interview_type_display(),
                "sent": inv.sent,
                "completed": inv.completed,
                "assigned_tech_lead": (
                    {
                        "id": inv.assigned_tech_lead.id,
                        "username": inv.assigned_tech_lead.username,
                    }
                    if inv.assigned_tech_lead
                    else None
                ),
                "tech_total_score": inv.tech_total_score,
            }
            for inv in invitations
        ]

        return Response(data)

    def post(self, request):
        """Создать новое приглашение"""
        candidate_id = request.data.get("candidate_id")
        test_template_id = request.data.get("test_template_id")
        interview_type = request.data.get("interview_type", "general")
        assigned_tech_lead_id = request.data.get("assigned_tech_lead_id")

        if not candidate_id or not test_template_id:
            return Response(
                {"error": "ID кандидата и шаблона теста обязательны"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            candidate = Candidate.objects.get(id=candidate_id)
            test_template = TestTemplate.objects.get(id=test_template_id)
        except (Candidate.DoesNotExist, TestTemplate.DoesNotExist):
            return Response(
                {"error": "Кандидат или шаблон теста не найдены"},
                status=status.HTTP_404_NOT_FOUND,
            )

        assigned_tech_lead = None
        if assigned_tech_lead_id:
            try:
                assigned_tech_lead = InterviewerUser.objects.get(
                    id=assigned_tech_lead_id, is_tech_lead=True
                )
            except InterviewerUser.DoesNotExist:
                return Response(
                    {"error": "Tech Lead не найден"}, status=status.HTTP_404_NOT_FOUND
                )

        invitation = Invitation.objects.create(
            candidate=candidate,
            test_template=test_template,
            interview_type=interview_type,
            assigned_tech_lead=assigned_tech_lead,
        )

        return Response(
            {
                "id": invitation.id,
                "candidate": {
                    "id": invitation.candidate.id,
                    "email": invitation.candidate.email,
                    "full_name": invitation.candidate.full_name,
                },
                "test_template": {
                    "id": invitation.test_template.id,
                    "name": invitation.test_template.name,
                },
                "unique_link": str(invitation.unique_link),
                "interview_type": invitation.interview_type,
                "interview_type_display": invitation.get_interview_type_display(),
                "sent": invitation.sent,
                "completed": invitation.completed,
            },
            status=status.HTTP_201_CREATED,
        )


class InvitationDetailView(APIView):
    permission_classes = [AllowAny]  # Временно разрешаем доступ без авторизации

    def get(self, request, pk):
        """Детали приглашения"""
        try:
            invitation = Invitation.objects.select_related(
                "candidate", "test_template", "assigned_tech_lead"
            ).get(id=pk)
        except Invitation.DoesNotExist:
            return Response(
                {"error": "Приглашение не найдено"}, status=status.HTTP_404_NOT_FOUND
            )

        # Получаем ответы
        answers = invitation.answers.select_related("question").all()
        answers_data = [
            {
                "id": a.id,
                "question": {
                    "id": a.question.id,
                    "text": a.question.text,
                    "question_type": a.question.question_type,
                },
                "response": a.response,
                "score": a.score,
            }
            for a in answers
        ]

        return Response(
            {
                "id": invitation.id,
                "candidate": {
                    "id": invitation.candidate.id,
                    "email": invitation.candidate.email,
                    "full_name": invitation.candidate.full_name,
                },
                "test_template": {
                    "id": invitation.test_template.id,
                    "name": invitation.test_template.name,
                },
                "unique_link": str(invitation.unique_link),
                "interview_type": invitation.interview_type,
                "interview_type_display": invitation.get_interview_type_display(),
                "sent": invitation.sent,
                "completed": invitation.completed,
                "assigned_tech_lead": (
                    {
                        "id": invitation.assigned_tech_lead.id,
                        "username": invitation.assigned_tech_lead.username,
                    }
                    if invitation.assigned_tech_lead
                    else None
                ),
                "tech_total_score": invitation.tech_total_score,
                "tech_comments": invitation.tech_comments,
                "answers": answers_data,
            }
        )

    def patch(self, request, pk):
        """Обновить приглашение (например, отметить как отправленное)"""
        try:
            invitation = Invitation.objects.get(id=pk)
        except Invitation.DoesNotExist:
            return Response(
                {"error": "Приглашение не найдено"}, status=status.HTTP_404_NOT_FOUND
            )

        if "sent" in request.data:
            invitation.sent = request.data["sent"]
        if "assigned_tech_lead_id" in request.data:
            tech_lead_id = request.data["assigned_tech_lead_id"]
            if tech_lead_id:
                try:
                    invitation.assigned_tech_lead = InterviewerUser.objects.get(
                        id=tech_lead_id, is_tech_lead=True
                    )
                except InterviewerUser.DoesNotExist:
                    return Response(
                        {"error": "Tech Lead не найден"},
                        status=status.HTTP_404_NOT_FOUND,
                    )
            else:
                invitation.assigned_tech_lead = None

        invitation.save()

        return Response(
            {
                "id": invitation.id,
                "sent": invitation.sent,
                "assigned_tech_lead": (
                    {
                        "id": invitation.assigned_tech_lead.id,
                        "username": invitation.assigned_tech_lead.username,
                    }
                    if invitation.assigned_tech_lead
                    else None
                ),
            }
        )


class TechLeadListView(APIView):
    permission_classes = [AllowAny]  # Временно разрешаем доступ without auth

    def get(self, request):
        """Список всех Tech Lead"""
        tech_leads = InterviewerUser.objects.filter(is_tech_lead=True)
        data = [
            {
                "id": tl.id,
                "username": tl.username,
                "email": tl.email,
                "first_name": tl.first_name,
                "last_name": tl.last_name,
            }
            for tl in tech_leads
        ]
        return Response(data)


class UserListView(APIView):
    """List all users (superuser/staff only)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser and not request.user.is_staff:
            return Response({"error": "Доступ запрещён"}, status=403)
        User = get_user_model()
        users = User.objects.all().order_by('-id')
        data = [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "is_hr": getattr(u, "is_hr", False),
                "is_tech_lead": getattr(u, "is_tech_lead", False),
                "is_staff": u.is_staff,
                "is_superuser": u.is_superuser,
            }
            for u in users
        ]
        return Response(data)


class UserDetailView(APIView):
    """Retrieve or update a user (roles/password)"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_superuser and not request.user.is_staff:
            return Response({"error": "Доступ запрещён"}, status=403)
        User = get_user_model()
        try:
            u = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"error": "Пользователь не найден"}, status=404)

        # Update role flags
        for flag in ("is_hr", "is_tech_lead", "is_staff", "is_superuser"):
            if flag in request.data:
                setattr(u, flag, bool(request.data.get(flag)))

        # Update password if provided
        if "password" in request.data and request.data.get("password"):
            u.password = make_password(request.data.get("password"))

        u.save()
        return Response({"success": True})


class QuestionListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Question.objects.all().order_by("-id")
        serializer = QuestionSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = QuestionCreateSerializer(data=request.data)
        if serializer.is_valid():
            q = serializer.save()
            return Response(QuestionSerializer(q).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuestionDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return Question.objects.get(id=pk)
        except Question.DoesNotExist:
            return None

    def get(self, request, pk):
        q = self.get_object(pk)
        if not q:
            return Response(
                {"error": "Вопрос не найден"}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(QuestionSerializer(q).data)

    def patch(self, request, pk):
        q = self.get_object(pk)
        if not q:
            return Response(
                {"error": "Вопрос не найден"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = QuestionCreateSerializer(q, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(QuestionSerializer(q).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TagListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tags = Tag.objects.all()
        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            tag = serializer.save()
            return Response(TagSerializer(tag).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TestTemplateAdminCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TestTemplateCreateSerializer(data=request.data)
        if serializer.is_valid():
            tpl = serializer.save()
            return Response(
                TestTemplateSerializer(tpl).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GenerateQuestionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """Generate question from text description using AI service"""
        try:
            description = request.data.get("description")
            logger.info(f"Generate question request with description: {description}")

            if not description or not description.strip():
                return Response(
                    {"error": "Description is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                # Call AI service
                ai_service_url = "http://ai-service:8001/generate_question"
                logger.info(f"Calling AI service at {ai_service_url}")
                response = httpx.post(
                    ai_service_url,
                    json={"description": description},
                    timeout=30.0,
                )
                logger.info(f"AI service response status: {response.status_code}")
                response.raise_for_status()
                ai_response = response.json()
                logger.info(f"AI response: {ai_response}")

                return Response(
                    {
                        "text": ai_response.get("question", ""),
                        "description_used": description,
                    },
                    status=status.HTTP_200_OK,
                )
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error calling AI service: {str(e)}", exc_info=True)
                return Response(
                    {"error": f"Failed to generate question: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            except Exception as e:
                logger.error(f"Error generating question: {str(e)}", exc_info=True)
                return Response(
                    {"error": f"Error: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            logger.error(f"Unexpected error in GenerateQuestionView: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Unexpected error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
