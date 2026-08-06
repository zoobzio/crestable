# Packages

| Package                        | Directory           | Description                                            |
| ------------------------------ | ------------------- | ------------------------------------------------------ |
| [`crucible`](./crucible)       | `packages/crucible` | Umbrella package — core API at the root, `kit` subpath |
| [`@crucible/core`](./core)     | `packages/core`     | The user service runtime (`defineUsers`)               |
| [`@crucible/kit`](./kit)       | `packages/kit`      | Provider-authoring toolkit (`defineProvider`)          |
| [`@crucible/schema`](./schema) | `packages/schema`   | The `User`/`Provider` contracts and runtime validation |

Auth-provider and framework integrations live in
[`../integrations`](../integrations).
