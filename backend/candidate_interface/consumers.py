import json
import logging
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


class InterviewConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.unique_link = self.scope["url_route"]["kwargs"]["unique_link"]
        self.room_group_name = f"interview_{self.unique_link}"
        self.user = self.scope.get("user")
        self.is_interviewer = False

        invitation, user_role = await self.validate_access()
        if not invitation:
            await self.close(code=4003, reason="Unauthorized")
            return

        self.is_interviewer = user_role == "interviewer"
        self.sender_name = "Tech Lead" if self.is_interviewer else "Candidate"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.send_initial_data()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "code_update":
                if self.is_interviewer:
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": "Only candidate can update code"
                    }))
                    return

                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "code_update",
                    "code": data.get("code", ""),
                    "question_id": data.get("question_id"),
                    "sender": self.sender_name,
                })

            elif message_type == "chat_message":
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "chat_message",
                    "message": data.get("message", ""),
                    "sender": self.sender_name,
                })

            elif message_type == "run_code":
                if self.is_interviewer:
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": "Only candidate can run code"
                    }))
                    return

                result = await self.execute_code(data.get("code", ""))
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "code_result",
                    "stdout": result.get("stdout", ""),
                    "stderr": result.get("stderr", ""),
                    "time": result.get("time", "0s"),
                    "status": result.get("status", "error"),
                })
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid JSON"
            }))

    async def code_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "code_update",
            "code": event.get("code", ""),
            "question_id": event.get("question_id"),
            "sender": event.get("sender", ""),
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event.get("message", ""),
            "sender": event.get("sender", ""),
        }))

    async def code_result(self, event):
        await self.send(text_data=json.dumps({
            "type": "code_result",
            "stdout": event.get("stdout", ""),
            "stderr": event.get("stderr", ""),
            "time": event.get("time", "0s"),
            "status": event.get("status", "error"),
        }))

    @database_sync_to_async
    def validate_access(self):
        from .models import Invitation

        try:
            invitation = Invitation.objects.get(
                unique_link=self.unique_link, interview_type="technical"
            )
        except ObjectDoesNotExist:
            return None, None

        if not self.user or not self.user.is_authenticated:
            return None, None

        if invitation.assigned_tech_lead_id and self.user.id == invitation.assigned_tech_lead_id:
            return invitation, "interviewer"

        return invitation, "candidate"

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
            "is_interviewer": self.is_interviewer,
            "sender_name": self.sender_name,
        }

    async def send_initial_data(self):
        data = await self.get_initial_data()
        await self.send(text_data=json.dumps({"type": "initial_data", **data}))

    async def execute_code(self, code_text):
        if not code_text or not code_text.strip():
            return {
                "stdout": "",
                "stderr": "Empty code",
                "time": "0s",
                "status": "error"
            }

        try:
            logger.warning("Code execution - Judge0 integration pending")
            return {
                "stdout": "Mock output (Judge0 integration pending)",
                "stderr": "",
                "time": "0.1s",
                "status": "success"
            }
        except Exception as e:
            logger.error(f"Code execution error: {str(e)}")
            return {
                "stdout": "",
                "stderr": f"Error: {str(e)}",
                "time": "0s",
                "status": "error"
            }
