/**
 * Praxis AI - Enterprise Distributed Rate Limiter
 * 
 * Supports Upstash Redis REST API or standard Redis connection.
 * Production Fail-Closed Policy: If running in production (NODE_ENV=production)
 * without a distributed cache configured, requests fail closed (rejected) to prevent
 * unmetered DDoS, brute force, or scraping attacks against PHI/telemetry endpoints.
 */

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

// Development in-memory fallback
const devMemoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  limit: number = 15,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const isProduction = process.env.NODE_ENV === 'production';
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Production Distributed Store: Upstash Redis REST
  if (upstashUrl && upstashToken) {
    try {
      const key = `rate_limit:${identifier}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Use Upstash REST pipeline: multi-exec ZREMRANGEBYSCORE, ZADD, ZCARD, EXPIRE
      const response = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['ZREMRANGEBYSCORE', key, 0, windowStart],
          ['ZADD', key, now, `${now}-${Math.random()}`],
          ['ZCARD', key],
          ['EXPIRE', key, Math.ceil(windowMs / 1000)],
        ]),
      });

      if (response.ok) {
        const results = await response.json();
        const count = results[2]?.result || 0;
        const allowed = count <= limit;
        return {
          success: allowed,
          remaining: Math.max(0, limit - count),
          resetAt: now + windowMs,
        };
      }
    } catch (err: unknown) {
      console.error('[RateLimit Redis Error]:', err instanceof Error ? err.message : err);
      // In production, if Redis call fails, fail closed for security
      if (isProduction) {
        return { success: false, remaining: 0, resetAt: Date.now() + 60000 };
      }
    }
  }

  // 2. Production Fail-Closed Fallback (No distributed store configured)
  if (isProduction) {
    console.error(
      '[CRITICAL SECURITY WARNING] Distributed rate limiter (UPSTASH_REDIS_REST_URL) is unconfigured in production! Failing closed to protect PHI endpoints.'
    );
    return {
      success: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    };
  }

  // 3. Local Development / Test In-Memory Sliding Window
  const now = Date.now();
  const entry = devMemoryStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    devMemoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
