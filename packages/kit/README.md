# @crucible/kit

The provider-authoring toolkit. `defineProvider` is the entry point for
implementing the [`@crucible/schema`](../schema) provider contract around a
particular authentication API — the same path used by published integrations
and homegrown providers alike.

```ts
import { defineProvider } from "@crucible/kit";

export const provider = defineProvider({
  login: async (credentials: { token: string }) => { ... },
  logout: async (user) => { ... },
  resolve: async (ctx) => { ... },
});
```
