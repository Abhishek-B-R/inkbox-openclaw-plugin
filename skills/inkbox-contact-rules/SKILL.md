---
name: inkbox-contact-rules
description: Use when the user wants to inspect Inkbox contact-rule filters for the agent's mailbox or phone number, including email allow/block rules, SMS/call allow/block rules, allowlists, blocklists, spam blocking, or "only accept from" requests.
user-invocable: false
---

# Inkbox contact rules

Use this skill when managing who can reach the agent's Inkbox mailbox or phone number.

## Optional tools

- `inkbox_list_mail_contact_rules`
- `inkbox_list_phone_contact_rules`

## Workflow

1. List existing rules for the relevant channel.
2. For mailbox rules:
   - `matchType: "exact_email"` for one sender address.
   - `matchType: "domain"` for a whole sender domain.
   - `action: "block"` to reject matching mail.
   - `action: "allow"` to permit matching mail when whitelist mode is active.
3. For phone rules:
   - `matchType: "exact_number"` for E.164 numbers.
   - Rules apply to SMS and voice calls for that phone number.
4. Direct rule changes to the Inkbox Console; agent-scoped credentials cannot modify rules.
5. Explain that blocked inbound messages/calls may be rejected before the agent sees an event.

## Safety

Do not switch a channel into whitelist-only behavior unless a tool explicitly supports filter-mode changes and the user clearly requests that behavior. Whitelist mode blocks everyone who is not explicitly allowed.
