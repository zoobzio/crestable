# @crucible/nuxt

Nuxt module for crucible with SSR. It provides a `$users` service resolved on
the server and hydrated on the client, the `useUsers()` composable, and the
`defineCrucibleHandlers` server helper.

## Setup

Add the module:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@crucible/nuxt"],
});
```

Write your provider (it wraps your auth API; its context is the h3 event, so
it owns cookie/session reading), then hand it to `defineCrucibleHandlers` in
one server route file:

```ts
// server/api/_crucible/[action].ts
import { myProvider } from "../../providers/auth";

export default defineCrucibleHandlers(myProvider);
```

That's the whole wiring. The browser-side transport that calls these routes
ships with the module.

## Usage

```vue
<script setup lang="ts">
const users = useUsers();
</script>

<template>
  <p v-if="users.authenticated">Hi, {{ users.current?.displayName }}</p>
  <button v-if="users.can('docs:write')">Edit</button>
</template>
```

## How it works

- The runtime plugin builds the core service over a `useState` object and, on
  the server only, resolves the user so state populates before render and
  serializes to the client — no refetch or auth flash on hydration.
- The user's provider runs only inside the server routes; the auth host never
  reaches the browser, which only ever sees `/api/_crucible/*`.
