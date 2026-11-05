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
        print("DEBUG: Lazy loading MobileNetV2 for objects...", flush=True)
        import tensorflow as tf
        from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2
        from tensorflow.keras.models import Model
        base_model = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')
        _embedding_model = Model(inputs=base_model.input, outputs=base_model.output)
        print("DEBUG: MobileNetV2 loaded.", flush=True)
    return _embedding_model

class ObjectDetector:
    def __init__(self, model_path="yolov8n.pt"):
        self.model_path = model_path
        self._detector = None

    def _get_detector(self):
        if self._detector is None:
            print(f"DEBUG: Lazy loading YOLO model '{self.model_path}'...", flush=True)
            from ultralytics import YOLO
            self._detector = YOLO(self.model_path)
            print("DEBUG: YOLO loaded.", flush=True)
        return self._detector

    def detect_objects(self, image_path: str):
        detector = self._get_detector()
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

    def generate_embedding(self, image_path: str):
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
        from tensorflow.keras.preprocessing import image as keras_image
        model = get_embedding_model()
        img = keras_image.load_img(image_path, target_size=(224, 224))
        img_array = keras_image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        embedding = model.predict(img_array, verbose=0)
        return embedding[0].tolist()

detector = ObjectDetector()
