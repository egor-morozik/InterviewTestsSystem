from django.core.mail import send_mail
from django.conf import settings

from dotenv import load_dotenv
import os

load_dotenv()

def send_test_invitation_email(invitation):
    if invitation.sent:
        return False

    test_link = f"{os.getenv('HOST_PORT_FULL')}/test/{invitation.unique_link}/"

    subject = f"Приглашение на тест: {invitation.test_template.name}"
    message = f"""
                Здравствуйте, {invitation.candidate.full_name}!

                Вы приглашены на прохождение теста "{invitation.test_template.name}".

                Пройдите тест по ссылке:
                {test_link}

                Ссылка действительна один раз. Не передавайте её третьим лицам.

                Удачи!
                HR-отдел
                """

    send_mail(
        subject=subject.strip(),
        message=message.strip(),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[invitation.candidate.email],
        fail_silently=False,  
    )

    invitation.sent = True
    invitation.save(update_fields=['sent'])
    return True
