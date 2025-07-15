/// <reference types="vitest" />

import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/collect/route";
import { NextRequest } from "next/server";

function buildRequest(json: Record<string, unknown>) {
  const req = new Request("http://localhost/api/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });
  return new NextRequest(req);
}

describe("/api/collect validation", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await POST(buildRequest({}));
    expect(res.status).toBe(400);
  });

  it("rejects tips above the max limit", async () => {
    const res = await POST(
      buildRequest({
        spendPermission: {},
        signature: "0x",
        amount: "101",
        decimals: 6,
        spaceId: "space1",
        fromId: 1,
        toId: 2,
      }),
    );
    expect(res.status).toBe(400);
  });
});
