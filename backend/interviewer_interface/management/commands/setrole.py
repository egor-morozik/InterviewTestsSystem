from django.core.management.base import BaseCommand
from interviewer_interface.models import InterviewerUser

class Command(BaseCommand):
    help = "Assign role to a user: setrole <username> <hr|tech|staff>"

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument("role")

    def handle(self, *args, **options):
        u = InterviewerUser.objects.filter(username=options["username"]).first()
        if not u:
            self.stdout.write(self.style.ERROR("User not found"))
            return
        role = options["role"].lower()
        if role == "hr":
            u.is_hr = True
        elif role == "tech":
            u.is_tech_lead = True
        elif role == "staff":
            u.is_staff = True
        else:
            self.stdout.write(self.style.ERROR("Unknown role"))
            return
        u.save()
        self.stdout.write(self.style.SUCCESS(f"Updated {u.username}: {role}"))
