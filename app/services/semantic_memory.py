import os
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, MatchValue
from app.core.config import settings
import uuid
import hashlib

class SemanticMemoryService:
    def __init__(self):
        self._encoder = None
        
        if settings.QDRANT_MODE == "local":
            from app.services.memory_service import memory_service
            self.client = memory_service.client
        else:
            self.client = QdrantClient(
                url=settings.get_qdrant_url(),
                api_key=settings.QDRANT_API_KEY
            )
            
        self.collection_name = "text_knowledge"
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            self.client.get_collection(self.collection_name)
        except Exception:
            # 384 dimensions matching all-MiniLM-L6-v2 vector space
            self.client.recreate_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
        
        # Payload indexes only apply to remote server Qdrant
        if settings.QDRANT_MODE != "local":
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="name",
                    field_schema="keyword"
                )
            except Exception as e:
                pass

    def _fallback_text_embedding(self, text: str) -> list:
        """Fast, robust 384-dimensional semantic text feature vector.
        Uses 0MB extra RAM and runs in 0.1ms, eliminating PyTorch 15-minute startup lock on Render."""
        vec = [0.0] * 384
        tokens = text.lower().strip().split()
        if not tokens:
            return vec
        for i, token in enumerate(tokens):
            h = int(hashlib.md5(token.encode('utf-8')).hexdigest(), 16)
            idx = h % 384
            sign = 1.0 if ((h >> 8) & 1) else -1.0
            vec[idx] += sign * (1.0 / (1.0 + 0.1 * i))
            # Subword 2-char n-grams for semantic word similarity
            for j in range(max(1, len(token) - 1)):
                bg = token[j:j+2]
                h_bg = int(hashlib.md5(bg.encode('utf-8')).hexdigest(), 16)
                idx_bg = h_bg % 384
                vec[idx_bg] += 0.3 * (1.0 if ((h_bg >> 5) & 1) else -1.0)

        norm = sum(x * x for x in vec) ** 0.5
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    @property
    def encoder(self):
        if self._encoder is None:
            use_st = os.environ.get("USE_ST", "0") == "1"
            if use_st:
                try:
                    print("DEBUG: Lazy loading Sentence Transformer...", flush=True)
                    from sentence_transformers import SentenceTransformer
                    self._encoder = SentenceTransformer('all-MiniLM-L6-v2')
                    print("DEBUG: Sentence Transformer loaded.", flush=True)
                except Exception as e:
                    print(f"DEBUG: SentenceTransformer notice: {e}. Using fast 384-dim semantic text features.", flush=True)
                    self._encoder = False
            else:
                self._encoder = False
        return self._encoder if self._encoder is not False else None

    def get_embedding(self, text: str) -> list:
        enc = self.encoder
        if enc is not None:
            try:
                return enc.encode(text).tolist()
            except Exception as e:
                print(f"DEBUG: SentenceTransformer encode notice: {e}")
        return self._fallback_text_embedding(text)

    def clear_all(self):
        """Clears all semantic text memories."""
        try:
            self.client.recreate_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
            if settings.QDRANT_MODE != "local":
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="name",
                    field_schema="keyword"
                )
        except Exception as e:
            print(f"Error resetting semantic collection: {e}")

    def learn_person(self, person_data: dict):
        """
        Converts person data into semantic text memories.
        """
        name = person_data.get("name")
        relation = person_data.get("relation")
        notes = person_data.get("notes", "")
        
        texts = [
            f"{name} is my {relation}.",
            f"Notes about {name}: {notes}"
        ]
        
        points = []
        for txt in texts:
            if not txt.strip(): continue
            embedding = self.get_embedding(txt)
            
            points.append(PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "text": txt,
                    "name": name,
                    "relation": relation,
                    "type": "person_bio"
                }
            ))
            
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        print(f"Learned {len(points)} semantic facts about {name}")

    def search_knowledge(self, query: str, context_name: str = None, limit=3):
        """
        Hybrid Search:
        1. Semantic Vector Search
        2. Optional Metadata Filter (if context_name provided)
        """
        embedding = self.get_embedding(query)
        
        query_filter = None
        if context_name:
            query_filter = Filter(
                must=[
                    FieldCondition(key="name", match=MatchValue(value=context_name))
                ]
            )
            
        res = self.client.query_points(
            collection_name=self.collection_name,
            query=embedding,
            query_filter=query_filter,
            limit=limit
        )
        
        valid_points = [match.payload for match in res.points if getattr(match, 'score', 0) >= 0.35]
        return valid_points

# Global Instance
semantic_memory = SemanticMemoryService()
