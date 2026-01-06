from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.candidate_interface.api.serializers import InvitationSerializer

from ..models import Invitation


class InterviewSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, unique_link):
        invitation = Invitation.objects.get(unique_link=unique_link)

        if invitation.interview_type == "technical":
            if request.user != invitation.assigned_tech_lead and not request.user.is_hr:
                return Response({"error": "Доступ запрещён"}, status=403)

        serializer = InvitationSerializer(invitation)
        return Response(serializer.data)
