import { Type } from "typebox";
import type { InkboxRuntime } from "../client.js";
import { runTool, toolError, toolText, type ToolTextResult } from "../errors.js";
import { formatWithHeader } from "../format.js";

const mailRuleActionSchema = Type.Union([Type.Literal("allow"), Type.Literal("block")]);
const mailRuleMatchTypeSchema = Type.Union([
  Type.Literal("exact_email"),
  Type.Literal("domain"),
]);
const phoneRuleActionSchema = Type.Union([Type.Literal("allow"), Type.Literal("block")]);
const phoneRuleMatchTypeSchema = Type.Literal("exact_number");

type MailboxRef = { ok: true; emailAddress: string } | { ok: false; result: ToolTextResult };
type PhoneRef = { ok: true; phoneNumberId: string } | { ok: false; result: ToolTextResult };

async function requireMailbox(runtime: InkboxRuntime): Promise<MailboxRef> {
  const identity = await runtime.getIdentity();
  if (!identity.mailbox?.emailAddress) {
    return {
      ok: false,
      result: toolError("This Inkbox identity has no mailbox, so mail contact rules are unavailable."),
    };
  }
  return { ok: true, emailAddress: identity.mailbox.emailAddress };
}

async function requirePhoneNumber(runtime: InkboxRuntime): Promise<PhoneRef> {
  const identity = await runtime.getIdentity();
  if (!identity.phoneNumber?.id) {
    return {
      ok: false,
      result: toolError("This Inkbox identity has no phone number, so phone contact rules are unavailable."),
    };
  }
  return { ok: true, phoneNumberId: identity.phoneNumber.id };
}

export function registerContactRuleTools(api: any, runtime: InkboxRuntime): void {
  api.registerTool(
    {
      name: "inkbox_list_mail_contact_rules",
      description:
        "List allow/block rules for the configured Inkbox identity's mailbox. Use before changing email sender allowlists or blocklists.",
      parameters: Type.Object({
        action: Type.Optional(mailRuleActionSchema),
        matchType: Type.Optional(mailRuleMatchTypeSchema),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 200, default: 50 })),
        offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
      }),
      async execute(_id: string, params: any) {
        return runTool(async () => {
          const mailbox = await requireMailbox(runtime);
          if (!mailbox.ok) return mailbox.result;
          const inkbox = await runtime.getClient();
          const rules = await inkbox.mailContactRules.list(mailbox.emailAddress, {
            action: params.action,
            matchType: params.matchType,
            limit: params.limit ?? 50,
            offset: params.offset ?? 0,
          });
          return toolText(formatWithHeader(`Returned ${rules.length} mail rule(s).`, rules));
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "inkbox_list_phone_contact_rules",
      description:
        "List allow/block rules for the configured Inkbox identity's phone number. Rules affect inbound SMS and calls.",
      parameters: Type.Object({
        action: Type.Optional(phoneRuleActionSchema),
        matchType: Type.Optional(phoneRuleMatchTypeSchema),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 200, default: 50 })),
        offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
      }),
      async execute(_id: string, params: any) {
        return runTool(async () => {
          const phone = await requirePhoneNumber(runtime);
          if (!phone.ok) return phone.result;
          const inkbox = await runtime.getClient();
          const rules = await inkbox.phoneContactRules.list(phone.phoneNumberId, {
            action: params.action,
            matchType: params.matchType,
            limit: params.limit ?? 50,
            offset: params.offset ?? 0,
          });
          return toolText(formatWithHeader(`Returned ${rules.length} phone rule(s).`, rules));
        });
      },
    },
    { optional: true },
  );

}
