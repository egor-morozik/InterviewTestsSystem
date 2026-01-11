from rest_framework import serializers

from ..models import Question, Tag, TestTemplate


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name")


class QuestionSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ("id", "text", "question_type", "complexity", "tags")


class TestTemplateSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()

    class Meta:
        model = TestTemplate
        fields = ("id", "name", "description", "time_limit", "questions")

    def get_questions(self, obj):
        ordered = obj.testtemplatequestion_set.all().order_by("order")
        return QuestionSerializer([tq.question for tq in ordered], many=True).data
