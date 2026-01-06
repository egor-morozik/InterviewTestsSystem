from interviewer_interface.models import Question
from rest_framework import serializers

from ..models import Answer, Invitation


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ("id", "text", "question_type", "complexity")


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ("question", "response", "score")


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
