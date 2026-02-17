import { describe, it, expect } from "vitest";
import { z } from "zod";
import { formatZodErrors, validateForm, getFirstErrors } from "../validation-utils";

describe("formatZodErrors", () => {
  it("should extract field errors from ZodError", () => {
    const schema = z.object({
      title: z.string().min(1, "タイトルは必須です"),
      priority: z.enum(["low", "medium", "high"], {
        message: "無効な優先度です",
      }),
    });

    const result = schema.safeParse({ title: "", priority: "invalid" });
    if (result.success) throw new Error("Expected validation to fail");

    const errors = formatZodErrors(result.error);
    expect(errors.title).toContain("タイトルは必須です");
    expect(errors.priority).toBeDefined();
  });

  it("should handle nested paths", () => {
    const schema = z.object({
      user: z.object({
        email: z.string().email("無効なメールアドレス"),
      }),
    });

    const result = schema.safeParse({ user: { email: "invalid" } });
    if (result.success) throw new Error("Expected validation to fail");

    const errors = formatZodErrors(result.error);
    expect(errors["user.email"]).toBeDefined();
  });
});

describe("validateForm", () => {
  const schema = z.object({
    name: z.string().min(1, "名前は必須です"),
    age: z.number().min(0, "年齢は0以上"),
  });

  it("should return success with valid data", () => {
    const result = validateForm(schema, { name: "太郎", age: 25 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "太郎", age: 25 });
    }
  });

  it("should return errors with invalid data", () => {
    const result = validateForm(schema, { name: "", age: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.age).toBeDefined();
    }
  });
});

describe("getFirstErrors", () => {
  it("should return only the first error per field", () => {
    const errors = {
      title: ["エラー1", "エラー2"],
      body: ["エラーA"],
    };

    const result = getFirstErrors(errors);
    expect(result).toEqual({
      title: "エラー1",
      body: "エラーA",
    });
  });

  it("should skip empty arrays", () => {
    const errors = {
      title: ["エラー1"],
      body: [],
    };

    const result = getFirstErrors(errors);
    expect(result).toEqual({ title: "エラー1" });
  });
});
