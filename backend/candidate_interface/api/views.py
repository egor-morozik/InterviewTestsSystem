import json

from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..api.serializers import (
    InvitationSerializer,
    QuestionDetailSerializer,
    TestSessionSerializer,
)
from interviewer_interface.models import Question

from ..models import Answer, Invitation


class TestSessionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, unique_link):
        try:
            invitation = Invitation.objects.get(unique_link=unique_link)
        except Invitation.DoesNotExist:
            return Response({"error": "Приглашение не найдено"}, status=404)

        if invitation.completed:
            return Response({"error": "Тест уже завершён", "completed": True}, status=400)

        template = invitation.test_template
        time_limit_seconds = template.time_limit * 60

        if time_limit_seconds > 0:
            session_key = f"test_start_{unique_link}"
            if session_key not in request.session:
                request.session[session_key] = timezone.now().timestamp()
                request.session.modified = True

            start_timestamp = request.session[session_key]
            elapsed = timezone.now().timestamp() - start_timestamp

            if elapsed >= time_limit_seconds:
                invitation.completed = True
                invitation.save()
                return Response({"error": "Время истекло", "completed": True}, status=400)

        serializer = TestSessionSerializer(invitation, context={"request": request})
        return Response(serializer.data)


class QuestionDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, unique_link, question_id):
        try:
            invitation = Invitation.objects.get(unique_link=unique_link)
        except Invitation.DoesNotExist:
            return Response({"error": "Приглашение не найдено"}, status=404)

        if invitation.completed:
            return Response({"error": "Тест уже завершён"}, status=400)

        template_questions = invitation.test_template.testtemplatequestion_set.all().order_by("order")
        questions = [tq.question for tq in template_questions]

        try:
            current_index = next(i for i, q in enumerate(questions) if q.id == question_id)
            current_question = questions[current_index]
        except StopIteration:
            return Response({"error": "Вопрос не найден в этом тесте"}, status=404)

        try:
            current_answer = Answer.objects.get(invitation=invitation, question=current_question)
        except Answer.DoesNotExist:
            current_answer = None

        serializer = QuestionDetailSerializer({
            "question": current_question,
            "current_answer": current_answer,
            "is_first": current_index == 0,
            "is_last": current_index == len(questions) - 1,
            "current_index": current_index + 1,
            "total_questions": len(questions),
        })
        return Response(serializer.data)


class SubmitAnswerView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, unique_link, question_id):
        try:
            invitation = Invitation.objects.get(unique_link=unique_link)
        except Invitation.DoesNotExist:
            return Response({"error": "Приглашение не найдено"}, status=404)

        if invitation.completed:
            return Response({"error": "Тест уже завершён"}, status=400)

        try:
            current_question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({"error": "Вопрос не найден"}, status=404)

        response_value = request.data.get("response", "")
        # Normalize response to a string safely (it may be sent as a JSON array/object)
        if isinstance(response_value, str):
            response_value = response_value.strip()
        else:
            try:
                response_value = json.dumps(response_value)
            except Exception:
                response_value = str(response_value)

        switches = request.data.get("switches", 0)

        if current_question.question_type == "multiple_choice":
            try:
                json.loads(response_value)
            except (json.JSONDecodeError, TypeError):
                return Response({"error": "Неверный формат ответа"}, status=400)

        answer_obj, created = Answer.objects.update_or_create(
            invitation=invitation,
            question=current_question,
            defaults={"response": response_value},
        )

        return Response({"status": "ok", "answer_id": answer_obj.id})


class FinishTestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, unique_link):
        try:
            invitation = Invitation.objects.get(unique_link=unique_link)
        except Invitation.DoesNotExist:
            return Response({"error": "Приглашение не найдено"}, status=404)

        if invitation.completed:
            return Response({"error": "Тест уже завершён"}, status=400)

        invitation.completed = True
        invitation.save()

        for answer in invitation.answers.all():
            answer.auto_evaluate()
            answer.save()

        return Response({"status": "ok", "message": "Тест успешно завершён"})


class LogTabSwitchView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, unique_link):
        try:
            invitation = Invitation.objects.get(unique_link=unique_link)
        except Invitation.DoesNotExist:
            return Response({"error": "Приглашение не найдено"}, status=404)

        event_type = request.data.get("state")
        if event_type not in ["hidden", "visible"]:
            return Response({"error": "Неверный тип события"}, status=400)

        from ..models import TabSwitchLog

        TabSwitchLog.objects.create(invitation=invitation, event_type=event_type)
        count = invitation.tab_switches.count()
        return Response({"status": "ok", "count": count})


class InterviewSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, unique_link):
        try:
            invitation = Invitation.objects.get(unique_link=unique_link)
        except Invitation.DoesNotExist:
            return Response({"error": "Приглашение не найдено"}, status=404)

        if invitation.interview_type == "technical":
            if request.user != invitation.assigned_tech_lead and not request.user.is_hr:
                return Response({"error": "Доступ запрещён"}, status=403)

        serializer = InvitationSerializer(invitation)
        return Response(serializer.data)
