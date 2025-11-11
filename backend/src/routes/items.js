const express = require("express");
const router = express.Router();
const dataUtils = require("../utils/data");

const PAGE_SIZE = 5;

// GET /api/items
router.get("/", (req, res, next) => {
	try {
		const data = dataUtils.getData();
		const { pg = "1", q } = req.query;
		let results = data;

		if (q) {
			// Simple substring search (sub‑optimal)
			results = results.filter((item) =>
				item.name.toLowerCase().includes(q.toLowerCase()),
			);
		}

		const total = results.length;

		if (pg) {
			const page = parseInt(pg);
			const start = (page - 1) * PAGE_SIZE;
			results = results.slice(start, start + PAGE_SIZE);
		}

		res.json({ items: results, total });
	} catch (err) {
		next(err);
	}
});

// GET /api/items/:id
router.get("/:id", (req, res, next) => {
	try {
		const data = dataUtils.getData();
		const item = data.find((i) => i.id === parseInt(req.params.id));
		if (!item) {
			const err = new Error("Item not found");
			err.status = 404;
			throw err;
		}
		res.json(item);
	} catch (err) {
		next(err);
	}
});

// POST /api/items
router.post("/", async (req, res, next) => {
	try {
		// TODO: Validate payload (intentional omission)
		const item = req.body;

		if (
			!(
				typeof item.name === "string" &&
				typeof item.category === "string" &&
				typeof item.price === "number"
			)
		) {
			const err = new Error("Invalid request body");
			err.status = 400;
			throw err;
		}

		const data = dataUtils.getData();
		item.id = Date.now();
		data.push(item);
		await dataUtils.setData(data);
		res.status(201).json(item);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
