from fastapi import APIRouter, Body
from app.services.conversation_service import conversation_service
from app.services.semantic_memory import semantic_memory
from app.services.memory_service import memory_service
from app.services.llm_service import llm_service
import re
import json
from pathlib import Path

router = APIRouter()

def safe_print(*args, **kwargs):
    """Safely print to console without crashing on Windows cp1252 / emoji characters."""
    try:
        print(*args, **kwargs)
    except Exception:
        try:
            safe_args = [str(a).encode('ascii', errors='replace').decode('ascii') for a in args]
            print(*safe_args, **kwargs)
        except Exception:
            pass

def load_server_schedule():
    """Load schedule items directly from server storage as a resilient fallback."""
    p = Path("data/schedule.json")
    if p.exists():
        try:
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    return data
        except Exception as e:
            safe_print(f"[chat_endpoint] Error loading server schedule: {e}")
    return []

MEDICINE_KEYWORDS = [
    "medicine", "medicines", "medication", "medications", "pill", "pills", 
    "tablet", "tablets", "dose", "dosage", "prescription", "take medicine",
    "drugs", "pharma",
    # Kannada
    "ಔಷಧ", "ಔಷಧಿ", "ಮಾತ್ರೆ", "ಮಾತ್ರೆಗಳು", "ಗುಳಿಗೆ",
    # Hindi
    "दवा", "दवाई", "दवाएं", "दवाइयां", "गोली", "गोलियां", "खुराक"
]

SCHEDULE_KEYWORDS = [
    "schedule", "routine", "today's plan", "today plan", "what to do today", 
    "my day", "what should i do", "daily plan", "calendar", "agenda",
    # Kannada
    "ದಿನಚರಿ", "ವೇಳಾಪಟ್ಟಿ", "ಇಂದಿನ ಯೋಜನೆ", "ಕಾರ್ಯಕ್ರಮ",
    # Hindi
    "दिनचर्या", "शेड्यूल", "आज का प्लान", "आज क्या करना है", "कार्यसूची"
]

def format_medicines_response(schedule_items: list, language: str) -> str:
    """Format medication reminders from shared schedule into warm, clear multi-language text."""
    med_items = []
    for item in schedule_items:
        text_corpus = f"{item.get('title', '')} {item.get('description', '')} {item.get('notes', '')} {item.get('category', '')}".lower()
        if any(k in text_corpus for k in ["pill", "tablet", "medicine", "med", "dose", "pressure", "vitamin", "donepezil", "amlodipine", "ಮಾತ್ರೆ", "ಔಷಧ", "ದವಾ", "गोली"]):
            med_items.append(item)
    
    # If no specific med filter matched but items exist, take items categorized as medicine or all items
    if not med_items and schedule_items:
        med_items = [it for it in schedule_items if it.get("category") == "medicine"] or schedule_items

    if not med_items:
        if language == "kn":
            return "ಸ್ಮೃತಿಯಲ್ಲಿ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ."
        elif language == "hi":
            return "स्मृति में जानकारी उपलब्ध नहीं है।"
        else:
            return "Information not available in memory."

    if language == "kn":
        lines = ["ಇಂದಿನ ನಿಮ್ಮ ನಿಗದಿತ ಔಷಧಗಳು ಹೀಗಿವೆ:"]
        for it in med_items:
            time_str = it.get("time", "")
            title = it.get("title", "")
            desc = it.get("description", "") or it.get("notes", "")
            taken = f" (✅ ಈಗಾಗಲೇ {it.get('takenAt')} ಗೆ ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ)" if it.get("completed") and it.get("takenAt") else ""
            lines.append(f"• {time_str}: {title}{taken}" + (f" - {desc}" if desc and not taken else ""))
        lines.append("\nದಯವಿಟ್ಟು ಊಟದ ನಂತರ ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ನೀರಿನೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ!")
        return "\n".join(lines)
    elif language == "hi":
        lines = ["आज की आपकी निर्धारित दवाएं इस प्रकार हैं:"]
        for it in med_items:
            time_str = it.get("time", "")
            title = it.get("title", "")
            desc = it.get("description", "") or it.get("notes", "")
            taken = f" (✅ {it.get('takenAt')} पर ली जा चुकी है)" if it.get("completed") and it.get("takenAt") else ""
            lines.append(f"• {time_str}: {title}{taken}" + (f" - {desc}" if desc and not taken else ""))
        lines.append("\nकृपया भोजन के बाद समय पर पानी के साथ दवाएं लें!")
        return "\n".join(lines)
    else:
        lines = ["Here are your scheduled medicines for today:"]
        for it in med_items:
            time_str = it.get("time", "")
            title = it.get("title", "")
            desc = it.get("description", "") or it.get("notes", "")
            taken = f" (✅ Taken at {it.get('takenAt')})" if it.get("completed") and it.get("takenAt") else ""
            lines.append(f"• {time_str}: {title}{taken}" + (f" - {desc}" if desc and not taken else ""))
        lines.append("\nPlease remember to take your scheduled doses on time with water after meals!")
        return "\n".join(lines)

def format_schedule_response(schedule_items: list, language: str) -> str:
    """Format daily schedule into structured readable text."""
    if not schedule_items:
        if language == "kn":
            return "ಸ್ಮೃತಿಯಲ್ಲಿ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ."
        elif language == "hi":
            return "स्मृति में जानकारी उपलब्ध नहीं है।"
        else:
            return "Information not available in memory."

    if language == "kn":
        lines = ["ಇಂದಿನ ನಿಮ್ಮ ದಿನಚರಿ ಮತ್ತು ವೇಳಾಪಟ್ಟಿ ಹೀಗಿದೆ:"]
        for it in schedule_items:
            desc = it.get("description", "") or it.get("notes", "")
            taken = f" (✅ ಪೂರ್ಣಗೊಂಡಿದೆ)" if it.get("completed") else ""
            lines.append(f"• {it.get('time', '')}: {it.get('title', '')}{taken}" + (f" ({desc})" if desc else ""))
        return "\n".join(lines)
    elif language == "hi":
        lines = ["आज की आपकी दिनचर्या और शेड्यूल:"]
        for it in schedule_items:
            desc = it.get("description", "") or it.get("notes", "")
            taken = f" (✅ पूरा हो चुका)" if it.get("completed") else ""
            lines.append(f"• {it.get('time', '')}: {it.get('title', '')}{taken}" + (f" ({desc})" if desc else ""))
        return "\n".join(lines)
    else:
        lines = ["Here is your schedule for today:"]
        for it in schedule_items:
            desc = it.get("description", "") or it.get("notes", "")
            taken = f" (✅ Completed at {it.get('takenAt')})" if it.get("completed") and it.get("takenAt") else (" (✅ Completed)" if it.get("completed") else "")
            lines.append(f"• {it.get('time', '')}: {it.get('title', '')}{taken}" + (f" - {desc}" if desc else ""))
        return "\n".join(lines)


@router.post("/chat/query")
async def chat_query(payload: dict = Body(...)):
    try:
        text = payload.get("text", "").strip()
        language = payload.get("language", "en")
        schedule = payload.get("schedule", [])
        
        # Resilient fallback: If schedule is not provided in payload, load from server disk
        if not schedule or not isinstance(schedule, list) or len(schedule) == 0:
            schedule = load_server_schedule()
        
        # Clean emojis and special symbols for safe processing
        clean_text = re.sub(r'[\U00010000-\U0010ffff]', '', text).strip()
        query_text = clean_text if clean_text else text

        # Auto-detect language from script if text contains Kannada or Devanagari characters
        if any(0x0C80 <= ord(char) <= 0x0CFF for char in text):
            language = "kn"
        elif any(0x0900 <= ord(char) <= 0x097F for char in text):
            language = "hi" 
        
        if not query_text:
            return {
                "status": "not_available",
                "text": "Information not available in memory." if language == "en" else ("ಸ್ಮೃತಿಯಲ್ಲಿ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ." if language == "kn" else "स्मृति में जानकारी उपलब्ध नहीं है।"),
                "person": None,
                "image_base64": None,
                "audio_base64": None,
                "gallery": []
            }

        lower_text = query_text.lower()
        
        # -------------------------------------------------------------
        # 1. SPECIAL INTENT: MEDICINE & PRESCRIPTION CHECK
        # -------------------------------------------------------------
        if any(k in lower_text for k in MEDICINE_KEYWORDS):
            safe_print(f"[chat_query] Detected medicine query: '{clean_text}'")
            formatted = format_medicines_response(schedule, language)
            is_found = formatted != "Information not available in memory." and "ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ" not in formatted and "जानकारी उपलब्ध नहीं" not in formatted
            return {
                "status": "found" if is_found else "not_available",
                "text": formatted,
                "person": None,
                "image_base64": None,
                "audio_base64": None,
                "gallery": []
            }

        # -------------------------------------------------------------
        # 2. SPECIAL INTENT: DAILY ROUTINE / SCHEDULE CHECK
        # -------------------------------------------------------------
        if any(k in lower_text for k in SCHEDULE_KEYWORDS):
            safe_print(f"[chat_query] Detected schedule query: '{clean_text}'")
            formatted = format_schedule_response(schedule, language)
            is_found = formatted != "Information not available in memory." and "ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ" not in formatted and "जानकारी उपलब्ध नहीं" not in formatted
            return {
                "status": "found" if is_found else "not_available",
                "text": formatted,
                "person": None,
                "image_base64": None,
                "audio_base64": None,
                "gallery": []
            }

        # -------------------------------------------------------------
        # 3. CONTEXT & PRONOUN HANDLING
        # -------------------------------------------------------------
        context = conversation_service.get_context()
        context_name = context.get("name") if context else None
        
        pronouns = ["he", "she", "him", "her", "it", "his", "live", "do", "does", "about", "look", "features"]
        is_followup = any(p in lower_text.split() for p in pronouns)
        
        matches = []
        
        # 0. Direct Entity Search (Person/Object Name with strict match)
        entity_matches = memory_service.search_by_text(query_text)
        if entity_matches:
            safe_print(f"Direct Entity Match: {entity_matches[0].payload.get('name')}")
            entity_payload = entity_matches[0].payload
            name = entity_payload.get("name")
            desc = llm_service.generate_response(user_text=query_text, context=entity_payload, language=language)
            matches = [{"name": name, "text": desc, "score": 1.0, "payload": entity_payload}]
        elif context_name and is_followup and "who is" not in lower_text:
            safe_print(f"Context Search for {context_name}: {clean_text}")
            matches = semantic_memory.search_knowledge(query_text, context_name=context_name)
        else:
            safe_print(f"Global Semantic Search: {clean_text}")
            matches = semantic_memory.search_knowledge(query_text)
        
        # If no confident match found, return "Information not available in memory."
        if not matches:
            if language == "kn":
                not_avail = "ಸ್ಮೃತಿಯಲ್ಲಿ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ."
            elif language == "hi":
                not_avail = "स्मृति में जानकारी उपलब्ध नहीं है।"
            else:
                not_avail = "Information not available in memory."
            return {
                "status": "not_available",
                "text": not_avail,
                "person": None,
                "image_base64": None,
                "audio_base64": None,
                "gallery": []
            }

        best_match = matches[0]
        name = best_match.get("name")
        
        full_person = None
        audio_base64 = None
        image_base64 = None
        original_matches = []
        
        if name:
            original_matches = memory_service.search_by_text(name)
            if original_matches:
                full_person = original_matches[0].payload
                for m in original_matches:
                    if not audio_base64 and m.payload.get("audio_base64"):
                        audio_base64 = m.payload.get("audio_base64")
                    if not image_base64 and m.payload.get("image_base64"):
                        image_base64 = m.payload.get("image_base64")
            else:
                full_person = best_match.get("payload")
            
            if full_person:
                if not audio_base64: audio_base64 = full_person.get("audio_base64")
                if not image_base64: image_base64 = full_person.get("image_base64")

        # Update context only when we have a legitimate person/object
        if full_person:
            conversation_service.update_context(full_person)
        else:
            conversation_service.update_context(best_match)

        llm_context = full_person if full_person else best_match
        if llm_context:
            llm_context["has_audio"] = bool(audio_base64)
            llm_context["has_image"] = bool(image_base64)

        final_text = llm_service.generate_response(user_text=query_text, context=llm_context, language=language)

        # Sanity check on LLM response: if it says it doesn't know or lacks info, DO NOT attach photo
        negative_indicators = [
            "information not available", "not available in memory", 
            "don't have", "do not have", "cannot find", "couldn't find",
            "ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ", "ನೆನಪಿನಲ್ಲಿಲ್ಲ", "ತಿಳಿದಿಲ್ಲ",
            "जानकारी उपलब्ध नहीं", "याद में नहीं", "पता नहीं"
        ]
        is_negative = any(ind in final_text.lower() for ind in negative_indicators)

        # Build gallery if requested
        gallery = []
        if original_matches and not is_negative:
            seen_imgs = set()
            for m in original_matches:
                img = m.payload.get("image_base64")
                if img and len(img) > 100 and img not in seen_imgs:
                    gallery.append(img)
                    seen_imgs.add(img)
            gallery = gallery[:6]

        voice_keywords = ["voice", "talk", "speak", "sound", "listen", "hear", "ಧ್ವನಿ", "ಮಾತು", "ಆವಾಜ್", "आवाज़", "बोल"]
        voice_intent = any(k in lower_text for k in voice_keywords)
        final_audio = audio_base64 if (voice_intent and not is_negative) else None

        gallery_keywords = ["memories", "photos", "pictures", "images", "gallery", "album", "see", "look", "ಫೋಟೋ", "ಚಿತ್ರ", "तस्वीर", "फोटो"]
        gallery_intent = any(k in lower_text for k in gallery_keywords)
        final_gallery = gallery if (gallery_intent and not is_negative) else []

        # Only return person & image if it wasn't a negative response and actually queried
        ret_person = full_person if (full_person and not is_negative) else None
        ret_image = image_base64 if (not is_negative) else None

        return {
            "status": "found" if not is_negative else "not_available",
            "text": final_text,
            "person": ret_person,
            "audio_base64": final_audio,
            "image_base64": ret_image,
            "gallery": final_gallery
        }

    except Exception as e:
        safe_print(f"[chat_endpoint] Unexpected exception in chat_query: {e}")
        # Graceful fallback response
        fallback_msg = (
            "ಸ್ಮೃತಿಯಲ್ಲಿ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ." if payload.get("language") == "kn" 
            else ("स्मृति में जानकारी उपलब्ध नहीं है।" if payload.get("language") == "hi" 
            else "Information not available in memory.")
        )
        return {
            "status": "not_available",
            "text": fallback_msg,
            "person": None,
            "image_base64": None,
            "audio_base64": None,
            "gallery": []
        }
