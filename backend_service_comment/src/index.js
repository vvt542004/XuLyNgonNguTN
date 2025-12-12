require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const commentsRouter = require('./routes/comments');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// mount routes
app.use('/comments', commentsRouter);

// env
const MONGODB_URL = process.env.MONGODB_URL;
const DB_NAME = process.env.DB_NAME || 'comment_db';
const PORT = process.env.PORT || 8000;

if (!MONGODB_URL) {
    console.error('Missing MONGODB_URL in .env');
    process.exit(1);
}

async function start() {
    try {
        await mongoose.connect(MONGODB_URL, {
            dbName: DB_NAME,
            retryWrites: true,
            w: 'majority'
        });
        console.log('✅ Connected to MongoDB');

        const port = PORT;
        app.listen(port, () => {
            console.log(`🚀 backend_service_comment running on http://127.0.0.1:${port}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server', err);
        process.exit(1);
    }
}

start();
