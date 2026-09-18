import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";

const app = createApp();

describe("Health check", () => {
  it("GET /health returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("Auth validation", () => {
  it("rejects login with an invalid email", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "not-an-email",
      password: "somepassword",
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("rejects login with a missing password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "user@example.com",
    });
    expect(res.status).toBe(422);
  });

  it("rejects refresh with no token", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").send({});
    expect(res.status).toBe(401);
  });

  it("rejects /auth/me without a token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("Study materials route guards", () => {
  it("rejects listing without authentication", async () => {
    const res = await request(app).get("/api/v1/study-materials");
    expect(res.status).toBe(401);
  });

  it("rejects upload without a file field validation error before auth is even checked", async () => {
    // Auth runs first in the middleware chain, so an unauthenticated multipart
    // POST should still fail with 401, not a validation error about the file.
    const res = await request(app).post("/api/v1/study-materials").field("title", "Notes");
    expect(res.status).toBe(401);
  });
});

describe("Permissions route guards", () => {
  it("rejects listing permissions without authentication", async () => {
    const res = await request(app).get("/api/v1/permissions");
    expect(res.status).toBe(401);
  });

  it("rejects creating a permission with an invalid code format", async () => {
    // No auth header, so this should still 401 before reaching validation —
    // confirms auth middleware runs ahead of body validation on this route.
    const res = await request(app).post("/api/v1/permissions").send({ code: "NotDotNotation" });
    expect(res.status).toBe(401);
  });
});
