# @crucible/core

The user service runtime. `defineUsers` takes a provider (the interaction
contract from [`@crucible/schema`](../schema)) and returns a service that
holds current user state, answers scope checks, and delegates every
authentication touchpoint — login, logout, resolve, refresh — to the
provider.

```ts
import { defineUsers } from "@crucible/core";

const users = defineUsers({ provider });

await users.resolve();     // establish the user from ambient context
users.current;             // User<Meta> | null
users.can("docs:write");   // scope check (all required); emits "denied"
users.is("admin");         // role check (any of); emits "denied"
users.stale;               // expiresAt passed? reported, never acted on
users.on("change", (u) => { ... });
```
