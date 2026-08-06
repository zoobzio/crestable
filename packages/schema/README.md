# @crucible/schema

The contracts crucible is built on: the fixed `User<Meta>` shape, the
`Provider<Meta, Credentials, Context>` interaction contract, and runtime
validation of the user shape. Dependency-free — everything else in the
workspace sits on this package.

```ts
import type { Provider, User } from "@crucible/schema";
import { assertUser, isUser } from "@crucible/schema";
```
