/** One rate-limit bucket in public.rate_limits: at most `max` requests per window. */
export interface RateLimit {
  readonly bucket: string
  readonly max: number
  readonly windowSeconds: number
}

/** Caller checks that talk to Supabase; the Deno entries implement them. */
export interface Gate {
  /** Verifies the caller JWT and returns its user id, or null. */
  userFor(token: string): Promise<string | null>
  /** Calls public.is_space_member as the caller, so the same rules as RLS decide. */
  isMember(token: string, spaceId: string): Promise<boolean>
  /** Consumes one request from the caller's bucket; false once the limit is reached. */
  consume(userId: string, limit: RateLimit): Promise<boolean>
}
