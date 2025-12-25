from django.contrib.auth.models import AbstractUser
from django.db import models

class InterviewerUser(AbstractUser):
    pass

class TestTemplate(models.Model):
    name = models.CharField(
        verbose_name="Название теста"
        )
    description = models.TextField(
        verbose_name="Описание"
        )

class Question(models.Model):
    template = models.ForeignKey(
        TestTemplate,
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name="Шаблон теста"
    )
    text = models.TextField(
        verbose_name="Текст вопроса"
        )
    correct_answer = models.TextField(
        verbose_name="Правильный ответ (для автооценки)"
    )
