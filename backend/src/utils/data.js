const path = require("path");
const { watch, readFile, writeFile } = require("fs/promises");

const DATA_PATH = path.join(__dirname, "../../../data/items.json");

async function getDataStats() {
	const raw = await readFile(DATA_PATH);
	const items = JSON.parse(raw);
	return {
		data: items,
		stats: {
			total: items.length,
			averagePrice:
				items.reduce((acc, cur) => acc + cur.price, 0) / items.length,
		},
	};
}

const ac = new AbortController();
const watcher = watch(DATA_PATH, { signal: ac.signal });

var data = undefined;
var stats = undefined;

async function run() {
	console.log(`watching "${DATA_PATH}"`);
	const init = await getDataStats();
	data = init.data;
	stats = init.stats;
	try {
		for await (const event of watcher) {
			if (event.eventType === "change") {
				const changed = await getDataStats();
				data = changed.data;
				stats = changed.stats;
				console.log(`File "${DATA_PATH}" updated..`);
			}
		}
	} catch (err) {
		if (err.name === "AbortError") return;
		throw err;
	}
}

async function abort() {
	ac.abort();
}

function getData() {
	return data;
}

function setData(newData) {
	return writeFile(DATA_PATH, JSON.stringify(newData, null, 2));
}

function getStats() {
	return stats;
}

module.exports = { run, abort, getData, setData, getStats };
