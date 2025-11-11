const express = require("express");
const morgan = require("morgan");
const itemsRouter = require("./routes/items");
const statsRouter = require("./routes/stats");
const cors = require("cors");
const { getCookie, notFound } = require("./middleware/errorHandler");
const dataUtils = require("./utils/data");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:3000" }));
// Basic middleware
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/items", itemsRouter);
app.use("/api/stats", statsRouter);

// Not Found
app.use("*", notFound);

// getCookie();

module.exports = app;

if (require.main === module) {
	const server = app.listen(port, () =>
		console.log("Backend running on http://localhost:" + port),
	);

	let shuttingDown = false;
	function shutdown(reason, code = 0) {
		if (shuttingDown) return;
		shuttingDown = true;
		console.log(`Shutting down watcher (${reason})...`);
		dataUtils.abort();
		// Close the HTTP server first, then exit
		server.close(() => setImmediate(() => process.exit(code)));
	}

	process.on("SIGINT", () => shutdown("SIGINT", 0));
	process.on("SIGTERM", () => shutdown("SIGTERM", 0));
	process.on("uncaughtException", (err) => {
		console.error("Uncaught exception:", err);
		shutdown("uncaughtException", 1);
	});
	process.on("unhandledRejection", (reason) => {
		console.error("Unhandled rejection:", reason);
		shutdown("unhandledRejection", 1);
	});

	dataUtils.run().catch((err) => {
		console.error("Failed to start watcher:", err);
		process.exit(1);
	});
}
