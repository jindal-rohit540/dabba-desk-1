import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePartnerPayload, PartnerPayloadError } from "@/lib/partner";

const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`./fixtures/partner/${name}.json`, import.meta.url), "utf8"));

describe("parsePartnerPayload: ZipRun v1", () => {
  it("maps an out-for-delivery update", () => {
    const update = parsePartnerPayload(fixture("v1-out-for-delivery"));
    expect(update).toMatchObject({ status: "out_for_delivery", landmark: "Sony World Signal", note: null });
    expect(update.orderId).toMatch(/^DX-\d+$/);
    expect(update.eta).toMatch(/Z$/);
  });

  it("keeps the delay reason as a note", () => {
    const update = parsePartnerPayload(fixture("v1-delayed"));
    expect(update.status).toBe("delayed");
    expect(update.note).toBe("Heavy traffic at Silk Board junction");
  });

  it("maps a delivery with no ETA", () => {
    expect(parsePartnerPayload(fixture("v1-delivered"))).toMatchObject({ status: "delivered", eta: null });
  });
});

describe("parsePartnerPayload: invalid input", () => {
  it.each([
    ["unknown status", fixture("invalid-unknown-status")],
    ["empty object", {}],
    ["not an object", "hello"],
  ])("rejects %s", (_, payload) => {
    expect(() => parsePartnerPayload(payload)).toThrow(PartnerPayloadError);
  });
});

describe("parsePartnerPayload: ZipRun v2 (changed without notice)", () => {
  it("maps in_transit with epoch timestamps", () => {
    const raw = fixture("v2-in-transit");
    const update = parsePartnerPayload(raw);
    expect(update).toMatchObject({
      orderId: raw.data.reference,
      status: "out_for_delivery",
      riderId: raw.data.courier_id,
      landmark: null,
    });
    expect(update.eta).toBe(new Date(raw.data.expected_at * 1000).toISOString());
    expect(update.at).toBe(new Date(raw.data.updated_at * 1000).toISOString());
  });

  it("maps delayed and keeps the reason", () => {
    expect(parsePartnerPayload(fixture("v2-delayed"))).toMatchObject({
      status: "delayed",
      note: "Vehicle puncture near Ecospace",
    });
  });
});
