import { describe, expect, it } from "vitest";
import type { Issue } from "../src/index";
import { SchemaError } from "../src/index";

const issues: Issue[] = [
  { code: "missing", message: "User is missing required member: meta." },
  {
    code: "not_string",
    message: "Scope must be a string.",
    path: ["scopes", 1],
    received: 42,
  },
];

describe("SchemaError", () => {
  it("carries the concrete issues", () => {
    const error = new SchemaError(issues);
    expect(error.issues).toBe(issues);
    expect(error.name).toBe("SchemaError");
    expect(error).toBeInstanceOf(Error);
  });

  it("summarizes issues one per line, prefixed by path", () => {
    const error = new SchemaError(issues);
    expect(error.message).toBe(
      "User is missing required member: meta.\n" +
        "scopes.1: Scope must be a string.",
    );
  });
});
