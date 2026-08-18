# crestable

The umbrella package — the only thing consumers and integrations install.

- **Root** (`crestable`): the consumer surface — `defineSchema`,
  `defineCrest`, the `Contract`/`User` types, and runtime validation,
  re-exported from [`@crestable/schema`](../schema) and
  [`@crestable/core`](../core).
- **`crestable/kit`**: the provider surface — `defineProvider`,
  `defineState`, and the `Provider`/`State`/`Bridge` contracts, re-exported
  from [`@crestable/kit`](../kit).
- **`crestable/config`**: the declaration surface — `defineCrestableConfig`,
  an identity helper that pins a contract's literals without `as const`, for
  the one shared file the contract is declared in.

```ts
import { defineCrest, defineSchema } from "crestable";
import { createAuth0Provider } from "@crestable/auth0";

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

const crestable = defineCrest(schema, provider);

await crestable.resolve();
crestable.can("docs:write");
```
