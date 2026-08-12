# @crestable/nuxt

Nuxt module for crestable with SSR. It provides a `$crestable` service
resolved on the server and hydrated on the client, the `useCrest()`
composable, and the `defineCrestHandlers` server helper — all typed by
the app's own contract.

## Setup

Declare your contract once and add the module:

```ts
// shared/contract.ts
export const contract = {
  scopes: ["docs:read", "docs:write"],
  roles: ["admin", "editor"],
  meta: { plan: ["free", "pro"] },
} as const;

// nuxt.config.ts
import { contract } from "./shared/contract";

export default defineNuxtConfig({
  modules: ["@crestable/nuxt"],
  crestable: { contract },
});
```

Write your provider (a set of callbacks over crestable's own domain objects
— the h3 event is its own domain, closed over per request), then hand it to
`defineCrestHandlers` in one server route file:

```ts
// server/api/_crestable/[action].ts
import { defineSchema } from "crestable";
import { contract } from "../../../shared/contract";
import { createMyProvider } from "../../providers/auth";

const schema = defineSchema(contract);

export default defineCrestHandlers(schema, (event) =>
  createMyProvider(schema, { event }, (claims) => ({ ... })),
);
```

That's the whole wiring. The browser-side transport that calls these routes
ships with the module.

## Usage

```vue
<script setup lang="ts">
const crestable = useCrest();
</script>

<template>
  <p v-if="crestable.authenticated">Hi, {{ crestable.current?.name }}</p>
  <button v-if="crestable.can('docs:write')">Edit</button>
</template>
```

`can`/`is` carry the contract's vocabulary in their types — an undeclared
scope fails to compile in the app.

## How it works

- At build time the module proves the configured contract, writes it to the
  `#build/crestable.mjs` template, and derives the `AppContract` literal type
  — so both sides of the wire share one vocabulary and the app surface is
  fully typed.
- The runtime plugin derives the schema from the build contract, builds the
  service over a `useState` container and, on the server only, resolves the
  user so state populates before render and serializes to the client — no
  refetch or auth flash on hydration.
- The module's transport is itself a provider whose vendor is the app's own
  crestable routes: every callback dials `/api/_crestable/*`, and each answer
  is proven against the schema before it lands in state.
- The user's provider runs only inside the server handlers, constructed per
  request with the h3 event; the auth host never reaches the browser.
