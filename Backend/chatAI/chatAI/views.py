from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from chat.models import ChatMessage, Doctor, Appointment
from django.utils import timezone
import json

@csrf_exempt
def message_api(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user_msg = data.get("message", "").strip()

        if not user_msg:
            return JsonResponse({"reply": "⚠️ Please type a message."})

        # Save user message
        ChatMessage.objects.create(role="user", content=user_msg)

        # Example disease detection
        if "fever" in user_msg.lower():
            reply = "🩺 You might have a flu. Would you like to see doctors?"
        elif "doctor" in user_msg.lower():
            doctors = list(Doctor.objects.values("name", "specialization"))
            reply = "Here are available doctors:\n" + "\n".join(
                [f"{d['name']} ({d['specialization']})" for d in doctors]
            )
        else:
            reply = "🤖 I’m still learning! Please tell me your symptoms."

        # Save chatbot reply
        ChatMessage.objects.create(role="assistant", content=reply)

        return JsonResponse({"reply": reply})

    return JsonResponse({"error": "Invalid request"}, status=400)
