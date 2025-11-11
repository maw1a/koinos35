const request = require("supertest");

// Mock the data utils before importing the app so the routes pick up the mocked module.
jest.mock("../../src/utils/data", () => ({
  run: jest.fn(),
  abort: jest.fn(),
  getData: jest.fn(),
  setData: jest.fn(),
  getStats: jest.fn(),
}));

const dataUtils = require("../../src/utils/data");
const app = require("../../src/index");

describe("Items routes", () => {
  let mockData;

  beforeEach(() => {
    // Seed data roughly matching the real dataset so we test pagination, searching, etc.
    mockData = [
      { id: 1, name: "Laptop Pro", category: "Electronics", price: 2499 },
      { id: 2, name: "Noise Cancelling Headphones", category: "Electronics", price: 399 },
      { id: 3, name: "Ultra‑Wide Monitor", category: "Electronics", price: 999 },
      { id: 4, name: "Ergonomic Chair", category: "Furniture", price: 799 },
      { id: 5, name: "Standing Desk", category: "Furniture", price: 1199 },
      { id: 6, name: "Standing Desk", category: "Furniture", price: 1199 },
      { id: 7, name: "Standing Desk", category: "Furniture", price: 1199 },
      { id: 8, name: "Standing Desk", category: "Furniture", price: 1199 },
    ];

    // Implement mocked functions to operate on the in-memory mockData
    dataUtils.getData.mockImplementation(() => mockData.slice());
    dataUtils.setData.mockImplementation(async (newData) => {
      // Simulate writing by replacing in-memory data copy
      mockData = Array.isArray(newData) ? newData.slice() : mockData;
      return Promise.resolve();
    });
    dataUtils.getStats.mockImplementation(() => {
      const total = mockData.length;
      const averagePrice =
        total === 0 ? 0 : mockData.reduce((acc, cur) => acc + cur.price, 0) / total;
      return { total, averagePrice };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/items - returns paginated items and total (happy path)", async () => {
    const res = await request(app).get("/api/items");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(Array.isArray(res.body.items)).toBe(true);

    // PAGE_SIZE in router is 5, so we expect 5 items on the first page
    expect(res.body.items.length).toBe(5);
    expect(res.body.total).toBe(mockData.length);

    // Ensure returned items are the first ones from mockData
    expect(res.body.items[0].id).toBe(mockData[0].id);
    expect(res.body.items[4].id).toBe(mockData[4].id);
  });

  test("GET /api/items with pg=2 - returns second page", async () => {
    const res = await request(app).get("/api/items").query({ pg: "2" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    // Remaining items after first 5 are 3
    expect(res.body.items.length).toBe(3);
    expect(res.body.total).toBe(mockData.length);

    // Should start from the 6th item in mockData (index 5)
    expect(res.body.items[0].id).toBe(mockData[5].id);
  });

  test("GET /api/items?q=desk - filters results (case-insensitive substring)", async () => {
    const res = await request(app).get("/api/items").query({ q: "desk" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");

    // All Standing Desk items should be returned (there are 4)
    // Note: pagination still applies but 4 < PAGE_SIZE, so we should get all 4.
    expect(res.body.items.length).toBe(4);
    for (const item of res.body.items) {
      expect(item.name.toLowerCase()).toContain("desk");
    }
    expect(res.body.total).toBe(4);
  });

  test("GET /api/items/:id - returns item when found", async () => {
    const target = mockData[2]; // id = 3
    const res = await request(app).get(`/api/items/${target.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(target);
  });

  test("GET /api/items/:id - returns 404 when item not found", async () => {
    const res = await request(app).get("/api/items/999999");
    expect(res.status).toBe(404);
  });

  test("POST /api/items - creates item with valid payload (happy path)", async () => {
    const payload = { name: "New Gadget", category: "Gadgets", price: 42 };
    const beforeTotal = mockData.length;

    const res = await request(app).post("/api/items").send(payload);
    expect(res.status).toBe(201);

    // Response should include the payload fields plus an id
    expect(res.body).toMatchObject(payload);
    expect(typeof res.body.id).toBe("number");

    // setData should have been called to persist the new dataset
    expect(dataUtils.setData).toHaveBeenCalledTimes(1);
    const calledWith = dataUtils.setData.mock.calls[0][0];
    expect(Array.isArray(calledWith)).toBe(true);
    expect(calledWith.length).toBe(beforeTotal + 1);

    // Ensure the new item exists in the persisted array
    expect(calledWith).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: payload.name, category: payload.category, price: payload.price })])
    );
  });

  test("POST /api/items - returns 400 for invalid payload (error case)", async () => {
    // Missing required fields / wrong types
    const badPayloads = [
      {}, // empty
      { name: "Only Name" }, // missing category & price
      { name: "Bad Price", category: "X", price: "not-a-number" }, // price wrong type
      { name: 123, category: "X", price: 10 }, // name wrong type
    ];

    for (const payload of badPayloads) {
      const res = await request(app).post("/api/items").send(payload);
      expect(res.status).toBe(400);
    }
  });
});
