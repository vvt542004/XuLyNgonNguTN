import os
import json
from typing import Tuple
from pathlib import Path

import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification


LABEL_MAP = {0: "normal", 1: "offensive", 2: "hateful", 3: "spam"}


class CommentClassifier:
    """Loads a fine-tuned PhoBERT model from ./model_storage and exposes predict(text).

    Expectation: user will place a HuggingFace-style model in `./model_storage`
    (pytorch_model.bin, config.json, tokenizer files, etc.).
    """

    def __init__(self, model_dir: str = "./model_storage", device: str = None):
        self.model_dir = model_dir
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.tokenizer = None
        self.label_map = LABEL_MAP.copy()
        self._load_model()

    def _load_model(self):
        # If folder doesn't exist or is empty, we'll keep model/tokenizer as None and raise later.
        if not os.path.isdir(self.model_dir):
            return
        try:
            # Load custom label mapping if exists
            label_map_path = Path(self.model_dir) / 'label_map.json'
            if label_map_path.exists():
                with open(label_map_path, 'r', encoding='utf-8') as f:
                    loaded_map = json.load(f)
                    # Convert string keys to int
                    self.label_map = {int(k): v for k, v in loaded_map.items()}
                    print(f"Loaded custom label mapping: {self.label_map}")
            
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_dir)
            self.model.to(self.device)
            self.model.eval()
            print(f"Model loaded successfully from {self.model_dir} on device {self.device}")
        except Exception as e:
            raise RuntimeError(f"Failed to load model from {self.model_dir}: {e}")

    def predict(self, text: str) -> Tuple[int, str, float]:
        """Predict label for a single text.

        Returns:
            (label:int, label_name:str, confidence:float)
        """
        if not text or not text.strip():
            raise ValueError("Input text is empty")

        if self.model is None or self.tokenizer is None:
            raise RuntimeError(
                "Model not loaded. Place your fine-tuned model files inside './model_storage'."
            )

        # Tokenize and move tensors to device
        inputs = self.tokenizer(
            text, padding=True, truncation=True, return_tensors="pt"
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = F.softmax(logits, dim=-1)
            top_prob, top_idx = torch.max(probs, dim=-1)
            label = int(top_idx.item())
            confidence = float(top_prob.item())
            label_name = self.label_map.get(label, "unknown")

        return label, label_name, confidence
