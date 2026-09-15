import { describe, expect, it, vi } from "vitest";
import type { InkboxRuntime } from "../../src/client.js";
import { registerContactRuleTools } from "../../src/tools/contact-rules.js";

interface RegisteredTool {
  name: string;
  description: string;
  parameters: unknown;
  execute: (id: string, params: any) => Promise<any>;
}

function createApi(): {
  api: any;
  tools: Map<string, RegisteredTool>;
  options: Map<string, any>;
} {
  const tools = new Map<string, RegisteredTool>();
  const options = new Map<string, any>();
  const api = {
    registerTool: (def: RegisteredTool, opts?: any) => {
      tools.set(def.name, def);
      options.set(def.name, opts);
    },
  };
  return { api, tools, options };
}

function createRuntime(params: {
  identity?: any;
  mailContactRules?: Record<string, ReturnType<typeof vi.fn>>;
  phoneContactRules?: Record<string, ReturnType<typeof vi.fn>>;
}): InkboxRuntime {
  return {
    getIdentity: () => Promise.resolve(params.identity ?? {}),
    getClient: () =>
      Promise.resolve({
        mailContactRules: params.mailContactRules ?? {},
        phoneContactRules: params.phoneContactRules ?? {},
      } as any),
  };
}

describe("registerContactRuleTools", () => {
  it("registers only read tools", () => {
    const { api, tools, options } = createApi();
    registerContactRuleTools(api, createRuntime({}));

    expect([...tools.keys()]).toEqual([
      "inkbox_list_mail_contact_rules",
      "inkbox_list_phone_contact_rules",
    ]);
    expect(options.get("inkbox_list_mail_contact_rules")).toEqual({ optional: true });
    expect(options.get("inkbox_list_phone_contact_rules")).toEqual({ optional: true });
  });

  it("lists phone rules for the configured phone number id", async () => {
    const { api, tools } = createApi();
    const list = vi.fn().mockResolvedValue([{ id: "phone-rule-1" }]);
    registerContactRuleTools(
      api,
      createRuntime({
        identity: { phoneNumber: { id: "phone-1" } },
        phoneContactRules: { list },
      }),
    );

    const out = await tools.get("inkbox_list_phone_contact_rules")!.execute("turn-1", {
      action: "allow",
      limit: 10,
    });

    expect(list).toHaveBeenCalledWith("phone-1", {
      action: "allow",
      matchType: undefined,
      limit: 10,
      offset: 0,
    });
    expect(out.content[0].text).toContain("Returned 1 phone rule(s).");
  });

  it("returns a tool error when phone rules are requested without a phone number", async () => {
    const { api, tools } = createApi();
    registerContactRuleTools(api, createRuntime({ identity: {} }));

    const out = await tools.get("inkbox_list_phone_contact_rules")!.execute("turn-1", {});

    expect(out.isError).toBe(true);
    expect(out.content[0].text).toContain("has no phone number");
  });
});
