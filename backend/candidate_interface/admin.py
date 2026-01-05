from django import forms
from django.conf import settings
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.core.mail import send_mail

from .utils import send_test_invitation_email

from .models import Candidate, Invitation, Answer, QuestionFeedback


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
            send_now = self.cleaned_data.get('send_immediately')

            if send_now:
                send_test_invitation_email(instance)  

            if commit:
                instance.save()
            return instance
        
@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display  = (
        'email', 
        'full_name',
        )
    search_fields = (
        'email', 
        'full_name',
        )

class QuestionFeedbackInline(admin.TabularInline):
    model = QuestionFeedback
    extra = 0
    fields = ('question', 'comment', 'score')
    readonly_fields = ('question',)

    def has_add_permission(self, request, obj):
        return request.user.is_tech_lead and obj and obj.interview_type == 'technical'

    def has_change_permission(self, request, obj=None):
        return request.user.is_tech_lead and obj and obj.interview_type == 'technical'
    
@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    form = InvitationAdminForm
    list_display = (
        'candidate',
        'test_template',
        'interview_type',         
        'assigned_tech_lead',
        'unique_link_short',
        'sent',
        'completed',
        'assigned_tech_lead',
        'total_score',
        'tab_switches_hidden_count',
        'tab_switches_visible_count',
        'view_answers',
        'resend_invitation',
        )
    list_filter = (
        'interview_type',
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
    exclude = (
        'sent', 
        'completed',
        )
    readonly_fields = (
        'unique_link',
        )
    inlines = [
        QuestionFeedbackInline,
        ]

    def get_inlines(self, request, obj):
            inlines = super().get_inlines(request, obj)
            if obj and obj.interview_type == 'general':
                return [] 
            return inlines
    
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

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:invitation_id>/send/',
                 self.admin_site.admin_view(self.send_single_invitation),
                 name='send_invitation'
                ),
            ]
        return custom_urls + urls

    def send_single_invitation(self, request, invitation_id):
        invitation = Invitation.objects.get(pk=invitation_id)

        if send_test_invitation_email(invitation):
            self.message_user(request, f"Письмо отправлено на {invitation.candidate.email}")
        else:
            self.message_user(request, f"Письмо уже было отправлено ранее.")

        return HttpResponseRedirect(
            request.META.get('HTTP_REFERER', 'admin:candidate_interface_invitation_changelist')
        )
    
    def send_selected_invitations(self, request, queryset):
        sent_count = 0
        for invitation in queryset:
            if send_test_invitation_email(invitation):
                sent_count += 1

        self.message_user(request, f"Отправлено {sent_count} новых писем.")
    send_selected_invitations.short_description = "Отправить приглашения по email"

    def tab_switches_hidden_count(self, obj):
        return obj.tab_switches.filter(event_type='hidden').count()
    tab_switches_hidden_count.short_description = "Уходов с вкладки"

    def tab_switches_visible_count(self, obj):
        return obj.tab_switches.filter(event_type='visible').count()
    tab_switches_visible_count.short_description = "Возвратов на вкладку"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_tech_lead and not request.user.is_hr:
            return qs.filter(assigned_tech_lead=request.user, interview_type='technical')
        return qs

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if obj and obj.interview_type == 'general':
            fields = [f for f in fields if f != 'assigned_tech_lead']
        return fields

    def get_readonly_fields(self, request, obj=None):
        readonly = super().get_readonly_fields(request, obj)
        if obj and obj.interview_type == 'general':
            readonly = list(readonly) + ['assigned_tech_lead']
        return readonly

    def has_add_permission(self, request):
        return request.user.is_hr

    def has_change_permission(self, request, obj=None):
        if obj and request.user.is_tech_lead and not request.user.is_hr:
            return False
        return super().has_change_permission(request, obj)


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
    