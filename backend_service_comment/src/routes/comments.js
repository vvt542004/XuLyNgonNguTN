const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const mongoose = require('mongoose');
const axios = require('axios');

// POST /comments
router.post('/', async (req, res) => {
    try {
        let { username, content } = req.body;
        if (!username || !content) return res.status(400).json({ detail: 'username and content required' });

        username = username.trim();
        content = content.trim();
        if (!username || !content) return res.status(400).json({ detail: 'username/content cannot be empty' });

        const NLP_URL = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:8001/classify';
        let nlp;
        try {
            const nlpRes = await axios.post(NLP_URL, { text: content }, { timeout: 15000 });
            nlp = nlpRes.data;
        } catch (err) {
            console.error('NLP service error:', err.message || err);
            return res.status(503).json({ detail: 'NLP service unavailable' });
        }

        // expected nlp => { label_name: 'normal'|'offensive'|'hateful'|'spam', confidence: 0.xx }
        if (!nlp || typeof nlp.label_name !== 'string' || typeof nlp.confidence !== 'number') {
            return res.status(500).json({ detail: 'Invalid NLP response', raw: nlp });
        }

        const label_name = nlp.label_name;
        const confidence = nlp.confidence;
        const status = (label_name === 'normal') ? 'approved' : 'pending';

        const comment = new Comment({
            username, content, status, predicted_label: label_name, confidence
        });

        const saved = await comment.save();
        return res.status(201).json(saved);

    } catch (err) {
        console.error('POST /comments error:', err);
        return res.status(500).json({ detail: 'Failed to process comment' });
    }
});

// GET /comments?status=&page=&limit=
router.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const query = {};
        if (status) query.status = status;
        const items = await Comment.find(query)
            .sort({ created_at: -1 })
            .skip((Math.max(1, page) - 1) * Number(limit))
            .limit(Number(limit))
            .exec();
        const total = await Comment.countDocuments(query);
        return res.json({ total, page: Number(page), limit: Number(limit), items });
    } catch (err) {
        console.error('GET /comments error:', err);
        return res.status(500).json({ detail: 'Failed to fetch comments' });
    }
});

// PUT /comments/:id  (update status)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ detail: 'Invalid status' });
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ detail: 'Invalid id' });
        const updated = await Comment.findByIdAndUpdate(id, { status }, { new: true }).exec();
        if (!updated) return res.status(404).json({ detail: 'Not found' });
        return res.json(updated);
    } catch (err) {
        console.error('PUT /comments/:id error:', err);
        return res.status(500).json({ detail: 'Failed to update' });
    }
});

// DELETE /comments/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ detail: 'Invalid id' });
        const result = await Comment.findByIdAndDelete(id).exec();
        if (!result) return res.status(404).json({ detail: 'Not found' });
        return res.json({ detail: 'deleted' });
    } catch (err) {
        console.error('DELETE /comments/:id error:', err);
        return res.status(500).json({ detail: 'Failed to delete' });
    }
});

module.exports = router;
