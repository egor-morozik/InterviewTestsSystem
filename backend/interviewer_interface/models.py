from django.contrib.auth.models import AbstractUser
from django.db import models


class InterviewerUser(AbstractUser):
    """
    Модель аккаунта сотрудника компании (HR/TechLead)
    """

    is_hr = models.BooleanField(
        default=False, 
        verbose_name="HR",
        )
    is_tech_lead = models.BooleanField(
        default=False, 
        verbose_name="Tech Lead",
        )


class TestTemplate(models.Model):
    """
    Модель набора вопросов
    """

    name = models.CharField(
        max_length=255,
        verbose_name="Название теста",
        )
    description = models.TextField(
        verbose_name="Описание",
        )
    questions = models.ManyToManyField(
        "Question",
        through="TestTemplateQuestion",
        related_name="templates",
        verbose_name="Вопросы",
        )
    time_limit = models.PositiveIntegerField(
        default=0,
        verbose_name="Ограничение по времени (минуты)",
        help_text="0 — без ограничения. Например, 60 для часа.",
        )

    def __str__(self):
        return f"{self.name}"


class TestTemplateQuestion(models.Model):
    """
    Модель для связывания наборов вопросов и вопросов внутри наборов
    """

    template = models.ForeignKey(TestTemplate, on_delete=models.CASCADE)
    question = models.ForeignKey("Question", on_delete=models.CASCADE)
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Порядок в тесте",
        help_text="Чем меньше — тем раньше вопрос",
        )

    class Meta:
        ordering = [
            "order",
            ]
        unique_together = (
            "template",
            "question",
            )
        verbose_name = "Вопрос в шаблоне"
        verbose_name_plural = "Вопросы в шаблоне"

    def __str__(self):
        return f"{self.template} — {self.question} (порядок {self.order})"


class Tag(models.Model):
    """
    Теги для вопросов
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Название тега")

    def __str__(self):
        return f"{self.name}"


class Question(models.Model):
    """
    Модель вопросов
    """

    QUESTION_TYPES = (
        ("text", "Свободный текст"),
        ("single_choice", "Выбор одного варианта"),
        ("multiple_choice", "Выбор нескольких вариантов"),
        ("code", "Написать код"),
        )
    QUESTION_COMPLEXITY = (
        ("easy", "Легко"),
        ("medium", "Средне"),
        ("hard", "Сложно"),
        )
    complexity = models.CharField(
        max_length=10,
        choices=QUESTION_COMPLEXITY,
        default="medium",
        verbose_name="Сложность вопроса",
        )
    text = models.TextField(verbose_name="Текст вопроса")
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPES,
        default="text",
        verbose_name="Тип вопроса",
        )
    correct_answer = models.TextField(
        verbose_name="Правильный ответ (для автооценки)",
        )
    stdin = models.TextField(
        blank=True,
        verbose_name="Входные данные для кода",
        )
    tags = models.ManyToManyField(
        Tag, blank=True, related_name="questions", verbose_name="Теги"
        )

    def __str__(self):
        return f"{self.text[:50]}{'...' if len(self.text) > 50 else ''}"


class Choice(models.Model):
    """
    Модель ответов на вопрос с типом "выбор" 
    """

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="choices",
        verbose_name="Вопрос",
        )
    text = models.CharField(
        max_length=255, 
        verbose_name="Текст варианта",
        )
    is_correct = models.BooleanField(
        default=False, 
        verbose_name="Правильный вариант",
        )
