const express = require("express");
const router = express.Router();
const dataUtils = require("../utils/data");

// GET /api/stats
router.get("/", (req, res, next) => {
	const stats = dataUtils.getStats();
	res.json(stats);
});

module.exports = router;
