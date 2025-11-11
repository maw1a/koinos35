const express = require("express");
const router = express.Router();
const dataUtils = require("../utils/data");

// GET /api/items
router.get("/", (req, res, next) => {
	try {
		const data = dataUtils.getData();
		const { limit, q } = req.query;
		let results = data;
		console.log({ data });

		if (q) {
			// Simple substring search (sub‑optimal)
			results = results.filter((item) =>
				item.name.toLowerCase().includes(q.toLowerCase()),
			);
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
