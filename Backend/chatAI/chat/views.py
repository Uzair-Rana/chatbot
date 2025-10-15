# chat/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from chat.models import ChatMessage, Doctor
import json
import re

def normalize_text(s: str) -> str:
    return re.sub(r'[^a-z0-9\s]', ' ', s.lower())

def extract_symptom_tokens(message: str):
    """
    Return list of tokens / candidate symptom phrases from message.
    We'll include uni-grams and important bi-grams to increase match chance.
    """
    text = normalize_text(message)
    words = [w for w in text.split() if len(w) > 1]
    tokens = set(words)

    # generate simple bigrams
    for i in range(len(words)-1):
        tokens.add(f"{words[i]} {words[i+1]}")

    return sorted(tokens, key=lambda x: -len(x))  # longer first

@csrf_exempt
def message_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    try:
        data = json.loads(request.body or "{}")
        user_msg = data.get("message", "").strip()
    except Exception:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)

    if not user_msg:
        return JsonResponse({"reply": "⚠️ Please enter a message."})

    # save user message
    ChatMessage.objects.create(role="user", content=user_msg)

    u = user_msg.lower()
    reply = ""
    next_action = None

    # greeting
    greetings = ["hi","hello","hey","assalam","salaam","good morning","good evening"]
    if any(g in u for g in greetings):
        reply = (
            "👋 Assalamu Alaikum! I’m your health assistant.\n"
            "Tell me your symptom (e.g., 'I have a fever' or 'I feel chest pain') "
            "and I will show doctors who treat it."
        )
        ChatMessage.objects.create(role="assistant", content=reply)
        return JsonResponse({"reply": reply, "conversation": get_conversation(), "next": "greeted"})

    # extract tokens from user message
    tokens = extract_symptom_tokens(user_msg)

    # collect candidate doctors and score them based on matched tokens
    candidates = []
    for doc in Doctor.objects.all():
        doc_symptoms = [s.strip().lower() for s in (doc.symptoms or "").split(",") if s.strip()]
        matched = set()
        for tok in tokens:
            # check full token match against any symptom token or symptom contains token
            for ds in doc_symptoms:
                if tok == ds or tok in ds or ds in tok:
                    matched.add(ds)
        if matched:
            candidates.append({
                "doctor": doc,
                "match_count": len(matched),
                "matched_symptoms": sorted(list(matched))
            })

    # sort candidates by match_count desc, then name
    candidates.sort(key=lambda x: (-x["match_count"], x["doctor"].name))

    if candidates:
        # prepare structured list
        doctors_out = []
        for item in candidates:
            d = item["doctor"]
            doctors_out.append({
                "id": d.id,
                "name": d.name,
                "specialization": d.specialization,
                "address": d.address,
                "phone": d.phone,
                "timings": d.timings_list(),
                "matched_symptoms": item["matched_symptoms"],
                "match_count": item["match_count"],
            })

        # human-friendly reply text (each doctor on new line)
        reply_lines = ["👨‍⚕️ I found doctors who treat the symptoms you mentioned:"]
        for i, doc in enumerate(doctors_out, start=1):
            reply_lines.append(f"{i}. {doc['name']} — {doc['specialization']} — {doc['phone']}\n   {doc['address']}")
        reply_text = "\n".join(reply_lines)

        ChatMessage.objects.create(role="assistant", content=reply_text)
        return JsonResponse({
            "reply": reply_text,
            "doctors": doctors_out,   # structured data for frontend boxes
            "conversation": get_conversation(),
            "next": "show_doctors"
        })

    # if no matches, fallback / dominant reply
    reply = (
        "🤖 I couldn't find a doctor for the symptoms you described in our records.\n"
        "Could you try writing the symptom differently (e.g., 'fever', 'severe headache')?\n"
        "If this is a new symptom, please contact support or provide more details."
    )
    ChatMessage.objects.create(role="assistant", content=reply)
    return JsonResponse({"reply": reply, "conversation": get_conversation(), "next": None})


def get_conversation():
    messages = ChatMessage.objects.order_by("timestamp")
    return [
        {"role": msg.role, "content": msg.content, "timestamp": msg.timestamp.strftime("%H:%M:%S")}
        for msg in messages
    ]
