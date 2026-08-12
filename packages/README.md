# Packages

| Package                      | Directory         | Description                                            |
| ---------------------------- | ----------------- | ------------------------------------------------------ |
| [`warded`](./warded)         | `packages/warded` | Umbrella package — core API at the root, `kit` subpath |
| [`@warded/core`](./core)     | `packages/core`   | The service runtime (`defineWard`)                     |
| [`@warded/kit`](./kit)       | `packages/kit`    | Provider toolkit (`defineProvider`, `defineState`)     |
| [`@warded/schema`](./schema) | `packages/schema` | The `User`/`Provider` contracts and runtime validation |

Auth-provider and framework integrations live in
[`../integrations`](../integrations).
