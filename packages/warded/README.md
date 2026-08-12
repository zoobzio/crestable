# warded

The umbrella package — the only thing consumers and integrations install.

- **Root** (`warded`): the consumer surface — `defineSchema`,
  `defineWard`, the `Contract`/`User` types, and runtime validation,
  re-exported from [`@warded/schema`](../schema) and
  [`@warded/core`](../core).
- **`warded/kit`**: the provider surface — `defineProvider`,
  `defineState`, and the `Provider`/`State`/`Bridge` contracts, re-exported
  from [`@warded/kit`](../kit).

```ts
import { defineWard, defineSchema } from "warded";
import { createAuth0Provider } from "@warded/auth0";

const schema = defineSchema({
  scopes: ["docs:read", "docs:write"],
  roles: ["admin", "editor"],
  meta: { plan: ["free", "pro"] },
});

const provider = createAuth0Provider(
  schema,
  { domain, clientId },
  (session) => ({
    id: session.sub,
    scopes: session.permissions,
    roles: session.groups,
    meta: { plan: session.app_metadata.plan },
  }),
);

const warded = defineWard(schema, provider);

await warded.resolve();
warded.can("docs:write");
```
