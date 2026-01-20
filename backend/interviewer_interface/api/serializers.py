from rest_framework import serializers

from ..models import Choice, Question, Tag, TestTemplate


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name")


class QuestionSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ("id", "text", "question_type", "complexity", "tags")


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("id", "text", "is_correct")


class QuestionCreateSerializer(serializers.ModelSerializer):
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
        )
    choices = ChoiceSerializer(
        many=True, write_only=True, required=False
        )

    class Meta:
        model = Question
        fields = (
            "id",
            "text",
            "question_type",
            "complexity",
            "correct_answer",
            "stdin",
            "tag_ids",
            "choices",
            )

    def create(self, validated_data):
        tag_ids = validated_data.pop("tag_ids", [])
        choices_data = validated_data.pop("choices", [])
        question = Question.objects.create(**validated_data)
        if tag_ids:
            question.tags.set(tag_ids)
        for choice in choices_data:
            Choice.objects.create(question=question, **choice)
        return question


class TestTemplateCreateSerializer(serializers.ModelSerializer):
    questions = serializers.ListField(
        child=serializers.DictField(), write_only=True
        )

    class Meta:
        model = TestTemplate
        fields = ("id", "name", "description", "time_limit", "questions")

    def create(self, validated_data):
        questions = validated_data.pop("questions", [])
        template = TestTemplate.objects.create(**validated_data)
        order = 0
        for item in questions:
            if isinstance(item, dict):
                qid = item.get("question_id") or item.get("id")
                order = item.get("order", order)
            else:
                qid = item
            try:
                q = Question.objects.get(id=qid)
                TestTemplateQuestion = TestTemplate._meta.get_field(
                    "questions"
                ).remote_field.through
                TestTemplateQuestion.objects.create(
                    template=template, question=q, order=order
                )
            except Question.DoesNotExist:
                continue
            order += 1
        return template


class TestTemplateSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()

    class Meta:
        model = TestTemplate
        fields = ("id", "name", "description", "time_limit", "questions")

    def get_questions(self, obj):
        ordered = obj.testtemplatequestion_set.all().order_by("order")
        return QuestionSerializer([tq.question for tq in ordered], many=True).data
