import type { Inkbox, WebhookSubscription } from "@inkbox/sdk";
import { reconcileIdentitySubscription } from "../identity-subscription.js";
import type { PluginLogger } from "../client.js";

// Full event sets the plugin subscribes to. We subscribe broadly and
// filter in dispatch — receive events are load-bearing, the rest are
// telemetry that downstream features may opt into.
export const MAIL_EVENT_TYPES: readonly string[] = [
  "message.received",
  "message.sent",
  "message.forwarded",
  "message.delivered",
  "message.bounced",
  "message.failed",
];

export const TEXT_EVENT_TYPES: readonly string[] = [
  "text.received",
  "text.sent",
  "text.delivered",
  "text.delivery_failed",
  "text.delivery_unconfirmed",
];

// iMessage: inbound plus the outbound delivery lifecycle — same split as
// text. Tapback reactions (`imessage.reaction_received`) are subscribed and
// dispatched as a turn carrying the reaction + a response policy: the agent
// decides whether to reply or return NO_REPLY (a "?" tapback usually
// warrants a reply, a "love" usually does not).
export const IMESSAGE_EVENT_TYPES: readonly string[] = [
  "imessage.received",
  "imessage.sent",
  "imessage.delivered",
  "imessage.delivery_failed",
  "imessage.reaction_received",
];
export const A2A_EVENT_TYPES: readonly string[] = [
  "a2a.task.created",
  "a2a.task.message",
  "a2a.task.canceled",
  "a2a.sent_task.updated",
];
export const CALL_EVENT_TYPES: readonly string[] = ["call.ended"];

export const IDENTITY_EVENT_TYPES = [
  ...MAIL_EVENT_TYPES, ...TEXT_EVENT_TYPES, ...IMESSAGE_EVENT_TYPES,
  ...CALL_EVENT_TYPES, ...A2A_EVENT_TYPES,
];

export interface DesiredSubscriptionSet {
  agentIdentityId: string;
  url: string;
  eventTypes: readonly string[];
}

export async function reconcileWebhookSubscription(
  inkbox: Inkbox,
  desired: DesiredSubscriptionSet,
  logger?: PluginLogger,
): Promise<WebhookSubscription> {
  const result = await reconcileIdentitySubscription(inkbox, desired.agentIdentityId, desired.url, desired.eventTypes);
  if (result.signingKey) {
    logger?.warn?.("A webhook signing key was created. Save it before restarting the gateway.");
  }
  return result.subscription;
}
