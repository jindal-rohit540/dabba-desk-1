import { describe, expect, it, vi } from "vitest";
import { FALLBACK_REPLY, handleCustomerMessage, NOT_VERIFIED_REPLY, type Deps } from "@/lib/handle-message";
import type { Triage } from "@/lib/triage";
import { verifiedCustomer } from "./fixtures/customer";

const triage = (over: Partial<Triage> = {}): Triage => ({
  category: "order_status",
  needs_human: false,
  refund_reason: null,
  wants_skip_tomorrow: false,
  reply: "Your dabba is near Sony World Signal.",
  ...over,
});

function fakeDeps(over: Partial<Deps> = {}): Deps {
  return {
    findVerifiedCustomer: vi.fn().mockResolvedValue(verifiedCustomer()),
    triageMessage: vi.fn().mockResolvedValue(triage()),
    markOrderSkipped: vi.fn().mockResolvedValue(true),
    insertRefundRequest: vi.fn().mockResolvedValue(true),
    insertMessage: vi.fn().mockResolvedValue(undefined),
    now: () => new Date("2026-10-21T13:10:00+05:30"),
    ...over,
  };
}

const input = { channel: "web" as const, phone: "+916838637940", orderId: "DX-10541", body: "where is my dabba" };

describe("handleCustomerMessage", () => {
  it("does not call Claude or reveal anything when phone and order don't match", async () => {
    const deps = fakeDeps({ findVerifiedCustomer: vi.fn().mockResolvedValue(null) });
    const result = await handleCustomerMessage(input, deps);
    expect(result.reply).toBe(NOT_VERIFIED_REPLY);
    expect(deps.triageMessage).not.toHaveBeenCalled();
    expect(deps.insertMessage).toHaveBeenCalledOnce();
  });

  it("answers order-status questions without a human", async () => {
    const deps = fakeDeps();
    const result = await handleCustomerMessage(input, deps);
    expect(result).toMatchObject({ verified: true, category: "order_status", needsHuman: false });
    expect(deps.insertMessage).toHaveBeenCalledWith(
      expect.objectContaining({ status: "auto_resolved", handled_by: "ai" }),
    );
  });

  it("skips tomorrow when asked before the cut-off", async () => {
    const deps = fakeDeps({
      triageMessage: vi.fn().mockResolvedValue(triage({ category: "skip_day", wants_skip_tomorrow: true })),
    });
    const result = await handleCustomerMessage(input, deps);
    expect(deps.markOrderSkipped).toHaveBeenCalledWith("DX-10601");
    expect(result.actions).toContain("Skipped DX-10601");
  });

  it("does not skip after the 9 pm cut-off, even if the model asks to", async () => {
    const deps = fakeDeps({
      now: () => new Date("2026-10-21T21:30:00+05:30"),
      triageMessage: vi.fn().mockResolvedValue(triage({ category: "skip_day", wants_skip_tomorrow: true })),
    });
    await handleCustomerMessage(input, deps);
    expect(deps.markOrderSkipped).not.toHaveBeenCalled();
  });

  it("logs refunds as requests for a human, never approves them", async () => {
    const deps = fakeDeps({
      triageMessage: vi
        .fn()
        .mockResolvedValue(triage({ category: "refund", refund_reason: "wrong_order", needs_human: false })),
    });
    const result = await handleCustomerMessage(input, deps);
    expect(result.needsHuman).toBe(true);
    expect(deps.insertRefundRequest).toHaveBeenCalledWith(
      expect.objectContaining({ order_id: "DX-10541", amount_paise: 11000, reason: "wrong_order" }),
    );
  });

  it("falls back to a human when the OpenAI API fails", async () => {
    const deps = fakeDeps({ triageMessage: vi.fn().mockRejectedValue(new Error("529 overloaded")) });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await handleCustomerMessage(input, deps);
    expect(result).toMatchObject({ reply: FALLBACK_REPLY, needsHuman: true });
  });
});
