# NLP Service - Vietnamese Comment Classification

Service phân loại bình luận tiếng Việt sử dụng PhoBERT.

## Cài đặt

```bash
pip install -r requirements.txt
```

## Training Model

### 1. Chuẩn bị dữ liệu

Dữ liệu đã có sẵn tại `../data_comment_moderation_project.jsonl` với format:
```json
{"free_text": "nội dung bình luận", "label_id": 0}
```

Label mapping:
- `0`: normal (bình thường)
- `1`: offensive (xúc phạm)
- `2`: hateful (căm thù)
- `3`: spam

### 2. Train model

**Cơ bản:**
```bash
python train.py
```

**Với tham số tùy chỉnh:**
```bash
python train.py \
  --data_path ../data_comment_moderation_project.jsonl \
  --output_dir ./model_storage \
  --model_name vinai/phobert-base \
  --batch_size 16 \
  --num_epochs 5 \
  --learning_rate 2e-5 \
  --max_length 256
```

**Tham số:**
- `--data_path`: Đường dẫn file JSONL
- `--output_dir`: Thư mục lưu model (mặc định: `./model_storage`)
- `--model_name`: Model pretrained (mặc định: `vinai/phobert-base`, có thể dùng `vinai/phobert-large`)
- `--batch_size`: Batch size (mặc định: 16, giảm xuống nếu bị out of memory)
- `--num_epochs`: Số epoch (mặc định: 5)
- `--learning_rate`: Learning rate (mặc định: 2e-5)
- `--max_length`: Độ dài tối đa sequence (mặc định: 256)

### 3. Quá trình training

Script sẽ:
1. Load và phân tích dữ liệu (136K+ samples)
2. Chia dữ liệu: 80% train, 10% validation, 10% test (stratified)
3. Fine-tune PhoBERT model
4. Tự động lưu checkpoint tốt nhất (theo F1-weighted)
5. Đánh giá trên test set
6. Lưu model, tokenizer, và label mapping vào `model_storage/`

**Kết quả:**
- Model: `model_storage/pytorch_model.bin`
- Tokenizer: `model_storage/tokenizer_config.json`, `model_storage/vocab.txt`
- Label mapping: `model_storage/label_map.json`
- Training logs: `model_storage/logs/`

### 4. Hardware Requirements

- **CPU only**: Batch size 8-16, ~30-60 phút/epoch
- **GPU (CUDA)**: Batch size 16-32, ~5-10 phút/epoch
- **RAM**: Tối thiểu 8GB
- **Disk**: ~1GB cho model + data

## Chạy API Server

Sau khi train xong:

```bash
python main.py
```

Server sẽ chạy tại `http://0.0.0.0:8001`

### Test API

```bash
curl -X POST "http://localhost:8001/classify" \
  -H "Content-Type: application/json" \
  -d '{"text": "Bài viết rất hay và bổ ích!"}'
```

Response:
```json
{
  "label": 0,
  "label_name": "normal",
  "confidence": 0.9876
}
```

## Evaluation Metrics

Model được đánh giá theo:
- **Accuracy**: Tỷ lệ dự đoán đúng
- **F1 Macro**: F1 trung bình cho tất cả các class (không weighted)
- **F1 Weighted**: F1 trung bình có trọng số theo số lượng mẫu

## Tips

1. **Out of Memory**: Giảm `--batch_size` xuống 8 hoặc 4
2. **Model quá lớn**: Dùng `vinai/phobert-base` thay vì `vinai/phobert-large`
3. **Training lâu**: Dùng GPU hoặc giảm `--num_epochs`
4. **Overfitting**: Tăng `weight_decay` hoặc giảm `num_epochs`
5. **Early stopping**: Model tự động dừng nếu không cải thiện sau 3 eval steps

## Troubleshooting

**Lỗi: "Model not found"**
```bash
# Chạy training trước
python train.py
```

**Lỗi: "CUDA out of memory"**
```bash
# Giảm batch size
python train.py --batch_size 8
```

**Lỗi: "Invalid JSON in data file"**
```bash
# Script sẽ tự động skip dòng lỗi và tiếp tục
# Kiểm tra log để xem số dòng bị skip
```
