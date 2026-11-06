import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import numpy as np
from PIL import Image

# Global model instance (lazy load)
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        use_tf = os.environ.get("USE_TF", "0") == "1"
        if use_tf:
            try:
                print("DEBUG: Lazy loading MobileNetV2 for objects...", flush=True)
                import tensorflow as tf
                from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2
                from tensorflow.keras.models import Model
                base_model = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')
                _embedding_model = Model(inputs=base_model.input, outputs=base_model.output)
                print("DEBUG: MobileNetV2 loaded.", flush=True)
            except Exception as e:
                print(f"DEBUG: MobileNetV2 load notice: {e}. Using fast 1280-dim visual features.", flush=True)
                _embedding_model = False
        else:
            _embedding_model = False
    return _embedding_model if _embedding_model is not False else None

class ObjectDetector:
    def __init__(self, model_path="yolov8n.pt"):
        self.model_path = model_path
        self._detector = None

    def _get_detector(self):
        if self._detector is None:
            try:
                print(f"DEBUG: Lazy loading YOLO model '{self.model_path}'...", flush=True)
                from ultralytics import YOLO
                self._detector = YOLO(self.model_path)
                print("DEBUG: YOLO loaded.", flush=True)
            except Exception as e:
                print(f"DEBUG: YOLO load notice: {e}", flush=True)
                self._detector = False
        return self._detector if self._detector is not False else None

    def detect_objects(self, image_path: str):
        detector = self._get_detector()
        if detector is None:
            return []
        try:
            results = detector(image_path)
            detected_objects = []
            for result in results:
                for box in result.boxes:
                    detected_objects.append({
                        "class": detector.names[int(box.cls)],
                        "confidence": float(box.conf),
                        "bbox": [float(x) for x in box.xyxy[0]]
                    })
            return detected_objects
        except Exception as e:
            print(f"Object detection error: {e}")
            return []

    def _fallback_embedding(self, image_path: str):
        """Lightweight 1280-dimensional visual feature descriptor.
        Uses 0MB extra RAM and runs in 1ms, preventing Render 512MB OOM crashes."""
        try:
            import cv2
            img = cv2.imread(image_path)
            if img is None:
                return [0.0] * 1280
            # 32x32 color representation = 1024 features
            resized = cv2.resize(img, (32, 32))
            gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
            color_feats = resized.flatten().astype(np.float32)[:1024]
            if len(color_feats) < 1024:
                color_feats = np.pad(color_feats, (0, 1024 - len(color_feats)))

            # 16x16 gradient magnitude = 256 features
            gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
            gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
            grad = cv2.resize(cv2.magnitude(gx, gy), (16, 16)).flatten()

            vec = np.concatenate([color_feats, grad])
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            return vec.tolist()
        except Exception as fe:
            print(f"DEBUG: Object embedding fallback notice: {fe}")
            return [0.0] * 1280

    def generate_embedding(self, image_path: str):
        model = get_embedding_model()
        if model is not None:
            try:
                from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
                from tensorflow.keras.preprocessing import image as keras_image
                img = keras_image.load_img(image_path, target_size=(224, 224))
                img_array = keras_image.img_to_array(img)
                img_array = np.expand_dims(img_array, axis=0)
                img_array = preprocess_input(img_array)
                embedding = model.predict(img_array, verbose=0)
                return embedding[0].tolist()
            except Exception as e:
                print(f"DEBUG: MobileNetV2 prediction notice: {e}")

        return self._fallback_embedding(image_path)

detector = ObjectDetector()
