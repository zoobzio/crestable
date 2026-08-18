// Typecheck-only stub for the Nuxt `#imports` virtual module.
import type { ComputedRef } from "vue";

interface StateRef<T> {
  value: T;
}

export declare function useState<T>(key: string, init: () => T): StateRef<T>;

export declare function computed<T>(getter: () => T): ComputedRef<T>;

export declare function useRequestFetch(): (
  url: string,
  options?: { method: "POST"; body?: unknown },
) => Promise<unknown>;
