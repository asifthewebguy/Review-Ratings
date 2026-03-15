import { z } from 'zod';

// ── API Response Envelope ──────────────────────────────────
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .optional(),
  });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

// ── Pagination ─────────────────────────────────────────────
export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    totalPages: z.number(),
  });

// ── Error Codes ────────────────────────────────────────────
export const ErrorCode = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  OTP_INVALID: 'OTP_INVALID',
  OTP_RATE_LIMITED: 'OTP_RATE_LIMITED',
  REVIEW_EXISTS: 'REVIEW_EXISTS',
  REVIEW_LOCKED: 'REVIEW_LOCKED',
  SELF_REVIEW: 'SELF_REVIEW',
  BUSINESS_NOT_FOUND: 'BUSINESS_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const ErrorCodeSchema = z.nativeEnum(ErrorCode);

// ── Phone Number (Bangladesh) ──────────────────────────────
export const BDPhoneSchema = z
  .string()
  .regex(/^\+8801[3-9]\d{8}$/, 'Invalid Bangladesh phone number. Format: +8801XXXXXXXXX');

// ── OTP ────────────────────────────────────────────────────
export const OtpRequestSchema = z.object({
  phone: BDPhoneSchema,
});

export const OtpVerifySchema = z.object({
  phone: BDPhoneSchema,
  code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
});

export const TokenRefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── User ───────────────────────────────────────────────────
export const UserRoleSchema = z.enum(['user', 'business_owner', 'moderator', 'admin']);

export const UserSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  trustLevel: z.number().int().min(0).max(3),
  role: UserRoleSchema,
  createdAt: z.string().datetime(),
});

export const UpdateUserSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

// ── Review ─────────────────────────────────────────────────
export const ReviewSubmitSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(20).max(1000),
  subRatings: z.record(z.string(), z.number().int().min(1).max(5)).optional(),
  photoUrls: z.array(z.string().url()).max(3).optional(),
});

export const ReviewEditSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  body: z.string().min(20).max(1000).optional(),
  subRatings: z.record(z.string(), z.number().int().min(1).max(5)).optional(),
});

export const ReviewFlagReasonSchema = z.enum([
  'fake',
  'offensive',
  'irrelevant',
  'conflict',
  'other',
]);

export const ReviewFlagSchema = z.object({
  reason: ReviewFlagReasonSchema,
  detail: z.string().max(500).optional(),
});

// ── Business ───────────────────────────────────────────────
export const BusinessCreateSchema = z.object({
  name: z.string().min(2).max(200),
  categoryId: z.string().uuid(),
  districtId: z.string().uuid(),
  upazilaId: z.string().uuid().optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
});

export const BusinessUpdateSchema = z.object({
  description: z.string().max(300).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  hours: z.record(z.string(), z.object({ open: z.string(), close: z.string() })).optional(),
});

// ── Business Response ──────────────────────────────────────
export const BusinessResponseSchema = z.object({
  body: z.string().min(1).max(500),
});

// ── Claim ──────────────────────────────────────────────────
export const ClaimDocTypeSchema = z.enum(['trade_license', 'nid']);

export const ClaimSubmitSchema = z.object({
  docType: ClaimDocTypeSchema,
  docUrl: z.string().url(),
  docUrlBack: z.string().url().optional(),
});

// ── Search ─────────────────────────────────────────────────
export const BusinessSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  district: z.string().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  sort: z.enum(['most_reviewed', 'highest_rated', 'newest']).default('most_reviewed'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
