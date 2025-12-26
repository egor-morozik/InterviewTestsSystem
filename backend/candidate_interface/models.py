import json
import uuid
from django.db import models
from interviewer_interface.models import TestTemplate, Question

class Candidate(models.Model):
    email = models.EmailField(
        unique=True, 
        verbose_name="Email кандидата",
        )
    full_name = models.CharField(
        max_length=255, 
        verbose_name="ФИО",
        )

class Invitation(models.Model):
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='invitations',
        verbose_name="Кандидат",
        )
    test_template = models.ForeignKey(
        TestTemplate,
        on_delete=models.PROTECT,
        related_name='invitations',
        verbose_name="Шаблон теста",
        )
    unique_link = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name="Уникальная ссылка",
        )
    sent = models.BooleanField(
        default=False, 
        verbose_name="Ссылка отправлена"
        ) 
    completed = models.BooleanField(
        default=False,
        verbose_name="Пройден",
        )

class Answer(models.Model):
    invitation = models.ForeignKey(
        Invitation,
        on_delete=models.CASCADE,
        related_name='answers',
        verbose_name="Приглашение",
        )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        verbose_name="Вопрос",
        )
    response = models.TextField(
        verbose_name="Ответ кандидата",
        )
    score = models.IntegerField(
        default=0,
        verbose_name="Баллы (автооценка)",
        )
    
    def auto_evaluate(self):
        if not self.question.correct_answer:
            self.score = 0
            return

        q_type = self.question.question_type
        user_response = self.response.strip()

        if q_type == 'text':
            correct = self.question.correct_answer.strip()
            self.score = 10 if user_response == correct else 0

        elif q_type == 'single_choice':
            try:
                correct_id = int(self.question.correct_answer)
                user_id = int(user_response)
                self.score = 10 if correct_id == user_id else 0
            except:
                self.score = 0

        elif q_type == 'multiple_choice':
            try:
                correct_ids = set(json.loads(self.question.correct_answer))
                user_ids = set(json.loads(user_response)) if user_response else set()
                self.score = 10 if correct_ids == user_ids else 0
            except:
                self.score = 0

        elif q_type == 'code':
            self.score = 0

    def save(self, *args, **kwargs):
        if not self.id: 
            self.auto_evaluate()
        super().save(*args, **kwargs)
