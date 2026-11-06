from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, MatchValue, MatchText
from app.core.config import settings
import uuid

class MemoryService:
    def __init__(self):
        print("DEBUG: Initializing MemoryService (Qdrant)...", flush=True)
        connected = False
        if settings.QDRANT_MODE != "local" and (settings.QDRANT_URL or settings.QDRANT_HOST != "localhost"):
            try:
                self.client = QdrantClient(
                    url=settings.get_qdrant_url(),
                    api_key=settings.QDRANT_API_KEY,
                    timeout=4
                )
                self.client.get_collections()
                connected = True
                print("DEBUG: Connected to remote Qdrant server.", flush=True)
            except Exception as e:
                print(f"DEBUG: Remote Qdrant server unreachable ({e}), falling back to local storage.", flush=True)

        if not connected:
            import os, glob
            os.makedirs(settings.QDRANT_PATH, exist_ok=True)
            top_lock = os.path.join(settings.QDRANT_PATH, ".lock")
            if os.path.exists(top_lock):
                try: os.remove(top_lock)
                except Exception: pass
            for f in glob.glob(os.path.join(settings.QDRANT_PATH, "**", "*.lock"), recursive=True):
                try: os.remove(f)
                except Exception: pass
            self.client = QdrantClient(path=settings.QDRANT_PATH)
            print("DEBUG: Initialized embedded local Qdrant storage.", flush=True)
            
        self._ensure_collections()

    def _ensure_collections(self):
        # 1. FACES
        try:
            self.client.get_collection("faces")
        except Exception:
            self.client.recreate_collection(
                collection_name="faces",
                vectors_config=VectorParams(size=512, distance=Distance.COSINE)
            )

        # 2. OBJECTS
        try:
             self.client.get_collection("objects")
        except Exception:
             self.client.recreate_collection(
                collection_name="objects",
                vectors_config=VectorParams(size=1280, distance=Distance.COSINE)
             )
             
        # 3. PATIENTS (Caregiver Data)
        try:
            self.client.get_collection("patients")
        except Exception:
            self.client.recreate_collection(
                collection_name="patients",
                vectors_config=VectorParams(size=512, distance=Distance.COSINE) # Same as Faces
            )

    def get_all_people(self):
        """Retrieve all enrolled persons from faces and patients collections."""
        records = []
        seen_keys = set()
        
        for col in ["faces", "patients"]:
            try:
                res = self.client.scroll(collection_name=col, limit=500, with_payload=True, with_vectors=False)
                for point in res[0]:
                    if not point.payload:
                        continue
                    payload = point.payload
                    name = payload.get("name")
                    if not name:
                        continue
                    person_id = payload.get("person_id") or name.lower().replace(" ", "_")
                    key = name.strip().lower()
                    
                    record = {
                        "id": str(point.id),
                        "person_id": person_id,
                        "name": name,
                        "relation": payload.get("relation", "Family / Contact"),
                        "notes": payload.get("notes", ""),
                        "age": payload.get("age"),
                        "type": payload.get("type", "person"),
                        "collection": col,
                        "image_base64": payload.get("image_base64"),
                        "avatar_url": payload.get("avatar_url"),
                        "has_audio": bool(payload.get("audio_base64")),
                        "audio_base64": payload.get("audio_base64"),
                        "timestamp": payload.get("timestamp")
                    }
                    
                    if key in seen_keys:
                        for existing in records:
                            if existing["name"].strip().lower() == key:
                                if not existing.get("image_base64") and record.get("image_base64"):
                                    existing["image_base64"] = record.get("image_base64")
                                if not existing.get("avatar_url") and record.get("avatar_url"):
                                    existing["avatar_url"] = record.get("avatar_url")
                                if not existing.get("has_audio") and record.get("has_audio"):
                                    existing["has_audio"] = True
                                if not existing.get("audio_base64") and record.get("audio_base64"):
                                    existing["audio_base64"] = record.get("audio_base64")
                    else:
                        seen_keys.add(key)
                        records.append(record)
            except Exception as e:
                print(f"Error fetching from {col}: {e}")
                
        return records

    def delete_person(self, identifier: str):
        """Deletes all occurrences of a person by point id, person_id, or name."""
        from qdrant_client.models import PointIdsList
        from pathlib import Path
        
        target = identifier.strip().lower()
        deleted_count = 0
        deleted_names = set()
        
        for col in ["faces", "patients"]:
            try:
                res = self.client.scroll(collection_name=col, limit=500, with_payload=True, with_vectors=False)
                points_to_delete = []
                for p in res[0]:
                    pid = str(p.id)
                    p_name = (p.payload.get("name") or "").strip().lower()
                    p_person_id = (p.payload.get("person_id") or "").strip().lower()
                    
                    if pid == target or p_name == target or p_person_id == target:
                        points_to_delete.append(p.id)
                        if p.payload.get("name"):
                            deleted_names.add(p.payload.get("name"))
                            
                if points_to_delete:
                    self.client.delete(collection_name=col, points_selector=PointIdsList(points=points_to_delete))
                    deleted_count += len(points_to_delete)
            except Exception as e:
                print(f"Error deleting from {col}: {e}")

        try:
            res_txt = self.client.scroll(collection_name="text_knowledge", limit=500, with_payload=True, with_vectors=False)
            txt_ids = []
            for p in res_txt[0]:
                p_name = (p.payload.get("name") or "").strip().lower()
                if p_name == target or any(n.strip().lower() == p_name for n in deleted_names):
                    txt_ids.append(p.id)
            if txt_ids:
                self.client.delete(collection_name="text_knowledge", points_selector=PointIdsList(points=txt_ids))
        except Exception as e:
            print(f"Error deleting text knowledge: {e}")

        try:
            names_to_clean = {target.replace(" ", "_")}
            for n in deleted_names:
                names_to_clean.add(n.lower().replace(" ", "_"))
                names_to_clean.add(n.replace(" ", "_"))

            for p_dir in [Path("photo/enrolled"), Path("audio/enrolled")]:
                if p_dir.exists():
                    for f in p_dir.iterdir():
                        if f.is_file():
                            fname_lower = f.name.lower()
                            if any(k.lower() in fname_lower for k in names_to_clean):
                                try: f.unlink()
                                except Exception: pass
        except Exception as e:
            print(f"Error cleaning files: {e}")

        return {"deleted_points": deleted_count, "names": list(deleted_names)}



    def update_person(self, identifier: str, updates: dict, new_embedding: list = None):

        """Updates metadata (and optionally face embedding) for an enrolled person."""

        target = identifier.strip().lower()

        updated_count = 0

        updated_names = set()



        for col in ["faces", "patients"]:

            try:

                res = self.client.scroll(collection_name=col, limit=500, with_payload=True, with_vectors=True if new_embedding else False)

                for p in res[0]:

                    pid = str(p.id)

                    p_name = (p.payload.get("name") or "").strip().lower()

                    p_person_id = (p.payload.get("person_id") or "").strip().lower()



                    if pid == target or p_name == target or p_person_id == target:

                        new_payload = dict(p.payload or {})

                        for k, v in updates.items():

                            if v is not None:

                                new_payload[k] = v



                        if new_embedding:

                            self.client.upsert(

                                collection_name=col,

                                points=[PointStruct(id=p.id, vector=new_embedding, payload=new_payload)],

                                wait=True

                            )

                        else:

                            self.client.set_payload(

                                collection_name=col,

                                payload=new_payload,

                                points=[p.id],

                                wait=True

                            )

                        updated_count += 1

                        if new_payload.get("name"):

                            updated_names.add(new_payload.get("name"))

            except Exception as e:

                print(f"Error updating {col}: {e}")



        try:

            from app.services.semantic_memory import semantic_memory

            res_txt = self.client.scroll(collection_name="text_knowledge", limit=500, with_payload=True, with_vectors=False)

            txt_ids = []

            for p in res_txt[0]:

                p_name = (p.payload.get("name") or "").strip().lower()

                if p_name == target or any(n.strip().lower() == p_name for n in updated_names):

                    txt_ids.append(p.id)

            if txt_ids:

                from qdrant_client.models import PointIdsList

                self.client.delete(collection_name="text_knowledge", points_selector=PointIdsList(points=txt_ids))



            name = updates.get("name") or (list(updated_names)[0] if updated_names else identifier)

            relation = updates.get("relation") or "family member"

            notes = updates.get("notes") or ""

            img_b64 = updates.get("image_base64")

            semantic_memory.add_knowledge(

                text=f"{name} is the user's {relation}. {notes}",

                name=name,

                metadata={"type": "person", "relation": relation, "image_base64": img_b64}

            )

        except Exception as e:

            print(f"Error syncing semantic memory during update: {e}")



        return {"updated_points": updated_count, "names": list(updated_names)}

    def clear_all(self):
        """Wipes and recreates faces, objects, and patients collections."""
        for col, dim in [("faces", 512), ("objects", 1280), ("patients", 512)]:
            try:
                self.client.recreate_collection(
                    collection_name=col,
                    vectors_config=VectorParams(size=dim, distance=Distance.COSINE)
                )
            except Exception as e:
                print(f"Error resetting collection {col}: {e}")

    def store_face_memory(self, person_id: str, embedding: list, metadata: dict):
        from datetime import datetime
        point_id = str(uuid.uuid4())
        if "timestamp" not in metadata: metadata["timestamp"] = datetime.now().isoformat()
        self.client.upsert(
            collection_name="faces",
            points=[PointStruct(id=point_id, vector=embedding, payload={"person_id": person_id, **metadata})],
            wait=True
        )
        return point_id

    def store_patient_memory(self, person_id: str, embedding: list, metadata: dict):
        """Store Caregiver-entered Patient info"""
        from datetime import datetime
        point_id = str(uuid.uuid4())
        if "timestamp" not in metadata: metadata["timestamp"] = datetime.now().isoformat()
        self.client.upsert(
            collection_name="patients",
            points=[PointStruct(id=point_id, vector=embedding, payload={"person_id": person_id, **metadata})],
            wait=True
        )
        return point_id

    def search_face(self, embedding: list, limit=1):
        # Search BOTH faces and patients collections for recognition
        # Merge results manually
        res1 = self.client.query_points(collection_name="faces", query=embedding, limit=limit).points
        res2 = self.client.query_points(collection_name="patients", query=embedding, limit=limit).points
        
        all_res = res1 + res2
        all_res.sort(key=lambda x: x.score, reverse=True)
        return all_res[:limit]

    def store_object_memory(self, object_id: str, embedding: list, metadata: dict):
        from datetime import datetime
        point_id = str(uuid.uuid4())
        if "timestamp" not in metadata: metadata["timestamp"] = datetime.now().isoformat()
        self.client.upsert(
            collection_name="objects",
            points=[PointStruct(id=point_id, vector=embedding, payload={"object_id": object_id, **metadata})],
            wait=True
        )
        return point_id

    def search_object(self, embedding: list, limit=1):
        response = self.client.query_points(
            collection_name="objects",
            query=embedding,
            limit=limit
        )
        return response.points

    def search_by_text(self, text_query: str):
        import difflib
        try:
            points = []
            for col in ["faces", "objects", "patients"]:
                try:
                    res = self.client.scroll(collection_name=col, limit=500, with_payload=True, with_vectors=False)
                    points.extend(res[0])
                except Exception: pass
            
            # Strict multilingual entity search logic (English, Kannada, Hindi)
            import re, unidecode
            query = text_query.lower().strip()
            query_words = re.findall(r'[ऀ-ൿa-zA-Z0-9]+', query)
            candidates = []
            max_score = 0.0

            # Relation synonym mappings across languages
            RELATION_MAP = {
                "daughter": ["daughter", "ಮಗಳು", "ಹೆಣ್ಣುಮಗಳು", "ಹೆಣ್ಮಗಳು", "बेटी", "पुत्री", "ladki"],
                "son": ["son", "ಮಗ", "ಬಾಲಕ", "ಗಂಡುಮಗ", "बेटा", "पुत्र", "ladka"],
                "wife": ["wife", "ಹೆಂಡತಿ", "ಪತ್ನಿ", "ಧರ್ಮಪತ್ನಿ", "पत्नी", "बीवी"],
                "husband": ["husband", "ಗಂಡ", "ಪತಿ", "पति", "ಶೌಹರ್"],
                "mother": ["mother", "ತಾಯಿ", "ಅಮ್ಮ", "ಮಾತೃ", "माँ", "माता", "अम्मा", "मम्मी"],
                "father": ["father", "ತಂದೆ", "ಅಪ್ಪ", "ಪಿತೃ", "पिता", "पापा", "पिताजी"],
                "sister": ["sister", "ಸಹೋದರಿ", "ಅಕ್ಕ", "ತಂಗಿ", "बहन", "दीदी"],
                "brother": ["brother", "ಸಹೋದರ", "ಅಣ್ಣ", "ತಮ್ಮ", "भाई", "भैया"],
                "doctor": ["doctor", "ವೈದ್ಯರು", "ಡಾಕ್ಟರ್", "डॉक्टर", "वैद्य"]
            }

            def norm_indic(s):
                try:
                    t = unidecode.unidecode(s).lower()
                    return ''.join([c for c in t if c.isalnum()])
                except Exception:
                    return s

            for p in points:
                if not p.payload: continue
                is_obj = p.payload.get("type") == "object"
                name = (p.payload.get("name") or "").lower().strip()
                relation = (p.payload.get("relation") or "").lower().strip()
                notes = (p.payload.get("notes") or "").lower().strip()
                
                score = 0.0
                if name:
                    name_words = name.split()
                    norm_name = norm_indic(name)

                    if name in query:
                        score += 2.5
                    elif any(w == name for w in query_words):
                        score += 2.5
                    elif any(nw in query_words for nw in name_words if len(nw) >= 3):
                        score += 1.8
                    else:
                        for word in query_words:
                            norm_w = norm_indic(word)
                            if len(norm_w) >= 3 and len(norm_name) >= 3:
                                if norm_w == norm_name:
                                    score += 2.5
                                    break
                                sim = difflib.SequenceMatcher(None, norm_w, norm_name).ratio()
                                if sim >= 0.68:
                                    score += 1.8
                                    break

                # Multilingual relation search (STRICTLY for people)
                if relation and not is_obj:
                    synonyms = RELATION_MAP.get(relation.lower(), [relation.lower()])
                    for syn in synonyms:
                        if syn in query or f"my {syn}" in query or f"मेरी {syn}" in query or f"ನನ್ನ {syn}" in query:
                            score += 2.2
                            break

                if score > max_score:
                    max_score = score
                    candidates = [p]
                elif score == max_score and score >= 1.0:
                    candidates.append(p)
            
            if max_score >= 1.0:
                candidates.sort(key=lambda x: x.payload.get("timestamp", ""), reverse=True)
                return candidates[:5]
            return []

        except Exception as e:
            print(f"Fuzzy search error: {e}")
            return []

memory_service = MemoryService()
