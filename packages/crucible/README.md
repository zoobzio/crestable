# crucible

The umbrella package — the only thing consumers and integrations install.

- **Root** (`crucible`): the consumer surface — `defineUsers`, the `User` and
  `Provider` types, and runtime validation, re-exported from
  [`@crucible/core`](../core).
- **`crucible/kit`**: the provider-author surface — `defineProvider`,
  re-exported from [`@crucible/kit`](../kit).

```ts
import { defineUsers } from "crucible";
import { defineProvider } from "crucible/kit";

const provider = defineProvider({ login, logout, resolve });
const users = defineUsers({ provider });

await users.resolve();
users.can("docs:write");
```
