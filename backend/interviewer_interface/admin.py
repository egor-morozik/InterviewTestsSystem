from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import path, reverse

from .models import Choice, Question, Tag, TestTemplate, TestTemplateQuestion
from .models import InterviewerUser
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4


class TestTemplateQuestionInline(admin.TabularInline):
    model = TestTemplateQuestion
    extra = 1
    fields = ("question", "order")
    raw_id_fields = ("question",)


@admin.register(TestTemplate)
class TestTemplateAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "question_count",
    )
    search_fields = (
        "name",
        "description",
    )
    fields = (
        "name",
        "description",
        "time_limit",
    )
    inlines = [
        TestTemplateQuestionInline,
    ]

    def question_count(self, obj):
        return obj.questions.count()

    question_count.short_description = "Вопросов"


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "question_count",
    )
    search_fields = ("name",)

    def question_count(self, obj):
        return obj.questions.count()

    question_count.short_description = "Вопросов"


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        "text_truncated",
        "question_type",
        "answer_truncated",
        "tags_list",
        "complexity",
    )
    filter_horizontal = ("tags",)
    list_filter = (
        "question_type",
        "complexity",
        "tags__name",
    )
    search_fields = ("text",)
    inlines = [
        ChoiceInline,
    ]

    def text_truncated(self, obj):
        return obj.text[:80] + "..." if len(obj.text) > 80 else obj.text

    def answer_truncated(self, obj):
        return (
            obj.correct_answer[:80] + "..."
            if len(obj.correct_answer) > 80
            else obj.correct_answer
        )

    def tags_list(self, obj):
        return ", ".join(tag.name for tag in obj.tags.all())

    text_truncated.short_description = "Вопрос"
    answer_truncated.short_description = "Правильный ответ"
    tags_list.short_description = "Теги"


# Register InterviewerUser with role flags editable
@admin.register(InterviewerUser)
class InterviewerUserAdmin(UserAdmin):
    list_display = ("username", "email", "is_hr", "is_tech_lead", "is_staff", "is_superuser")
    list_filter = ("is_hr", "is_tech_lead", "is_staff")
    search_fields = ("username", "email")
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "email")} ),
        ("Roles", {"fields": ("is_hr", "is_tech_lead", "is_staff", "is_superuser")} ),
        ("Permissions", {"fields": ("is_active", "groups", "user_permissions")} ),
    )
