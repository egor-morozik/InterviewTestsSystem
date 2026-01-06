import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import candidate_interface.routing 

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'interview_system.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            candidate_interface.routing.websocket_urlpatterns
        )
    ),
})
