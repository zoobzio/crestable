# crucible

The umbrella package — the only thing consumers and integrations install.

- **Root** (`crucible`): the consumer surface — `defineSchema`,
  `defineCrucible`, the `Contract`/`User` types, and runtime validation,
  re-exported from [`@crucible/schema`](../schema) and
  [`@crucible/core`](../core).
- **`crucible/kit`**: the provider surface — `defineProvider`,
  `defineState`, and the `Provider`/`State`/`Bridge` contracts, re-exported
  from [`@crucible/kit`](../kit).

```ts
import { defineCrucible, defineSchema } from "crucible";
import { createAuth0Provider } from "@crucible/auth0";

const schema = defineSchema({
  scopes: ["docs:read", "docs:write"],
  roles: ["admin", "editor"],
  meta: { plan: ["free", "pro"] },
});

const provider = createAuth0Provider(schema, { domain, clientId }, (session) => ({
  id: session.sub,
  scopes: session.permissions,
  roles: session.groups,
  meta: { plan: session.app_metadata.plan },
}));

const crucible = defineCrucible(schema, provider);

await crucible.resolve();
crucible.can("docs:write");
```
