from rest_framework import serializers

from interviewer_interface.models import Choice, Question

from ..models import Answer, Invitation


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("id", "text", "is_correct")


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ("id", "text", "question_type", "complexity", "choices", "stdin")


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ("question", "response", "score")


class TestSessionSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()
    candidate_name = serializers.CharField(source="candidate.full_name", read_only=True)
    template_name = serializers.CharField(source="test_template.name", read_only=True)
    remaining_time = serializers.SerializerMethodField()

    class Meta:
        model = Invitation
        fields = (
            "id",
            "unique_link",
            "candidate_name",
            "template_name",
            "interview_type",
            "completed",
            "questions",
            "remaining_time",
        )

    def get_questions(self, obj):
        ordered = obj.test_template.testtemplatequestion_set.all().order_by("order")
        return QuestionSerializer([tq.question for tq in ordered], many=True).data

    def get_remaining_time(self, obj):
        request = self.context.get("request")
        if not request:
            return None

        template = obj.test_template
        time_limit_seconds = template.time_limit * 60
        if time_limit_seconds <= 0:
            return None

        session_key = f"test_start_{obj.unique_link}"
        if session_key not in request.session:
            return time_limit_seconds

        from django.utils import timezone

        start_timestamp = request.session[session_key]
        elapsed = timezone.now().timestamp() - start_timestamp
        remaining = int(time_limit_seconds - elapsed)
        return max(0, remaining)


class QuestionDetailSerializer(serializers.Serializer):
    question = QuestionSerializer(read_only=True)
    current_answer = AnswerSerializer(required=False, allow_null=True, read_only=True)
    is_first = serializers.BooleanField(read_only=True)
    is_last = serializers.BooleanField(read_only=True)
    current_index = serializers.IntegerField(read_only=True)
    total_questions = serializers.IntegerField(read_only=True)

    def to_representation(self, instance):
        return {
            "question": QuestionSerializer(instance["question"]).data,
            "current_answer": (
                AnswerSerializer(instance["current_answer"]).data
                if instance.get("current_answer")
                else None
            ),
            "is_first": instance["is_first"],
            "is_last": instance["is_last"],
            "current_index": instance["current_index"],
            "total_questions": instance["total_questions"],
        }


class InvitationSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()
    candidate_name = serializers.CharField(source="candidate.full_name", read_only=True)
    template_name = serializers.CharField(source="test_template.name", read_only=True)

    class Meta:
        model = Invitation
        fields = (
            "id",
            "unique_link",
            "candidate_name",
            "template_name",
            "interview_type",
            "assigned_tech_lead",
            "completed",
            "questions",
        )

    def get_questions(self, obj):
        ordered = obj.test_template.testtemplatequestion_set.all().order_by("order")
        return QuestionSerializer([tq.question for tq in ordered], many=True).data
