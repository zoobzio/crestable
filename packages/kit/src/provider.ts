import type { Provider } from "@crucible/schema";

/**
 * Author a provider — the bridge between crucible and a particular
 * authentication API. An identity helper: it exists so provider
 * implementations get contract checking and `Meta`/`Credentials`/`Context`
 * inference without annotating the whole object.
 *
 * Published integrations (`@crucible/auth0`, …) and homegrown consumers use
 * the same entry point; custom providers are first-class.
 */
export const defineProvider = <Meta, Credentials = void, Context = unknown>(
  provider: Provider<Meta, Credentials, Context>,
): Provider<Meta, Credentials, Context> => {
  return provider;
};
