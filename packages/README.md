# Packages

| Package                         | Directory            | Description                                            |
| ------------------------------- | -------------------- | ------------------------------------------------------ |
| [`crestable`](./crestable)      | `packages/crestable` | Umbrella package — core API at the root, `kit` subpath |
| [`@crestable/core`](./core)     | `packages/core`      | The service runtime (`defineCrest`)                    |
| [`@crestable/kit`](./kit)       | `packages/kit`       | Provider toolkit (`defineProvider`, `defineState`)     |
| [`@crestable/schema`](./schema) | `packages/schema`    | The `User`/`Provider` contracts and runtime validation |

Auth-provider and framework integrations live in
[`../integrations`](../integrations).
