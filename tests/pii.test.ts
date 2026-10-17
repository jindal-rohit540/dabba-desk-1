import { describe, expect, it } from "vitest";
import { maskAddress, maskPhone, redactPII } from "@/lib/pii";

describe("maskPhone", () => {
  it("keeps only the first two and last three digits", () => {
    expect(maskPhone("+919845012345")).toBe("+91 98•••••345");
  });

  it.each(["", null, "12345"])("hides anything it can't parse (%j)", (input) => {
    expect(maskPhone(input)).toBe("•••");
  });
});

describe("maskAddress", () => {
  it("shows only the first word", () => {
    expect(maskAddress("RMZ Ecospace, Bldg 4")).toBe("RMZ •••");
    expect(maskAddress("Prestige Tech Park, Tower B")).toBe("Prestige •••");
    expect(maskAddress("")).toBe("•••");
  });
});

describe("redactPII", () => {
  it("replaces phone numbers in any common format", () => {
    expect(redactPII("call me on 98450 12345 or +91-9845012345")).toBe("call me on [phone] or [phone]");
    expect(redactPII("my no 09845012345")).toBe("my no [phone]");
  });

  it("leaves order IDs, prices and times alone", () => {
    expect(redactPII("order DX-10541 is late, paid ₹220 at 1:15")).toBe(
      "order DX-10541 is late, paid ₹220 at 1:15",
    );
  });
});
