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

// ── Firebase Auth ───────────────────────────────────────────
/** Body for POST /auth/firebase/verify — exchange Firebase social ID token for custom JWT */
export const FirebaseVerifySchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
});

/** Body for POST /users/me/verify/phone — exchange Firebase Phone Auth ID token to set phone on account */
export const PhoneVerifySchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
});

export const TokenRefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── User ───────────────────────────────────────────────────
export const UserRoleSchema = z.enum(['user', 'business_owner', 'moderator', 'admin']);

export const UserSchema = z.object({
  id: z.string().uuid(),
  phone: z.string().nullable().optional(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  trustLevel: z.number().int().min(0).max(3),
  role: UserRoleSchema,
  email: z.string().email().nullable().optional(),
  emailVerifiedAt: z.string().datetime().nullable().optional(),
  verifiedAt: z.string().datetime().nullable().optional(),
  nidStatus: z.enum(['none', 'pending', 'approved', 'rejected']).optional(),
  nidVerifiedAt: z.string().datetime().nullable().optional(),
  nidRejectedReason: z.string().nullable().optional(),
  nidExtractedName: z.string().nullable().optional(),
  nidExtractedDob: z.string().nullable().optional(),
  nidExtractedAddress: z.string().nullable().optional(),
  nidExtractedFather: z.string().nullable().optional(),
  nidExtractedMother: z.string().nullable().optional(),
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

// ── User Verification ──────────────────────────────────────
export const EmailVerifyRequestSchema = z.object({
  email: z.string().email().max(255),
});

export const EmailVerifyConfirmSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const NidSubmitSchema = z.object({
  nidNumber: z.string().min(10).max(20),
  nidDocUrl: z.string().min(1),
  nidDocUrlBack: z.string().min(1).optional(),
  nidExtractedName: z.string().optional(),
  nidExtractedDob: z.string().optional(),
  nidExtractedAddress: z.string().optional(),
  nidExtractedFather: z.string().optional(),
  nidExtractedMother: z.string().optional(),
});

export const NidExtractSchema = z.object({
  imageData: z.string().min(1),
});

export const NidUploadUrlSchema = z.object({
  side: z.enum(['front', 'back']),
  mimeType: z.string().min(1),
});

export const AdminNidDecisionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectedReason: z.string().max(500).optional(),
});

export const NidStatusSchema = z.enum(['none', 'pending', 'approved', 'rejected']);

// ── Error Codes (verification) ─────────────────────────────
export const VerificationErrorCode = {
  EMAIL_ALREADY_VERIFIED: 'EMAIL_ALREADY_VERIFIED',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  OTP_EXPIRED: 'OTP_EXPIRED',
  NID_ALREADY_VERIFIED: 'NID_ALREADY_VERIFIED',
  NID_REVIEW_PENDING: 'NID_REVIEW_PENDING',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  NID_NOT_VERIFIED: 'NID_NOT_VERIFIED',
  ALREADY_RESOLVED: 'ALREADY_RESOLVED',
} as const;

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
