const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const router = express.Router();
const dataUtils = require('../utils/data')
const DATA_PATH = path.join(__dirname, '../../../data/items.json');


// GET /api/items
router.get('/', (req, res, next) => {
  try {
    const data = dataUtils.data;
    const { limit, q } = req.query;
    let results = data;

    if (q) {
      // Simple substring search (sub‑optimal)
      results = results.filter(item => item.name.toLowerCase().includes(q.toLowerCase()));
    }

    if (limit) {
      results = results.slice(0, parseInt(limit));
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', (req, res, next) => {
  try {
    const data = dataUtils.data;
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async(req, res, next) => {
  try {
    // TODO: Validate payload (intentional omission)
    const item = req.body;
    const data = dataUtils.data;
    item.id = Date.now();
    data.push(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;