
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form, Response, Body
from pydantic import BaseModel
from typing import Optional
from app.services.face_service import face_service
from app.services.object_service import detector as object_service
from app.services.memory_service import memory_service
from app.services.tts_service import tts_service
import shutil
from pathlib import Path
import uuid
from typing import Dict, Any
import base64
from PIL import Image
import io

router = APIRouter()

@router.get('/health')
def api_health():
    return {'status': 'ok', 'service': 'v1'}


TEMP_DIR = Path("temp_uploads")
TEMP_DIR.mkdir(exist_ok=True)

# Ensure enrollment dir exists
ENROLL_DIR = Path("photo/enrolled")
ENROLL_DIR.mkdir(parents=True, exist_ok=True)

def encode_image_base64(image_path: str):
    """Resize and encode image to base64 for storage."""
    try:
        with Image.open(image_path) as img:
            # Resize to thumbnail to save space (e.g., 300px max)
            img.thumbnail((300, 300))
            buffered = io.BytesIO()
            img.convert("RGB").save(buffered, format="JPEG", quality=70)
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return f"data:image/jpeg;base64,{img_str}"
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None

@router.post("/recognize/person")
async def recognize_person(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Receive an image, detect faces, search Qdrant for identity.
    """
    # 1. Save temp file
    file_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix
    temp_path = TEMP_DIR / f"{file_id}{ext}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Generate Embedding
        # Note: FaceService currently returns list of floats or empty list
        embedding = face_service.generate_embedding(str(temp_path))
        
        if not embedding:
            return {"status": "no_face_detected", "person": None}
            
        # 3. Search Memory
        matches = memory_service.search_face(embedding)
        
        if matches:
             best_match = matches[0]
             # Check threshold (Cosine Similarity > 0.4 implies match)
             score = float(best_match.score)
             name = best_match.payload.get('name', 'Unknown')
             print(f"[RECOGNIZE] Best candidate: '{name}' with similarity: {score:.4f} (Required: >= 0.65)")
             if score >= 0.65:
                 name = best_match.payload.get("name", "Unknown")
                 relation = best_match.payload.get("relation", "Unknown")
                 notes = best_match.payload.get("notes", "")
                 
                 # TTS Feedback
                 greeting = f"Hello {name}."
                 if notes:
                      greeting += f" {notes}"
                 elif relation != "Unknown":
                     greeting += f" You are a {relation}."
                 
                 # background_tasks.add_task(tts_service.speak, greeting)

                 return {
                     "status": "identified",
                     "person": {
                         "name": name,
                         "relation": relation,
                         "confidence": best_match.score,
                         "id": best_match.payload.get("person_id"),
                         "notes": notes,
                         "image": best_match.payload.get("image_base64", None),
                         "audio": best_match.payload.get("audio_base64", None)
                     }
                 }

             else:
                 print(f"[RECOGNIZE] Score {score:.4f} is below 0.65 threshold. Rejecting as unknown person.")
        return {"status": "unknown", "person": None}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        if temp_path.exists():
            temp_path.unlink()

@router.post("/remember/person")
async def remember_person(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    relation: str = Form("Acquaintance"),
    notes: str = Form(None),
    age: int = Form(None),
    file: UploadFile = File(...),
    audio_file: UploadFile = File(None)
):
    """Enroll a new person with optional voice sample."""
    file_id = str(uuid.uuid4())
    filename = f"{name.replace(' ', '_')}_{file_id}.jpg"
    perm_path = ENROLL_DIR / filename
    
    # Audio Path
    audio_b64 = None
    if audio_file:
         audio_path = Path("audio/enrolled") / f"{name.replace(' ', '_')}_{file_id}.webm"
         audio_path.parent.mkdir(parents=True, exist_ok=True)
         try:
             with open(audio_path, "wb") as buffer:
                 shutil.copyfileobj(audio_file.file, buffer)
             
             # Encode for Cloud
             with open(audio_path, "rb") as f:
                 audio_b64 = base64.b64encode(f.read()).decode("utf-8")
         except Exception as e:
             print(f"Error saving audio: {e}")

    try:
        # Save Image locally as backup
        with open(perm_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Generate Embedding
        embedding = face_service.generate_embedding(str(perm_path))
        
        if not embedding:
            perm_path.unlink()
            return {"status": "error", "message": "No face detected in enrollment photo."}

        # Encode Image for Cloud Storage
        img_b64 = encode_image_base64(str(perm_path))
        
        # 4. Generate Avatar
        from app.services.avatar_service import avatar_service
        avatar_url = avatar_service.generate_avatar(str(perm_path))
            
        # Store in Qdrant
        metadata = {
            "name": name,
            "relation": relation,
            "age": age,
            "type": "person",
            "notes": notes or f"This is {name}, your {relation}.",
            "image_base64": img_b64,
            "avatar_url": avatar_url
        }
        if audio_b64:
            metadata["audio_base64"] = audio_b64 # Store voice sample in cloud!

        memory_service.store_face_memory(
            person_id=name.replace(" ", "_"),
            embedding=embedding,
            metadata=metadata
        )
        try:
            from app.services.semantic_memory import semantic_memory
            semantic_memory.learn_person(metadata)
        except Exception as sem_err:
            print(f"Semantic memory note: {sem_err}")
        
        msg = f"I have enrolled {name}."
        
        return {"status": "stored", "name": name, "avatar_url": avatar_url, "image_base64": img_b64}
        
    except Exception as e:
        if perm_path.exists():
             perm_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/remember/patient")
async def remember_patient(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    relation: str = Form("Acquaintance"),
    notes: str = Form(None),
    age: int = Form(None),
    file: UploadFile = File(...),
    audio_file: UploadFile = File(None)
):
    """Enroll a new PATIENT/Person via Caregiver (Stored in 'patients' collection)"""
    file_id = str(uuid.uuid4())
    filename = f"{name.replace(' ', '_')}_{file_id}.jpg"
    perm_path = ENROLL_DIR / filename
    
    # Audio Path
    audio_b64 = None
    if audio_file:
         audio_path = Path("audio/enrolled") / f"{name.replace(' ', '_')}_{file_id}.webm"
         audio_path.parent.mkdir(parents=True, exist_ok=True)
         try:
             with open(audio_path, "wb") as buffer:
                 shutil.copyfileobj(audio_file.file, buffer)
             with open(audio_path, "rb") as f:
                 audio_b64 = base64.b64encode(f.read()).decode("utf-8")
         except Exception as e:
             print(f"Error saving audio: {e}")

    try:
        # Save Image
        with open(perm_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Generate Embedding
        embedding = face_service.generate_embedding(str(perm_path))
        
        if not embedding:
            perm_path.unlink()
            return {"status": "error", "message": "No face detected in enrollment photo."}

        # Encode for storage
        img_b64 = encode_image_base64(str(perm_path))
        
        # Generate Avatar
        from app.services.avatar_service import avatar_service
        avatar_url = avatar_service.generate_avatar(str(perm_path))
            
        # Store in Qdrant PATIENTS collection
        metadata = {
            "name": name,
            "relation": relation,
            "age": age,
            "type": "patient_contact",
            "notes": notes or f"This is {name}, your {relation}.",
            "image_base64": img_b64,
            "avatar_url": avatar_url
        }
        if audio_b64:
            metadata["audio_base64"] = audio_b64

        memory_service.store_patient_memory(
            person_id=name.replace(" ", "_"),
            embedding=embedding,
            metadata=metadata
        )
        try:
            from app.services.semantic_memory import semantic_memory
            semantic_memory.add_knowledge(
                text=f"{name} is the user's {relation}. {notes or ''}",
                name=name,
                metadata={"type": "person", "relation": relation, "image_base64": img_b64}
            )
        except Exception as e:
            print(f"Error indexing person in semantic memory: {e}")
        
        return {"status": "stored", "name": name, "avatar_url": avatar_url}
        
    except Exception as e:
        if perm_path.exists():
             perm_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/remember/object")
async def remember_object(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    location: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    """Register a new personal object (e.g. Medicine Box)"""
    file_id = str(uuid.uuid4())
    temp_path = TEMP_DIR / f"{file_id}_{file.filename}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Generate Embedding
        embedding = object_service.generate_embedding(str(temp_path))
        
        # Encode
        img_b64 = encode_image_base64(str(temp_path))

        loc = location or "Home"
        combined_notes = f"Location: {loc}. {notes}" if notes else f"Location: {loc}."

        # Store in Qdrant objects collection
        memory_service.store_object_memory(
            object_id=str(uuid.uuid4()),
            embedding=embedding,
            metadata={
                "name": name,
                "type": "object",
                "location": loc,
                "notes": combined_notes,
                "image_base64": img_b64
            }
        )
        
        try:
            from app.services.semantic_memory import semantic_memory
            semantic_memory.add_knowledge(
                text=f"{name} is a personal item. It is usually kept in {loc}. {notes or ''}",
                name=name,
                metadata={"type": "object", "location": loc, "image_base64": img_b64}
            )
        except Exception as e:
            print(f"Error indexing object in semantic memory: {e}")
        
        return {"status": "stored", "name": name, "location": loc, "image_base64": img_b64}
        
    finally:
        if temp_path.exists():
            temp_path.unlink()

@router.post("/find/object")
async def find_object(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Identify a specific personal object."""
    file_id = str(uuid.uuid4())
    temp_path = TEMP_DIR / f"{file_id}_{file.filename}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 1. Generate Embedding
        embedding = object_service.generate_embedding(str(temp_path))
        
        # 2. Search
        matches = memory_service.search_object(embedding)
        
        found_name = "Unknown Object"
        found_notes = ""
        found_img = None
        
        if matches and matches[0].score > 0.6: # Threshold
            best = matches[0]
            found_name = best.payload.get("name", "Unknown")
            found_notes = best.payload.get("notes", "")
            found_img = best.payload.get("image_base64", None)
            
            # TTS
            msg = f"This looks like your {found_name}."
            if found_notes:
                msg += f" {found_notes}"
            # background_tasks.add_task(tts_service.speak, msg)
            
            return {
                "status": "identified", 
                "object": {
                    "name": found_name, 
                    "notes": found_notes, 
                    "confidence": best.score,
                    "location": best.payload.get("location", "Unknown"),
                    "image": found_img
                }
            }
        
        # Fallback: YOLO Detection -> Auto-Enroll
        detections = object_service.detect_objects(str(temp_path))
        if detections:
            # Found "cell phone", "bottle", etc.
            # Pick the highest confidence object
            best_det = max(detections, key=lambda x: x['confidence'])
            label = best_det['object']
            
            # Auto-Learn: Store this specific instance embedding
            object_id = str(uuid.uuid4())
            # Use the already calculated embedding
            # Note: We should ideally crop the object, but full image embedding is OK for prototype 
            # if the object is dominant.
            
            # Encode for storage
            img_b64 = encode_image_base64(str(temp_path))
            
            # Determine location (Mock or Current Context)
            # Since we don't have GPS, we say "Last Seen Location" or date
            from datetime import datetime
            timestamp = datetime.now().strftime("%I:%M %p")
            location = f"Last seen at {timestamp}"

            memory_service.store_object_memory(
                object_id=object_id,
                embedding=embedding,
                metadata={
                    "name": label,
                    "type": "object",
                    "notes": "Auto-enrolled from observation.",
                    "location": location,
                    "image_base64": img_b64
                }
            )
            
            found_name = label
            found_notes = "I just learned this object."
            
            # Return as 'identified' so Frontend treats it as a known object
            return {
                "status": "identified", 
                "object": {
                    "name": found_name, 
                    "notes": found_notes, 
                    "confidence": best_det['confidence'],
                    "location": location,
                    "image": img_b64
                }
            }
            
        return {"status": "unknown", "object": None}
        
    finally:
        if temp_path.exists():
            temp_path.unlink()
@router.get("/debug/names")
async def debug_names():
    """List all names in Qdrant Faces"""
    try:
        res = memory_service.client.scroll(
            collection_name="faces",
            limit=100,
            with_payload=True
        )
        points = res[0]
        names = [p.payload.get("name") for p in points]
        return {"count": len(names), "names": names}
    except Exception as e:
        return {"error": str(e)}


class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    api_key: Optional[str] = None
    language: Optional[str] = "en"

@router.post("/tts")
async def text_to_speech_post(req: TTSRequest):
    audio_bytes = await tts_service.generate_audio(req.text, req.voice_id, req.api_key, language=req.language)
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Failed to synthesize speech")
    return Response(content=audio_bytes, media_type="audio/mpeg")

@router.get("/tts")
async def text_to_speech_get(text: str, voice_id: Optional[str] = None, api_key: Optional[str] = None, language: Optional[str] = "en"):
    audio_bytes = await tts_service.generate_audio(text, voice_id, api_key, language=language)
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Failed to synthesize speech")
    return Response(content=audio_bytes, media_type="audio/mpeg")


class SMSAlertRequest(BaseModel):
    patient_name: Optional[str] = "Dad"
    lat: float
    lng: float
    distance: int
    address: Optional[str] = None
    recipient_phone: Optional[str] = "+91 98765 43210 (Rahul)"

@router.post("/alert/sms")
async def send_emergency_sms(alert: SMSAlertRequest):
    """Simulated real-time SMS Gateway trigger (Twilio / Fast2SMS / SMSCountry)"""
    import time
    google_maps_url = f"https://www.google.com/maps?q={alert.lat},{alert.lng}"
    msg = (
        f"EMERGENCY ALERT: {alert.patient_name} has reported feeling lost! "
        f"Current GPS: ({alert.lat:.5f}, {alert.lng:.5f}) - {alert.distance}m from home. "
        f"Live Map: {google_maps_url}"
    )
    print(f"[SMS GATEWAY] Sent to {alert.recipient_phone}: {msg}")
    return {
        "status": "sent",
        "timestamp": time.strftime("%I:%M %p"),
        "recipient": alert.recipient_phone,
        "message": msg,
        "maps_url": google_maps_url
    }


@router.post("/memory/clear")
@router.delete("/memory/clear")
async def clear_memory_endpoint():
    """Wipes all enrolled people, faces, objects, and text knowledge."""
    try:
        from app.services.semantic_memory import semantic_memory
        from app.services.conversation_service import conversation_service
        memory_service.clear_all()
        semantic_memory.clear_all()
        conversation_service.clear_context()
        
        # Clear local photos & audios
        if ENROLL_DIR.exists():
            for f in ENROLL_DIR.iterdir():
                if f.is_file(): f.unlink()
        audio_dir = Path("audio/enrolled")
        if audio_dir.exists():
            for f in audio_dir.iterdir():
                if f.is_file(): f.unlink()
                
        return {"status": "success", "message": "Memory is completely free. All enrolled people, faces, objects, and facts removed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/people")
@router.get("/enrolled/all")
async def get_all_enrolled_people():
    """Return list of all enrolled people and their details."""
    try:
        people = memory_service.get_all_people()
        return {"status": "success", "count": len(people), "people": people}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/person/{identifier}")
@router.delete("/enrolled/{identifier}")
async def delete_enrolled_person(identifier: str):
    """Manually remove an enrolled person by ID or name."""
    try:
        from app.services.conversation_service import conversation_service
        result = memory_service.delete_person(identifier)
        conversation_service.clear_context()
        return {
            "status": "success",
            "message": f"Successfully removed {identifier} from memory bank.",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/person/{identifier}")
@router.post("/person/{identifier}/update")
async def update_enrolled_person(
    identifier: str,
    name: Optional[str] = Form(None),
    relation: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    audio_file: Optional[UploadFile] = File(None)
):
    """Update an enrolled person's information, photo, or voice recording."""
    try:
        from app.services.conversation_service import conversation_service
        updates = {}
        new_embedding = None

        if name is not None and name.strip():
            updates["name"] = name.strip()
            updates["person_id"] = name.strip().replace(" ", "_")
        if relation is not None:
            updates["relation"] = relation.strip()
        if notes is not None:
            updates["notes"] = notes.strip()
        if age is not None:
            updates["age"] = age

        # Handle new photo upload
        if file and file.filename:
            file_id = str(uuid.uuid4())
            safe_name = (name or identifier).replace(" ", "_")
            perm_path = ENROLL_DIR / f"{safe_name}_{file_id}.jpg"
            try:
                with open(perm_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)

                embedding = face_service.generate_embedding(str(perm_path))
                if embedding:
                    new_embedding = embedding
                    img_b64 = encode_image_base64(str(perm_path))
                    updates["image_base64"] = img_b64
                    try:
                        from app.services.avatar_service import avatar_service
                        avatar_url = avatar_service.generate_avatar(str(perm_path))
                        if avatar_url:
                            updates["avatar_url"] = avatar_url
                    except Exception as av_err:
                        print(f"Avatar update note: {av_err}")
                else:
                    print(f"Warning: No face detected in updated photo for {identifier}")
            except Exception as fe:
                print(f"Error processing updated photo: {fe}")

        # Handle new voice recording upload
        if audio_file and audio_file.filename:
            file_id = str(uuid.uuid4())
            safe_name = (name or identifier).replace(" ", "_")
            audio_path = Path("audio/enrolled") / f"{safe_name}_{file_id}.webm"
            audio_path.parent.mkdir(parents=True, exist_ok=True)
            try:
                with open(audio_path, "wb") as buffer:
                    shutil.copyfileobj(audio_file.file, buffer)
                with open(audio_path, "rb") as f:
                    audio_b64 = base64.b64encode(f.read()).decode("utf-8")
                updates["audio_base64"] = audio_b64
            except Exception as ae:
                print(f"Error saving updated audio: {ae}")

        result = memory_service.update_person(identifier, updates, new_embedding=new_embedding)
        conversation_service.clear_context()

        return {
            "status": "success",
            "message": f"Successfully updated {identifier} in memory bank.",
            "updates": {k: v for k, v in updates.items() if k not in ["image_base64", "audio_base64"]},
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------
# SAFE ZONE & PATIENT HOME ADDRESS ENDPOINTS
# -------------------------------------------------------------
import json
import time

SAFE_ZONE_FILE = Path("data/safe_zone.json")

class SafeZoneModel(BaseModel):
    address: str
    landmark: Optional[str] = ""
    lat: float = 12.9716
    lng: float = 77.5946
    radius_meters: int = 500
    emergency_contact: Optional[str] = ""
    emergency_phone: Optional[str] = ""
    updated_at: Optional[str] = None

@router.get("/patient/safe_zone")
async def get_patient_safe_zone():
    try:
        if SAFE_ZONE_FILE.exists():
            with open(SAFE_ZONE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "address": "Home: 4th Cross, Green Park, Bangalore",
            "landmark": "Opposite Apollo Pharmacy",
            "lat": 12.9716,
            "lng": 77.5946,
            "radius_meters": 500,
            "emergency_contact": "Rahul",
            "emergency_phone": "+91 98765 43210",
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception as e:
        return {
            "address": "Home: 4th Cross, Green Park, Bangalore",
            "landmark": "",
            "lat": 12.9716,
            "lng": 77.5946,
            "radius_meters": 500
        }

@router.post("/patient/safe_zone")
async def update_patient_safe_zone(zone: SafeZoneModel):
    try:
        SAFE_ZONE_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = zone.dict()
        data["updated_at"] = time.strftime("%Y-%m-%d %I:%M %p")
        with open(SAFE_ZONE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"[SAFE ZONE] Updated home address: {data.get('address')} ({data.get('lat')}, {data.get('lng')})")
        return {
            "status": "success",
            "message": "Safe Zone Home Address saved successfully",
            "safe_zone": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


PATIENT_LOC_FILE = Path("data/patient_location.json")

class PatientLocModel(BaseModel):
    lat: float
    lng: float
    accuracy: Optional[float] = 10.0
    updated_at: Optional[str] = None
    is_simulated: Optional[bool] = False

@router.get("/patient/live_location")
async def get_patient_live_location():
    try:
        if PATIENT_LOC_FILE.exists():
            with open(PATIENT_LOC_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "lat": 12.9720,
            "lng": 77.5950,
            "accuracy": 10,
            "updated_at": time.strftime("%I:%M:%S %p"),
            "is_simulated": False
        }
    except Exception as e:
        return {"lat": 12.9720, "lng": 77.5950, "accuracy": 10, "updated_at": ""}

@router.post("/patient/live_location")
async def update_patient_live_location(loc: PatientLocModel):
    try:
        PATIENT_LOC_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = loc.dict()
        data["updated_at"] = time.strftime("%I:%M:%S %p")
        with open(PATIENT_LOC_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return {"status": "success", "location": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


SCHEDULE_FILE = Path("data/schedule.json")

DEFAULT_SERVER_SCHEDULE = [
    {
        "id": "sch-1",
        "time": "07:30 AM",
        "slot": "morning",
        "title": "Morning Garden Walk & Tea",
        "category": "routine",
        "notes": "Dad loves fresh air in the balcony/garden. Keep a warm shawl ready.",
        "completed": False
    },
    {
        "id": "sch-2",
        "time": "08:30 AM",
        "slot": "morning",
        "title": "Breakfast & Blood Pressure Pill (Amlodipine 5mg)",
        "category": "medicine",
        "notes": "Take 1 tablet with lukewarm water after eating breakfast.",
        "voice_prompt": "Dad, it's Sneha. Time to take your morning blood pressure pill with water.",
        "voice_sender": "Sneha (Daughter)",
        "audioData": None,
        "completed": False,
        "takenAt": None,
        "takenBy": None
    },
    {
        "id": "sch-3",
        "time": "01:00 PM",
        "slot": "afternoon",
        "title": "Lunch & Vitamin B12 + Omega 3",
        "category": "medicine",
        "notes": "Essential for neuroprotection. Take right after lunch.",
        "voice_prompt": "Dad, remember to take your Vitamin B12 and Omega 3 after lunch.",
        "voice_sender": "Sneha (Daughter)",
        "audioData": None,
        "completed": False,
        "takenAt": None,
        "takenBy": None
    },
    {
        "id": "sch-4",
        "time": "05:00 PM",
        "slot": "afternoon",
        "title": "Listen to Classical Music & Family Call",
        "category": "routine",
        "notes": "Calms evening sundowning agitation. Call Rahul (grandson).",
        "completed": False
    },
    {
        "id": "sch-5",
        "time": "08:30 PM",
        "slot": "night",
        "title": "Dinner & Memory Care Tablet (Donepezil 10mg)",
        "category": "medicine",
        "notes": "Crucial Alzheimer's memory stabilization pill before sleep.",
        "voice_prompt": "Dad, good night. Please take your memory tablet before going to bed. Love you.",
        "voice_sender": "Sneha (Daughter)",
        "audioData": None,
        "completed": False,
        "takenAt": None,
        "takenBy": None
    }
]

@router.get("/schedule")
async def get_schedule():
    try:
        if SCHEDULE_FILE.exists():
            with open(SCHEDULE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        SCHEDULE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(SCHEDULE_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_SERVER_SCHEDULE, f, indent=2)
        return DEFAULT_SERVER_SCHEDULE
    except Exception as e:
        return DEFAULT_SERVER_SCHEDULE

@router.post("/schedule")
async def update_schedule(items: list = Body(...)):
    try:
        SCHEDULE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(SCHEDULE_FILE, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2)
        return {"status": "success", "count": len(items)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
