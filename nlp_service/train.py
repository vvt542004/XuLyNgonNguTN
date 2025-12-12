"""
Script to train PhoBERT model for Vietnamese comment classification
"""
import json
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report
import numpy as np
from pathlib import Path
import logging
import os

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Label mapping
LABEL_MAP = {
    0: "normal",
    1: "offensive", 
    2: "hateful",
    3: "spam"
}

class CommentDataset(Dataset):
    """Dataset for Vietnamese comments"""
    
    def __init__(self, texts, labels, tokenizer, max_length=256):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }


def load_data(data_path):
    """Load and parse JSONL data"""
    logger.info(f"Loading data from: {data_path}")

    # Auto convert to absolute path
    data_path = Path(data_path).resolve()

    if not data_path.exists():
        raise FileNotFoundError(f"❌ File không tồn tại: {data_path}")

    texts = []
    labels = []
    
    with open(data_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            try:
                line = line.strip()
                if not line:
                    continue
                    
                data = json.loads(line)
                texts.append(data['free_text'])
                labels.append(data['label_id'])
                
                if line_num % 10000 == 0:
                    logger.info(f"Loaded {line_num} samples...")
                    
            except json.JSONDecodeError as e:
                logger.warning(f"Skipping line {line_num}: Invalid JSON - {e}")
                continue
    
    logger.info(f"Loaded {len(texts)} samples total")
    
    # Print label distribution
    unique, counts = np.unique(labels, return_counts=True)
    logger.info("Label distribution:")
    for label_id, count in zip(unique, counts):
        label_name = LABEL_MAP.get(label_id, f"unknown_{label_id}")
        logger.info(f"  {label_name} ({label_id}): {count} samples ({count/len(labels)*100:.2f}%)")
    
    return texts, labels


def compute_metrics(eval_pred):
    """Compute metrics for evaluation"""
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=1)
    
    accuracy = accuracy_score(labels, predictions)
    f1_macro = f1_score(labels, predictions, average='macro')
    f1_weighted = f1_score(labels, predictions, average='weighted')
    
    return {
        'accuracy': accuracy,
        'f1_macro': f1_macro,
        'f1_weighted': f1_weighted
    }


def train_model(
    data_path,
    output_dir='./model_storage',
    model_name='vinai/phobert-base',
    test_size=0.2,
    val_size=0.1,
    max_length=256,
    batch_size=16,
    num_epochs=5,
    learning_rate=2e-5,
    warmup_steps=500,
    weight_decay=0.01,
    seed=42
):
    """Train PhoBERT model on Vietnamese comment data"""
    
    torch.manual_seed(seed)
    np.random.seed(seed)
    
    # Load data
    texts, labels = load_data(data_path)
    
    # Split datasets
    train_texts, test_texts, train_labels, test_labels = train_test_split(
        texts, labels, test_size=test_size, random_state=seed, stratify=labels
    )
    
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        train_texts, train_labels, test_size=val_size, random_state=seed, stratify=train_labels
    )
    
    logger.info(f"Train samples: {len(train_texts)}")
    logger.info(f"Validation samples: {len(val_texts)}")
    logger.info(f"Test samples: {len(test_texts)}")
    
    # Load pretrained PhoBERT
    logger.info(f"Loading model: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=4
    )
    
    # Dataset objects
    train_dataset = CommentDataset(train_texts, train_labels, tokenizer, max_length)
    val_dataset = CommentDataset(val_texts, val_labels, tokenizer, max_length)
    test_dataset = CommentDataset(test_texts, test_labels, tokenizer, max_length)
    
    # Training config
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=num_epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        warmup_steps=warmup_steps,
        weight_decay=weight_decay,
        learning_rate=learning_rate,
        logging_dir=f'{output_dir}/logs',
        logging_steps=100,
        evaluation_strategy='steps',
        eval_steps=500,
        save_strategy='steps',
        save_steps=500,
        save_total_limit=3,
        load_best_model_at_end=True,
        metric_for_best_model='f1_weighted',
        greater_is_better=True,
        report_to='none',
        seed=seed
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
    )
    
    # Training
    logger.info("🚀 Starting training...")
    trainer.train()
    
    # Evaluation
    logger.info("Evaluating on test set...")
    test_results = trainer.evaluate(test_dataset)
    logger.info(f"Test results: {test_results}")
    
    predictions = trainer.predict(test_dataset)
    pred_labels = np.argmax(predictions.predictions, axis=1)
    
    logger.info("\nClassification Report:")
    report = classification_report(
        test_labels, 
        pred_labels,
        target_names=[LABEL_MAP[i] for i in range(4)],
        digits=4
    )
    logger.info(f"\n{report}")
    
    # Save model
    logger.info(f"Saving model to {output_dir}")
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    
    with open(Path(output_dir) / 'label_map.json', 'w', encoding='utf-8') as f:
        json.dump(LABEL_MAP, f, ensure_ascii=False, indent=2)
    
    logger.info("🎉 Training completed successfully!")
    
    return trainer, test_results


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Train PhoBERT for comment moderation')
    parser.add_argument(
        '--data_path',
        type=str,
        default="../data_comment_moderation_project.jsonl",  # auto resolve
        help='Path to JSONL data file'
    )
    parser.add_argument(
        '--output_dir',
        type=str,
        default='./model_storage',
        help='Directory to save trained model'
    )
    parser.add_argument(
        '--model_name',
        type=str,
        default='vinai/phobert-base',
        help='Pretrained model name'
    )
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--num_epochs', type=int, default=5)
    parser.add_argument('--learning_rate', type=float, default=2e-5)
    parser.add_argument('--max_length', type=int, default=256)
    
    args = parser.parse_args()
    
    train_model(
        data_path=args.data_path,
        output_dir=args.output_dir,
        model_name=args.model_name,
        batch_size=args.batch_size,
        num_epochs=args.num_epochs,
        learning_rate=args.learning_rate,
        max_length=args.max_length
    )
