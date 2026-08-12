import type { Field, Issue, Rule } from "./types";

import { object, keys, entries } from "objectively";
import { KEYWORDS } from "./constant";

/*
 * Type-agnostic rule builders. Each builder takes a display name plus
 * parameters and returns a {@link Rule}; none of them know anything about
 * the user contract. Predicate atoms each own a single failure code;
 * combinators compose other rules and attach `path` as they descend.
 */

/**
 * Prefixes a nested issue's path with the member it was found under.
 */
export const nest = (key: string | number, issue: Issue): Issue => ({
  ...issue,
  path: [key, ...(issue.path ?? [])],
});

/**
 * The value is a container: an object that is not an array.
 */
export const container =
  (name: string): Rule =>
  (v) => {
    if (!object(v)) {
      return {
        code: "not_object",
        message: `${name} must be an object.`,
        received: v,
      };
    }
  };

/**
 * The value is a string.
 */
export const text =
  (name: string): Rule =>
  (v) => {
    if (typeof v !== "string") {
      return {
        code: "not_string",
        message: `${name} must be a string.`,
        received: v,
      };
    }
  };

/**
 * A string value is not empty once trimmed.
 */
export const filled =
  (name: string): Rule =>
  (v) => {
    if (typeof v === "string" && v.trim() === "") {
      return {
        code: "empty",
        message: `${name} must not be empty.`,
        received: v,
      };
    }
  };

/**
 * The value is a number.
 */
export const numeric =
  (name: string): Rule =>
  (v) => {
    if (typeof v !== "number") {
      return {
        code: "not_number",
        message: `${name} must be a number.`,
        received: v,
      };
    }
  };

/**
 * The value is a boolean.
 */
export const flag =
  (name: string): Rule =>
  (v) => {
    if (typeof v !== "boolean") {
      return {
        code: "not_boolean",
        message: `${name} must be a boolean.`,
        received: v,
      };
    }
  };

/**
 * The value is an array whose every entry satisfies the rules. A nested
 * issue is prefixed with the entry's index.
 */
export const list =
  (name: string, rules: Rule[]): Rule =>
  (v) => {
    if (!Array.isArray(v)) {
      return {
        code: "not_array",
        message: `${name} must be an array.`,
        received: v,
      };
    }
    for (const [index, entry] of v.entries()) {
      for (const rule of rules) {
        const issue = rule(entry);
        if (issue) {
          return nest(index, issue);
        }
      }
    }
  };

/**
 * A string value is a member of a declared set. Non-strings yield no issue —
 * the text rule owns that failure.
 */
export const member =
  (name: string, set: ReadonlySet<string>): Rule =>
  (v) => {
    if (typeof v === "string" && !set.has(v)) {
      return {
        code: "not_member",
        message: `${name} is not declared by the contract.`,
        expected: [...set],
        received: v,
      };
    }
  };

/**
 * An array value carries no duplicate string entries.
 */
export const unique =
  (name: string): Rule =>
  (v) => {
    if (!Array.isArray(v)) {
      return;
    }
    const seen = new Set<string>();
    for (const [index, entry] of v.entries()) {
      if (typeof entry !== "string") {
        continue;
      }
      if (seen.has(entry)) {
        return nest(index, {
          code: "duplicate",
          message: `${name} must not repeat an entry.`,
          received: entry,
        });
      }
      seen.add(entry);
    }
  };

/**
 * A container value carries every required member. Non-containers yield no
 * issue — the container rule owns that failure.
 */
export const superset =
  (name: string, keys: readonly string[]): Rule =>
  (v) => {
    if (!object(v)) {
      return;
    }
    const missing = keys.filter((key) => !(key in v));
    if (missing.length > 0) {
      return {
        code: "missing",
        message: `${name} is missing required member${
          missing.length > 1 ? "s" : ""
        }: ${missing.join(", ")}.`,
        expected: keys,
        received: v,
      };
    }
  };

/**
 * A container value carries no members beyond the declared keys. Non-containers
 * yield no issue — the container rule owns that failure.
 */
export const subset =
  (name: string, declared: ReadonlySet<string>): Rule =>
  (v) => {
    if (!object(v)) {
      return;
    }
    const stray = keys(v).filter((key) => !declared.has(key));
    if (stray.length > 0) {
      return {
        code: "unknown",
        message: `${name} carries unknown member${
          stray.length > 1 ? "s" : ""
        }: ${stray.join(", ")}.`,
        expected: [...declared],
        received: v,
      };
    }
  };

/**
 * Runs rules against every member of a container, nesting an issue under the
 * member's key. Non-containers yield no issue — the container rule owns that
 * failure.
 */
export const each =
  (rules: Rule[]): Rule =>
  (v) => {
    if (!object(v)) {
      return;
    }
    for (const [key, entry] of entries(v)) {
      for (const rule of rules) {
        const issue = rule(entry);
        if (issue) {
          return nest(key, issue);
        }
      }
    }
  };

/**
 * Runs rules against one member of a container. Non-containers and absent
 * members yield no issue — the container and superset rules own those
 * failures — and a nested issue is prefixed with the member's key.
 */
export const at =
  (key: string, rules: Rule[]): Rule =>
  (v) => {
    if (!object(v) || !(key in v)) {
      return;
    }
    for (const rule of rules) {
      const issue = rule(v[key]);
      if (issue) {
        return nest(key, issue);
      }
    }
  };

/**
 * Wraps rules so `undefined` passes: the member may be absent or carry an
 * explicit `undefined`, but once a value is present the rules apply.
 */
export const optional = (rules: Rule[]): Rule[] =>
  rules.map(
    (rule): Rule =>
      (v) =>
        v === undefined ? undefined : rule(v),
  );

/**
 * The value is a well-formed {@link Field} declaration: a scalar keyword or
 * an enum of non-empty string literals.
 */
export const spec =
  (name: string): Rule =>
  (v) => {
    if (typeof v === "string" && KEYWORDS.has(v)) {
      return;
    }
    if (!Array.isArray(v)) {
      return {
        code: "not_field",
        message: `${name} must be a scalar keyword or an enum of literals.`,
        expected: [...KEYWORDS],
        received: v,
      };
    }
    if (v.length === 0) {
      return {
        code: "empty",
        message: `${name} must declare at least one literal.`,
        received: v,
      };
    }
    for (const [index, entry] of v.entries()) {
      const issue =
        text(`${name} literal`)(entry) ?? filled(`${name} literal`)(entry);
      if (issue) {
        return nest(index, issue);
      }
    }
  };

/**
 * The value satisfies a {@link Field} declaration: a scalar of the declared
 * keyword (`undefined` admitted by the `?`-suffixed forms) or a member of
 * the declared enum. Delegates to the scalar and member atoms, so the issue
 * carries their codes.
 */
export const field = (name: string, declared: Field): Rule => {
  if (typeof declared !== "string") {
    const literal = member(name, new Set(declared));
    return (v) => text(name)(v) ?? literal(v);
  }
  const scalar = declared.startsWith("number")
    ? numeric(name)
    : declared.startsWith("boolean")
      ? flag(name)
      : text(name);
  if (!declared.endsWith("?")) {
    return scalar;
  }
  return (v) => (v === undefined ? undefined : scalar(v));
};
