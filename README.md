Link Google Colab :  https://colab.research.google.com/drive/18T43t6Cr6y4wXh5LlE2kGLOU-cv0M6yS?usp=sharing

This repository contains a small microservice architecture that simulates a comment moderation pipeline similar to what social networks use. The system is split into three services:

- `nlp_service` — the AI "brain" (Python FastAPI + Transformers / PhoBERT) that classifies Vietnamese comment text using a **trained model** on real data.
- `backend_service_comment` — the main backend (Node.js + Express + MongoDB via Mongoose) that accepts comments from the client, calls `nlp_service`, stores comments and provides moderator APIs.
- `client` — React.js single-page application (SPA) for users and moderators.

---

Architecture Overview

- `client` -> `backend_service_comment` -> `nlp_service`
- `backend_service_comment` stores comments in MongoDB.

Default ports:
- `nlp_service`: 8001
- `backend_service_comment`: 8000
- `client`: 3000

Requirements / Dependencies

Install Python dependencies per-service using the provided `requirements.txt` files.

nlp_service:
 - `nlp_service/requirements.txt` (fastapi, uvicorn, pydantic, torch, transformers, scikit-learn, numpy, datasets, accelerate)

backend_service_comment:
 - `backend_service_comment/package.json` (Node.js: express, mongoose, axios, cors, dotenv)

client:
 - React dependencies (react, react-dom, react-router-dom, axios)

Recommended: create a venv per service and install requirements.

Startup Order (recommended)

1. **Train NLP Model** (one-time setup)
2. Start MongoDB
3. Start `nlp_service`
4. Start `backend_service_comment`
5. Start `client` dev server

How to run each service

0) **Train NLP Model** (IMPORTANT - Required before first run)

The project includes training data in `data_comment_moderation_project.jsonl` (136K+ Vietnamese comments).

    cd C:\comment_moderation_project\nlp_service
    python -m pip install -r requirements.txt
    
    # Train PhoBERT model on Vietnamese comments
    python train.py --data_path ../data_comment_moderation_project.jsonl
    
    # Training will:
    # - Load 136K+ samples
    # - Split: 80% train, 10% validation, 10% test
    # - Fine-tune PhoBERT (vinai/phobert-base)
    # - Save trained model to ./model_storage/
    # - Print evaluation metrics (accuracy, F1 score)

Training options:
- `--batch_size 16` (default, reduce to 8 if out of memory)
- `--num_epochs 5` (default)
- `--learning_rate 2e-5` (default)
- `--model_name vinai/phobert-base` (or vinai/phobert-large)

See `nlp_service/README.md` for detailed training instructions.

**Hardware requirements:**
- CPU only: ~30-60 min/epoch
- GPU (CUDA): ~5-10 min/epoch  
- RAM: 8GB minimum
- Disk: ~1GB for model + data

1) MongoDB

Run locally or via Docker. Example Docker command:

    docker run -d -p 27017:27017 --name comment-mongo mongo:6

Or use MongoDB Atlas (cloud) - connection string already configured in backend.

2) nlp_service

    cd C:\comment_moderation_project\nlp_service
    
    # If not installed yet:
    python -m pip install -r requirements.txt
    
    # Make sure model is trained (see step 0)
    # Model files should exist in ./model_storage/
    
    # Start API server
    python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

3) backend_service_comment

    cd C:\comment_moderation_project\backend_service_comment
    npm install
    # .env file already exists with MongoDB Atlas connection
    npm run dev

.env sample (already configured):

    MONGODB_URL=mongodb+srv://xuanlam13072004_db_user:Malnaux1307@commentmoderationcluste.fu89twq.mongodb.net
    DB_NAME=comment_db
    NLP_SERVICE_URL=http://localhost:8001/classify
    PORT=8000

Notes: The backend will ensure indexes on startup (status, and compound status+created_at) using Mongoose schema indexes.

4) client (React)

    cd C:\comment_moderation_project\client
    npm install
    npm start

The client will start on http://localhost:3000

Label Classification

The trained model classifies comments into 4 categories:

- `0: normal` → Auto-approved
- `1: offensive` → Pending review
- `2: hateful` → Pending review  
- `3: spam` → Pending review

Auto-moderation logic: Only "normal" comments are automatically approved. All other types require manual review by moderators.

Testing the System

End-to-end test (from backend_service_comment folder):

    cd C:\comment_moderation_project\backend_service_comment
    node test.js

This will:
1. Create normal, spam, and hateful comments
2. Verify auto-moderation (normal→approved, toxic→pending)
3. Test admin approve/delete operations
4. Print detailed results

Notes and next steps

- ✅ NLP model trained on real Vietnamese comment data (136K+ samples)
- ✅ Auto-moderation based on AI classification
- ✅ MongoDB Atlas cloud integration
- ⚠️ Add authentication to admin endpoints before production
- ⚠️ Add rate limiting for API endpoints
- ⚠️ Consider adding health endpoints for readiness/liveness checks
- ⚠️ Optionally add docker-compose to orchestrate services

Project Structure

```
comment_moderation_project/
├── data_comment_moderation_project.jsonl  # Training data (136K+ samples)
├── nlp_service/                           # AI classification service
│   ├── train.py                          # Training script
│   ├── main.py                           # FastAPI server
│   ├── model.py                          # PhoBERT classifier
│   ├── model_storage/                    # Trained model files (after training)
│   └── README.md                         # Training instructions
├── backend_service_comment/              # Main API server
│   ├── src/
│   │   ├── index.js                     # Express server
│   │   ├── models/comment.js            # MongoDB schema
│   │   └── routes/comments.js           # API endpoints
│   ├── test.js                          # E2E tests
│   └── package.json
└── client/                               # React frontend
    ├── src/
    │   ├── App.js                       # Main app with routing
    │   ├── api/commentService.js        # API client
    │   └── pages/                       # User & Admin views
    └── package.json
```
