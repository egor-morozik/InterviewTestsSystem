from django import forms
from django.contrib import admin
from django.shortcuts import render
from django.utils.html import format_html
from django.urls import path, reverse
from django.http import HttpResponseRedirect
from .models import Candidate, Invitation, Answer
from interviewer_interface.models import TestTemplate


class InvitationAdminForm(forms.ModelForm):
    send_immediately = forms.BooleanField(
        label="Отправить приглашение сразу после сохранения",
        required=False,
        initial=True, 
        help_text="Если отмечено, кандидат получит ссылку автоматически."
    )
    class Meta:
        model = Invitation
        fields = '__all__'  

    def save(self, commit=True):
        instance = super().save(commit=False)
        if self.cleaned_data.get('send_immediately'):
            instance.sent = True
        if commit:
            instance.save()
        return instance
    
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
    form = InvitationAdminForm
    list_display = (
        'candidate',
        'test_template',
        'unique_link_short',
        'sent',
        'completed',
        'total_score',
        'view_answers',
        'resend_invitation',
    )
    list_filter = (
        'test_template', 
        'sent', 
        'completed'
        )
    search_fields = (
        'candidate__email', 
        'test_template__name',
        )
    actions = [
        'send_selected_invitations',
        ]
    exclude = ('sent', 
               'completed',
               )
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
        if obj.answers.exists():
            url = reverse('admin:candidate_interface_answer_changelist') + f'?invitation__id__exact={obj.id}'
            return format_html('<a href="{}">Ответы ({})</a>', url, obj.answers.count())
        return "Нет ответов"
    view_answers.short_description = "Ответы"

    def resend_invitation(self, obj):
        url = f"/admin/candidate_interface/invitation/{obj.pk}/send/"
        return format_html('<a href="{}">Выслать</a>', url)
    resend_invitation.short_description = "Выслать"

    def send_selected_invitations(self, request, queryset):
        for invitation in queryset:
            invitation.sent = True
            invitation.save()
        self.message_user(request, f"Отправлено/переотправлено {queryset.count()} приглашений.")
    send_selected_invitations.short_description = "Отправить/переотправить выбранные"

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:invitation_id>/send/',
                 self.admin_site.admin_view(self.send_single_invitation),
                 name='send_invitation'
                 ),
            path('results/',
                 self.admin_site.admin_view(self.results_view),
                 name='invitation_results'
                 ),
        ]
        return custom_urls + urls

    def send_single_invitation(self, request, invitation_id):
        invitation = Invitation.objects.get(pk=invitation_id)
        invitation.sent = True
        invitation.save()
        self.message_user(request, f"Приглашение для {invitation.candidate.email} отправлено/переотправлено.")
        return HttpResponseRedirect(
            request.META.get('HTTP_REFERER', 'admin:candidate_interface_invitation_changelist')
        )

    def results_view(self, request):
        invitations = Invitation.objects.filter(answers__isnull=False).distinct()
        context = {
            'title': 'Результаты тестов',
            'invitations': invitations,
            'site_header': 'Результаты',
            'site_title': 'Результаты',
        }
        return render(request, 'admin/candidate_interface/results.html', context)

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

    def has_module_permission(self, request):
        return False
    