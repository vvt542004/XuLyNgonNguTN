# nlp_service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import json
import os

app = FastAPI(title="PhoBERT Comment Classifier")

class TextRequest(BaseModel):
    text: str

# =========================
# LOAD MODEL
# =========================

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model_storage")

# Load tokenizer (lấy từ pretrained vì checkpoint không có tokenizer)
tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")

# Load model
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
model.eval()

# Load LABEL_MAP (nếu có)
LABEL_MAP_PATH = os.path.join(MODEL_DIR, "label_map.json")
if os.path.exists(LABEL_MAP_PATH):
    with open(LABEL_MAP_PATH, "r", encoding="utf-8") as f:
        LABEL_MAP = json.load(f)
else:
    LABEL_MAP = {
        "0": "normal",
        "1": "offensive",
        "2": "hateful",
        "3": "spam"
    }

def predict_phobert(text: str):
    """
    Dự đoán bằng mô hình PhoBERT fine-tuned
    """
    encoding = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding="max_length",
        max_length=256
    )

    with torch.no_grad():
        outputs = model(**encoding)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=1)
        pred = torch.argmax(probs, dim=1).item()
        confidence = float(probs[0][pred])

    # Label map key phải là string
    label_name = LABEL_MAP.get(str(pred), f"class_{pred}")

    return {
        "label_id": pred,
        "label_name": label_name,
        "confidence": confidence
    }

# =========================
# API ENDPOINTS
# =========================

@app.post("/classify")
async def classify(req: TextRequest):
    text = req.text.strip()
    result = predict_phobert(text)
    return result

@app.get("/health")
async def health():
    return {"status": "ok"}
