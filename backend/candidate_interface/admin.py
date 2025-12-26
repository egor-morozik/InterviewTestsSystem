from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.http import HttpResponseRedirect
from .models import Candidate, Invitation, Answer
from interviewer_interface.models import TestTemplate


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display  = ('email', 
                     'full_name',
                     )
    search_fields = ('email', 
                     'full_name',
                     )

    def invitation_count(self, obj):
        return obj.invitations.count()
    invitation_count.short_description = "Приглашений"

@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = (
        'candidate',
        'test_template',
        'unique_link_short',
        'sent',
        'total_score',
        'view_answers',
        'send_link',
        )
    list_filter = (
        'test_template', 
        'sent', 
        )
    search_fields = (
        'candidate__email', 
        'test_template__name',
        )
    actions = [
        'send_selected_invitations',
        ]
    readonly_fields = (
        'unique_link', 
        )

    def unique_link_short(self, obj):
        return str(obj.unique_link)[:8] + "..."
    unique_link_short.short_description = "Ссылка"

    def total_score(self, obj):
        return sum(a.score for a in obj.answers.all())
    total_score.short_description = "Общий балл"

    def view_answers(self, obj):
        url = reverse('admin:candidate_interface_answer_changelist') + f'?invitation__id__exact={obj.id}'
        return format_html('<a href="{}">Ответы ({})</a>', url, obj.answers.count())
    view_answers.short_description = "Просмотр"

    def unique_link_short(self, obj):
        return str(obj.unique_link)[:8] + "..."
    unique_link_short.short_description = "Ссылка"

    def send_link(self, obj):
            if obj.sent:
                return "Отправлено"
            url = reverse('admin:send_invitation', args=[obj.pk])
            return format_html('<a href="{}">Отправить</a>', url)
    send_link.short_description = "Действие"

    def send_selected_invitations(self, request, queryset):
        for invitation in queryset.filter(sent=False):
            invitation.sent = True
            invitation.save()
        self.message_user(request, f"Отправлено {queryset.count()} приглашений.")
    send_selected_invitations.short_description = "Отправить выбранные приглашения"

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:invitation_id>/send/', self.admin_site.admin_view(self.send_single_invitation), name='send_invitation'),
        ]
        return custom_urls + urls
    
    def send_single_invitation(self, request, invitation_id):
        invitation = Invitation.objects.get(pk=invitation_id)
        if not invitation.sent:
            invitation.sent = True
            invitation.save()
            self.message_user(request, f"Приглашение для {invitation.candidate.email} отправлено.")
        return HttpResponseRedirect(request.META.get('HTTP_REFERER', 'admin:candidate_interface_invitation_changelist'))

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = (
        'invitation',
        'question_truncated',
        'response_truncated',
        'score',
        'correct_answer_truncated',
        )
    list_filter = (
        'invitation__test_template', 
        'invitation__candidate', 
        'score'
        )
    search_fields = (
        'invitation__candidate__email', 
        'question__text', 
        'response'
        )
    readonly_fields = (
        'invitation', 
        'question', 
        'response', 
        'score'
        )
    def question_truncated(self, obj):
        return obj.question.text[:60] + "..." if len(obj.question.text) > 60 else obj.question.text
    question_truncated.short_description = "Вопрос"

    def response_truncated(self, obj):
        return obj.response[:60] + "..." if len(obj.response) > 60 else obj.response
    response_truncated.short_description = "Ответ"

    def correct_answer_truncated(self, obj):
        return obj.question.correct_answer[:60] + "..." if len(obj.question.correct_answer) > 60 else obj.question.correct_answer
    correct_answer_truncated.short_description = "Правильный"

    def question_truncated(self, obj):
        return obj.question.text[:60] + "..." if len(obj.question.text) > 60 else obj.question.text
    question_truncated.short_description = "Вопрос"
