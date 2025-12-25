from django.db import models

import uuid
from django.db import models
from interviewer_interface.models import TestTemplate, Question

class Candidate(models.Model):
    email = models.EmailField(unique=True, 
                              verbose_name="Email кандидата",
                              )
    full_name = models.CharField(max_length=255, 
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
 