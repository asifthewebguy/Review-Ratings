import type { Redis } from 'ioredis';


export async function cached<T>(
  redis: Redis,
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const result = await fn();
  await redis.setex(key, ttl, JSON.stringify(result));
  return result;
}

export async function invalidate(redis: Redis, pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}
