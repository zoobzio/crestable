# @crucible/core

The service runtime. `defineCrucible` takes a schema (the validation bundle
derived from a contract by [`@crucible/schema`](../schema)) and a provider
(the callbacks from [`@crucible/kit`](../kit)) and returns the service:
current user state behind the schema-guarded proxy, authorization checks
against the contract's vocabulary, and a no-argument lifecycle that invokes
the provider with crucible's own domain objects — the guarded state and the
schema.

Every write to state — a provider assignment, a deep mutation from anywhere
— is proven against the contract before it commits, and every committed
write emits `change`. The checks carry the contract in their types: an
undeclared scope or role fails to compile.

```ts
import { defineSchema } from "@crucible/schema";
import { defineCrucible } from "@crucible/core";

const schema = defineSchema({
  scopes: ["docs:read", "docs:write"],
  roles: ["admin", "editor"],
  meta: { plan: ["free", "pro"] },
});

const crucible = defineCrucible(schema, provider);

await crucible.resolve();      // provider establishes state from ambient context
crucible.current;              // typed by the contract, or null
crucible.can("docs:write");    // scope check (all required); emits "denied"
crucible.is("admin");          // role check (any of); emits "denied"
crucible.stale;                // expires passed? reported, never acted on
crucible.on("change", (u) => { ... });
```
