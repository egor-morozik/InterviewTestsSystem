from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Candidate, Invitation, Answer
from interviewer_interface.models import TestTemplate


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display  = ('email', 'full_name')
    search_fields = ('email', 'full_name')

    def invitation_count(self, obj):
        return obj.invitations.count()
    invitation_count.short_description = "Приглашений"

@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'test_template', 'unique_link_short')
    list_filter = ('test_template', 'sent', 'created_at')
    search_fields = ('candidate__email', 'test_template__name')
    actions = ['send_selected_invitations']
    readonly_fields = ('unique_link',)
    def unique_link_short(self, obj):
        return str(obj.unique_link)[:8] + "..."
    unique_link_short.short_description = "Ссылка"

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('invitation', 'question_truncated', 'score', 'evaluated_at')
    list_filter = ('invitation__test_template', 'score', 'invitation__candidate')
    search_fields = ('invitation__candidate__email', 'question__text')
    readonly_fields = ('invitation', 'question', 'response', 'score')

    def question_truncated(self, obj):
        return obj.question.text[:60] + "..." if len(obj.question.text) > 60 else obj.question.text
    question_truncated.short_description = "Вопрос"
