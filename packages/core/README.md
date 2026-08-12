# @warded/core

The service runtime. `defineWard` takes a schema (the validation bundle
derived from a contract by [`@warded/schema`](../schema)) and a provider
(the callbacks from [`@warded/kit`](../kit)) and returns the service:
current user state behind the schema-guarded proxy, authorization checks
against the contract's vocabulary, and a no-argument lifecycle that invokes
the provider with warded's own domain objects — the guarded state and the
schema.

Every write to state — a provider assignment, a deep mutation from anywhere
— is proven against the contract before it commits, and every committed
write emits `change`. The checks carry the contract in their types: an
undeclared scope or role fails to compile.

```ts
import { defineSchema } from "@warded/schema";
import { defineWard } from "@warded/core";

const schema = defineSchema({
  scopes: ["docs:read", "docs:write"],
  roles: ["admin", "editor"],
  meta: { plan: ["free", "pro"] },
});

const warded = defineWard(schema, provider);

await warded.resolve();      // provider establishes state from ambient context
warded.current;              // typed by the contract, or null
warded.can("docs:write");    // scope check (all required); emits "denied"
warded.is("admin");          // role check (any of); emits "denied"
warded.stale;                // expires passed? reported, never acted on
warded.on("change", (u) => { ... });
```
