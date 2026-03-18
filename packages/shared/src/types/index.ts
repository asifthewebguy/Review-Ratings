import type { z } from 'zod';
import type {
  UserSchema,
  UserRoleSchema,
  FirebaseVerifySchema,
  PhoneVerifySchema,
  TokenRefreshSchema,
  ReviewSubmitSchema,
  ReviewEditSchema,
  ReviewFlagReasonSchema,
  ReviewReactionSchema,
  ReviewUpdateSchema,
  AdminEditDecisionSchema,
  BusinessCreateSchema,
  BusinessUpdateSchema,
  BusinessSearchSchema,
  BusinessResponseSchema,
  ClaimSubmitSchema,
  ClaimDocTypeSchema,
  PaginationParamsSchema,
  ErrorCodeSchema,
  EmailVerifyRequestSchema,
  EmailVerifyConfirmSchema,
} from '../schemas/index.js';

// ── Inferred Types ─────────────────────────────────────────
export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type FirebaseVerify = z.infer<typeof FirebaseVerifySchema>;
export type PhoneVerify = z.infer<typeof PhoneVerifySchema>;
export type TokenRefresh = z.infer<typeof TokenRefreshSchema>;
export type ReviewSubmit = z.infer<typeof ReviewSubmitSchema>;
export type ReviewEdit = z.infer<typeof ReviewEditSchema>;
export type ReviewFlagReason = z.infer<typeof ReviewFlagReasonSchema>;
export type BusinessCreate = z.infer<typeof BusinessCreateSchema>;
export type BusinessUpdate = z.infer<typeof BusinessUpdateSchema>;
export type BusinessSearch = z.infer<typeof BusinessSearchSchema>;
export type BusinessResponse = z.infer<typeof BusinessResponseSchema>;
export type ClaimSubmit = z.infer<typeof ClaimSubmitSchema>;
export type ClaimDocType = z.infer<typeof ClaimDocTypeSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type ErrorCodeValue = z.infer<typeof ErrorCodeSchema>;
export type EmailVerifyRequest = z.infer<typeof EmailVerifyRequestSchema>;
export type EmailVerifyConfirm = z.infer<typeof EmailVerifyConfirmSchema>;
export type ReviewReaction = z.infer<typeof ReviewReactionSchema>;
export type ReviewUpdateBody = z.infer<typeof ReviewUpdateSchema>;
export type AdminEditDecision = z.infer<typeof AdminEditDecisionSchema>;

// ── API Response Types ─────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Auth Response ──────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ── Review Display ─────────────────────────────────────────
export interface ReviewWithResponse {
  id: string;
  businessId: string;
  userId: string;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
  reviewerTrustLevel: number;
  rating: number;
  body: string;
  subRatings: Record<string, number> | null;
  photoUrls: string[] | null;
  isVerifiedPurchase: boolean;
  status: string;
  flagCount: number;
  helpfulCount: number;
  editLockedAt: string;
  createdAt: string;
  response: {
    body: string;
    createdAt: string;
    isEdited: boolean;
  } | null;
}

// ── Business Display ───────────────────────────────────────
export interface BusinessProfile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  categoryNameEn: string;
  categoryNameBn: string;
  districtId: string;
  districtNameEn: string;
  districtNameBn: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  facebookUrl: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  hours: Record<string, { open: string; close: string }> | null;
  isClaimed: boolean;
  verifiedTier: string;
  avgRating: number | null;
  reviewCount: number;
  ratingDistribution: Record<number, number>;
  subRatingAverages: Record<string, number>;
}
