import bcrypt from 'bcryptjs';
import type { Redis } from 'ioredis';

const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const RATE_LIMIT_WINDOW = 60 * 60; // 1 hour
const RATE_LIMIT_MAX = 3;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function otpKey(phone: string): string {
  return `otp:${phone}`;
}

function rateLimitKey(phone: string): string {
  return `otp_rl:${phone}`;
}

export class OtpService {
  constructor(private redis: Redis) {}

  /** Check if phone has hit rate limit. Returns remaining count. */
  async checkRateLimit(phone: string): Promise<{ allowed: boolean; remaining: number }> {
    if (process.env.NODE_ENV !== 'production') {
      return { allowed: true, remaining: RATE_LIMIT_MAX };
    }

    const key = rateLimitKey(phone);
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, RATE_LIMIT_WINDOW);
    }

    return {
      allowed: count <= RATE_LIMIT_MAX,
      remaining: Math.max(0, RATE_LIMIT_MAX - count),
    };
  }

  /** Generate an OTP, store its hash in Redis, return the plaintext OTP. */
  async create(phone: string): Promise<string> {
    const otp = generateOtp();
    const hash = await bcrypt.hash(otp, 10);
    await this.redis.setex(otpKey(phone), OTP_TTL_SECONDS, hash);
    return otp;
  }

  /** Verify an OTP. Returns true on success and clears it from Redis. */
  async verify(phone: string, code: string): Promise<boolean> {
    const key = otpKey(phone);
    const hash = await this.redis.get(key);

    if (!hash) return false;

    const valid = await bcrypt.compare(code, hash);
    if (valid) {
      await this.redis.del(key);
    }
    return valid;
  }
}
