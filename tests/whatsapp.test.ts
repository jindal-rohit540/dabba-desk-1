import { describe, expect, it } from "vitest";
import { extractOrderId, twiml } from "@/lib/whatsapp";

describe("extractOrderId", () => {
  it.each([
    ["dx10541 where is it", "DX-10541"],
    ["Where is DX-10541??", "DX-10541"],
    ["order dx 10541 refund", "DX-10541"],
  ])("finds the order in %j", (text, expected) => {
    expect(extractOrderId(text)).toBe(expected);
  });

  it("returns null when there is no order id", () => {
    expect(extractOrderId("where is my dabba")).toBeNull();
  });
});

describe("twiml", () => {
  it("wraps and XML-escapes the reply", () => {
    expect(twiml("Tom & Jerry <3")).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Tom &amp; Jerry &lt;3</Message></Response>',
    );
  });
});
