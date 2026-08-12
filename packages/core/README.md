# @crestable/core

The service runtime. `defineCrest` takes a schema (the validation bundle
derived from a contract by [`@crestable/schema`](../schema)) and a provider
(the callbacks from [`@crestable/kit`](../kit)) and returns the service:
current user state behind the schema-guarded proxy, authorization checks
against the contract's vocabulary, and a no-argument lifecycle that invokes
the provider with crestable's own domain objects — the guarded state and the
schema.

Every write to state — a provider assignment, a deep mutation from anywhere
— is proven against the contract before it commits, and every committed
write emits `change`. The checks carry the contract in their types: an
undeclared scope or role fails to compile.

```ts
import { defineSchema } from "@crestable/schema";
import { defineCrest } from "@crestable/core";

const schema = defineSchema({
  scopes: ["docs:read", "docs:write"],
  roles: ["admin", "editor"],
  meta: { plan: ["free", "pro"] },
});

const crestable = defineCrest(schema, provider);

await crestable.resolve();      // provider establishes state from ambient context
crestable.current;              // typed by the contract, or null
crestable.can("docs:write");    // scope check (all required); emits "denied"
crestable.is("admin");          // role check (any of); emits "denied"
crestable.stale;                // expires passed? reported, never acted on
crestable.on("change", (u) => { ... });
```
