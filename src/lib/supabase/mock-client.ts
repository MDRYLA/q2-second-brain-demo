/**
 * Mock Supabase client used when NEXT_PUBLIC_DEMO_MODE=true.
 *
 * Goal: let the UI render and exercise navigation without a live backend.
 * - `auth.getUser()` returns the synthetic DEMO_USER (so middleware lets requests through)
 * - `auth.signInWithOtp()` is a no-op success
 * - `from(table)` returns a chainable query builder; reads return empty arrays / null,
 *   writes return success without persisting (state lives in React component memory only)
 *
 * Real persistence is intentionally skipped in this demo build — see CUSTOMIZATION.md
 * for instructions on wiring a real Supabase project.
 */

import { DEMO_USER } from "../env";

type SupabaseResult<T> = { data: T; error: null };

class MockQueryBuilder {
  // Chained query methods — all return `this` so the builder can be composed.
  select(_columns?: string) { return this; }
  insert(_data: unknown) { return this; }
  update(_data: unknown) { return this; }
  upsert(_data: unknown, _options?: unknown) { return this; }
  delete() { return this; }
  eq(_column: string, _value: unknown) { return this; }
  neq(_column: string, _value: unknown) { return this; }
  gt(_column: string, _value: unknown) { return this; }
  gte(_column: string, _value: unknown) { return this; }
  lt(_column: string, _value: unknown) { return this; }
  lte(_column: string, _value: unknown) { return this; }
  in(_column: string, _values: unknown[]) { return this; }
  match(_query: Record<string, unknown>) { return this; }
  or(_filter: string) { return this; }
  order(_column: string, _options?: unknown) { return this; }
  limit(_count: number) { return this; }
  range(_from: number, _to: number) { return this; }

  // Terminal methods — return SupabaseResult shape.
  async single<T = null>(): Promise<SupabaseResult<T | null>> {
    return { data: null, error: null };
  }
  async maybeSingle<T = null>(): Promise<SupabaseResult<T | null>> {
    return { data: null, error: null };
  }

  // Implicit await on the builder itself returns an empty list result
  // (matches supabase-js pattern: `const { data } = await supabase.from(...).select(...)`).
  then<TResult1 = SupabaseResult<unknown[]>, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResult<unknown[]>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: [], error: null }).then(onfulfilled, onrejected);
  }
}

class MockAuth {
  async getUser(): Promise<{ data: { user: typeof DEMO_USER }; error: null }> {
    return { data: { user: DEMO_USER }, error: null };
  }
  async signInWithOtp(_credentials: unknown): Promise<{ data: object; error: null }> {
    return { data: {}, error: null };
  }
  async exchangeCodeForSession(_code: string): Promise<{ data: object; error: null }> {
    return { data: {}, error: null };
  }
  async signOut(): Promise<{ error: null }> {
    return { error: null };
  }
}

export class MockSupabaseClient {
  auth = new MockAuth();
  from(_table: string): MockQueryBuilder {
    return new MockQueryBuilder();
  }
  rpc(_name: string, _params?: unknown): MockQueryBuilder {
    return new MockQueryBuilder();
  }
}

/**
 * Factory used by both the browser and server-side wrappers.
 * Caller decides when to call this based on the DEMO_MODE flag from `lib/env`.
 */
export function createMockClient(): MockSupabaseClient {
  return new MockSupabaseClient();
}
