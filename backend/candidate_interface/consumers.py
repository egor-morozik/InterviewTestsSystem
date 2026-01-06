import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.exceptions import ObjectDoesNotExist


class InterviewConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.unique_link = self.scope["url_route"]["kwargs"]["unique_link"]
        self.room_group_name = f"interview_{self.unique_link}"

        invitation_exists = await self.get_invitation_exists()
        if not invitation_exists:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.send_initial_data()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")

        if message_type == "code_update":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "code_update",
                    "code": data["code"],
                    "question_id": data["question_id"],
                },
            )

        elif message_type == "chat_message":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": data["message"],
                    "sender": data["sender"],
                },
            )

        elif message_type == "run_code":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "code_result",
                    "stdout": "Пример вывода (Judge0 позже)",
                    "stderr": "",
                    "time": "0.1s",
                },
            )

    async def code_update(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "code_update",
                    "code": event["code"],
                    "question_id": event["question_id"],
                }
            )
        )

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat_message",
                    "message": event["message"],
                    "sender": event["sender"],
                }
            )
        )

    async def code_result(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "code_result",
                    "stdout": event["stdout"],
                    "stderr": event["stderr"],
                    "time": event["time"],
                }
            )
        )

    @database_sync_to_async
    def get_invitation_exists(self):
        from .models import Invitation

        try:
            Invitation.objects.get(
                unique_link=self.unique_link, interview_type="technical"
            )
            return True
        except ObjectDoesNotExist:
            return False

    @database_sync_to_async
    def get_initial_data(self):
        from .models import Invitation

        invitation = Invitation.objects.get(unique_link=self.unique_link)
        questions = list(
            invitation.test_template.testtemplatequestion_set.all()
            .order_by("order")
            .values("question__id", "question__text", "question__question_type")
        )
        return {
            "questions": questions,
            "current_question_id": questions[0]["question__id"] if questions else None,
            "candidate_name": invitation.candidate.full_name,
            "template_name": invitation.test_template.name,
        }

    async def send_initial_data(self):
        data = await self.get_initial_data()
        await self.send(text_data=json.dumps({"type": "initial_data", **data}))
