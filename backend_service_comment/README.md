# backend_service_comment (Node.js)

This folder contains the Node.js implementation of the comment moderation backend.

Quick start

1. Copy `.env.example` to `.env` and edit connection values:

```
MONGODB_URL=mongodb://localhost:27017
DB_NAME=comment_db
NLP_SERVICE_URL=http://localhost:8001/classify
PORT=8000
```

2. Install dependencies and run:

```powershell
cd C:\comment_moderation_project\backend_service_comment
npm install
npm run dev
```

APIs

- POST /comments — create comment (calls NLP service, auto-moderates)
- GET /comments?status=pending|approved|rejected — list comments
- PUT /comments/:id — update status (`{ status: 'approved'|'rejected' }`)
- DELETE /comments/:id — delete comment

Notes

- The server will ensure indexes on `status` and compound (`status`, `created_at`) at startup using the Mongoose schema indexes.
- Keep `.env` out of version control.
