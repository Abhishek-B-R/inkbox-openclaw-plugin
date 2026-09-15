import type { Inkbox } from "@inkbox/sdk";
import { describe, expect, it, vi } from "vitest";
import { IDENTITY_EVENT_TYPES, reconcileWebhookSubscription } from "../../src/inbound/subscriptions.js";

describe("gateway subscription wrapper", () => {
  it("uses one canonical mixed receiver", async () => {
    const create = vi.fn(async (options) => ({ ...options, id: "receiver", signingKey: null }));
    const client = { webhooks: { subscriptions: { list: vi.fn(async () => []), create } } } as unknown as Inkbox;
    const result = await reconcileWebhookSubscription(client, { agentIdentityId: "agent", url: "https://agent.example/webhook", eventTypes: IDENTITY_EVENT_TYPES });
    expect(result.id).toBe("receiver");
    expect(create).toHaveBeenCalledWith({ agentIdentityId: "agent", url: "https://agent.example/webhook", eventTypes: [...IDENTITY_EVENT_TYPES].sort() });
    expect(IDENTITY_EVENT_TYPES).toHaveLength(21);
  });
});
