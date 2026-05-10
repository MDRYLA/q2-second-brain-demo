import { describe, it, expect } from "vitest";
import { createMockClient, MockSupabaseClient } from "../mock-client";
import { DEMO_USER } from "../../env";

describe("MockSupabaseClient", () => {
  describe("factory", () => {
    it("createMockClient() returns a MockSupabaseClient instance", () => {
      const client = createMockClient();
      expect(client).toBeInstanceOf(MockSupabaseClient);
    });

    it("two factory calls produce independent instances", () => {
      const a = createMockClient();
      const b = createMockClient();
      expect(a).not.toBe(b);
    });
  });

  describe("auth", () => {
    it("getUser() resolves with the synthetic DEMO_USER", async () => {
      const client = createMockClient();
      const { data, error } = await client.auth.getUser();
      expect(error).toBeNull();
      expect(data.user).toEqual(DEMO_USER);
    });

    it("signInWithOtp() is a no-op success", async () => {
      const client = createMockClient();
      const { data, error } = await client.auth.signInWithOtp({
        email: "user@example.com",
      });
      expect(error).toBeNull();
      expect(data).toEqual({});
    });

    it("exchangeCodeForSession() is a no-op success", async () => {
      const client = createMockClient();
      const { data, error } = await client.auth.exchangeCodeForSession("any-code");
      expect(error).toBeNull();
      expect(data).toEqual({});
    });

    it("signOut() resolves with no error", async () => {
      const client = createMockClient();
      const { error } = await client.auth.signOut();
      expect(error).toBeNull();
    });
  });

  describe("from() query builder", () => {
    it("from(table) returns a chainable builder", () => {
      const client = createMockClient();
      const builder = client.from("entries");
      // Each chained method returns the builder itself
      expect(builder.select("id, content")).toBe(builder);
      expect(builder.eq("user_id", "x")).toBe(builder);
      expect(builder.order("created_at", { ascending: false })).toBe(builder);
      expect(builder.limit(10)).toBe(builder);
    });

    it("single() resolves with { data: null, error: null }", async () => {
      const client = createMockClient();
      const result = await client.from("users").select("*").eq("id", "demo").single();
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it("maybeSingle() resolves with { data: null, error: null }", async () => {
      const client = createMockClient();
      const result = await client.from("users").select("*").maybeSingle();
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it("await on builder returns empty array result (supabase-js shape)", async () => {
      const client = createMockClient();
      const { data, error } = await client.from("entries").select("*").order("date");
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("insert / update / upsert / delete are chainable and resolve to empty array", async () => {
      const client = createMockClient();
      // Each verb returns the builder, so further `eq` filters are still legal.
      const upsertResult = await client
        .from("plans")
        .upsert({ id: "p1", title: "x" }, { onConflict: "id" });
      expect(upsertResult.data).toEqual([]);
      expect(upsertResult.error).toBeNull();

      const deleteResult = await client.from("plans").delete().eq("id", "p1");
      expect(deleteResult.data).toEqual([]);
      expect(deleteResult.error).toBeNull();
    });
  });

  describe("rpc()", () => {
    it("rpc(name) returns a chainable builder", async () => {
      const client = createMockClient();
      const result = await client.rpc("some_function", { arg: 1 });
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });
});
