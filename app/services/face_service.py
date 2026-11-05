import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

print("DEBUG: Importing OpenCV...", flush=True)
import cv2
print("DEBUG: Importing Keras-Facenet...", flush=True)
from keras_facenet import FaceNet
print("DEBUG: Importing PIL/Numpy...", flush=True)
from PIL import Image
import numpy as np

class FaceService:
    def __init__(self, model_name="Facenet512"):
        print("DEBUG: Loading OpenCV and Keras-Facenet...", flush=True)
        # Load Haar Cascade safely with robust fallback
        self.face_cascade = None
        try:
            if hasattr(cv2, 'CascadeClassifier') and hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
                cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
                if os.path.exists(cascade_path):
                    self.face_cascade = cv2.CascadeClassifier(cascade_path)
            elif hasattr(cv2, 'CascadeClassifier'):
                self.face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
        except Exception as ce:
            print(f"DEBUG: Haar cascade load warning (will use center crop fallback): {ce}", flush=True)
            self.face_cascade = None

        cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".keras-facenet")
        self.embedder = FaceNet(cache_folder=cache_dir)
        self.model_name = model_name
        print("DEBUG: Face Models Loaded.", flush=True)

    def generate_embedding(self, image_path: str) -> list:
        try:
            # OpenCV reads in BGR, Keras-FaceNet expects RGB
            img_bgr = cv2.imread(image_path)
            if img_bgr is None:
                print(f"Could not read image: {image_path}")
                return []
            
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            
            # Detect faces with Haar Cascade if loaded
            faces = ()
            if self.face_cascade is not None:
                try:
                    faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
                except Exception as de:
                    print(f"DEBUG: Haar detection error: {de}", flush=True)
                    faces = ()
            
            if len(faces) == 0:
                print(f"No face detected by Haar cascade in {image_path}, using center crop...")
                h_img, w_img, _ = img_rgb.shape
                min_dim = min(h_img, w_img)
                start_x = (w_img - min_dim) // 2
                start_y = (h_img - min_dim) // 2
                face = img_rgb[start_y:start_y+min_dim, start_x:start_x+min_dim]
            else:
                # Take largest face detected
                face_data = max(faces, key=lambda f: f[2] * f[3])
                x, y, w, h = face_data
                
                # Add 15% margin around face bounding box for better facial context
                margin = int(0.15 * max(w, h))
                x1 = max(0, x - margin)
                y1 = max(0, y - margin)
                x2 = min(img_rgb.shape[1], x + w + margin)
                y2 = min(img_rgb.shape[0], y + h + margin)
                face = img_rgb[y1:y2, x1:x2]
            
            # Keras-FaceNet expects raw uint8 RGB image in range [0, 255]
            # DO NOT divide by 255 here, because embedder._normalize() handles standardization!
            face_uint8 = np.asarray(face, dtype=np.uint8)
            
            # Generate 512-dim embedding
            raw_embedding = self.embedder.embeddings([face_uint8])[0]
            
            # L2-normalize vector to unit sphere for accurate cosine similarity
            norm = np.linalg.norm(raw_embedding)
            if norm > 0:
                embedding = (raw_embedding / norm).tolist()
            else:
                embedding = raw_embedding.tolist()
                
            return embedding
            
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return []

    def verify(self, img1_path, img2_path):
        emb1 = self.generate_embedding(img1_path)
        emb2 = self.generate_embedding(img2_path)
        if not emb1 or not emb2:
            return False
        v1 = np.array(emb1)
        v2 = np.array(emb2)
        cos_sim = float(np.dot(v1, v2))
        # High confidence match threshold >= 0.65
        return cos_sim >= 0.65

    def analyze(self, img_path):
        return [{
            "age": 25, 
            "gender": "unknown", 
            "dominant_emotion": "neutral",
            "race": "unknown"
        }]

face_service = FaceService()
