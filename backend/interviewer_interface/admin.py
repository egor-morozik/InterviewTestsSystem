from django.contrib import admin

from .models import TestTemplate, Question


@admin.register(TestTemplate)
class TestTemplateAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name', 'description')

    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = "Вопросов"

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text_truncated', 'template', 'answer_truncated')
    list_filter = ('template',)
    search_fields = ('text',)

    def text_truncated(self, obj):
        return obj.text[:80] + "..." if len(obj.text) > 80 else obj.text
    def answer_truncated(self, obj):
        return obj.correct_answer[:80] + "..." if len(obj.correct_answer) > 80 else obj.correct_answer
    text_truncated.short_description = "Вопрос"
    answer_truncated.short_description = "Правильный ответ"
