from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import path, reverse

from .models import Tag, TestTemplate, Question, Choice, TestTemplateQuestion


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4  

class TestTemplateQuestionInline(admin.TabularInline):
    model = TestTemplateQuestion
    extra = 1
    fields = (
        'question', 
        'order'
        )
    raw_id_fields = (
        'question',
        )  

@admin.register(TestTemplate)
class TestTemplateAdmin(admin.ModelAdmin):
    list_display = (
        'name', 
        'question_count',
        )
    search_fields = (
        'name', 
        'description',
        )
    fields = (
        'name', 
        'description', 
        'time_limit',
        )
    inlines = [
        TestTemplateQuestionInline,
        ]

    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = "Вопросов"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                'results/', self.admin_site.admin_view(self.results_view), 
                name='results'
                ),
        ]
        return custom_urls + urls

    def results_view(self, request):
        return HttpResponseRedirect(
            reverse('admin:candidate_interface_invitation_results')
            )

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = (
        'name', 
        'question_count',
        )
    search_fields = (
        'name',
        )

    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = "Вопросов"
    
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        'text_truncated', 
        'question_type',
        'answer_truncated',
        'tags_list',
        'complexity',
        )
    filter_horizontal = (
        'tags',
        )
    list_filter = (
        'question_type',
        'complexity',
        'tags__name',
        )
    search_fields = (
        'text',
        )
    inlines = [
        ChoiceInline,
        ]

    def text_truncated(self, obj):
        return obj.text[:80] + "..." if len(obj.text) > 80 else obj.text
    def answer_truncated(self, obj):
        return obj.correct_answer[:80] + "..." if len(obj.correct_answer) > 80 else obj.correct_answer
    def tags_list(self, obj):
        return ", ".join(tag.name for tag in obj.tags.all())
    text_truncated.short_description = "Вопрос"
    answer_truncated.short_description = "Правильный ответ"
    tags_list.short_description = "Теги"
