const path = require('path');
const { watch } = require("fs/promises")

const DATA_PATH = path.join(__dirname, '../../../data/items.json');

async function readData() {
  const raw = await fs.readFile(DATA_PATH);
  return JSON.parse(raw);
}

const ac = new AbortController()
const watcher = watch(DATA_PATH, {signal: ac.signal});
var data = undefined;
var stats = undefined;

async function run() {
    console.log(`watching "${DATA_PATH}"`)
    try {
        for await (const event of watcher) {
            if(event.eventType === "change") {
                const items = await readData();
                data = items;
                stats = {
                    total: items.length,
                    averagePrice: items.reduce((acc, cur) => acc + cur.price, 0) / items.length
                };
            }
        }
    } catch (err) {
        if (err.name === 'AbortError')
        return;
        throw err;
    }
}

async function abort() {
    ac.abort();
}

module.exports = {run, abort, data, stats}