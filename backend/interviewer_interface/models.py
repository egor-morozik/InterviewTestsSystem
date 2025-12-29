from django.contrib.auth.models import AbstractUser
from django.db import models

class InterviewerUser(AbstractUser):
    pass

class TestTemplate(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name="Название теста",
        )
    description = models.TextField(
        verbose_name="Описание",
        )
    def __str__(self):
        return f"{self.name}"

class Question(models.Model):
    QUESTION_TYPES = (
        ('text', 'Свободный текст'),
        ('single_choice', 'Выбор одного варианта'),
        ('multiple_choice', 'Выбор нескольких вариантов'),
        ('code', 'Написать код'),
        )

    template = models.ForeignKey(
        'TestTemplate',
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name="Шаблон теста",
        )
    text = models.TextField(verbose_name="Текст вопроса")
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPES,
        default='text',
        verbose_name="Тип вопроса",
        )
    correct_answer = models.TextField(
        verbose_name="Правильный ответ (для автооценки)",
        )  
    stdin = models.TextField(
        blank=True, 
        verbose_name="Входные данные для кода",
        )
    
class Choice(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='choices',
        verbose_name="Вопрос",
        )
    text = models.CharField(
        max_length=255, 
        verbose_name="Текст варианта"
        )
    is_correct = models.BooleanField(
        default=False, 
        verbose_name="Правильный вариант"
        )
