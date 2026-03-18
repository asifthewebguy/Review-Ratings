'use client';

import { useState } from 'react';
import { StarRating } from '@/components/ui/star-rating';
import { useAuthStore } from '@/lib/store';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';

const API_URL = '/api/v1';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    body: string;
    photoUrls: string[];
    editedAt?: string | null;
    isVerifiedPurchase: boolean;
    helpfulCount?: number;
    unhelpfulCount?: number;
    originalBody?: string | null;
    originalRating?: number | null;
    createdAt: string;
    userId: string;
    user: { displayName: string; avatarUrl?: string | null; trustLevel: number };
    response?: {
      body: string;
      user: { displayName: string };
      createdAt: string;
    } | null;
    updates?: { id: string; body: string; createdAt: string }[];
    edits?: { id: string }[];
  };
  locale: string;
  onEdit?: () => void;
  onUpdate?: () => void;
}

export function ReviewCard({ review, locale, onEdit, onUpdate }: ReviewCardProps) {
  const isBn = locale === 'bn';
  const t = useTranslations('review');
  const { user: currentUser, tokens, isAuthenticated } = useAuthStore();
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  const [showOriginal, setShowOriginal] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount ?? 0);
  const [unhelpfulCount, setUnhelpfulCount] = useState(review.unhelpfulCount ?? 0);
  const [userReaction, setUserReaction] = useState<'helpful' | 'unhelpful' | null>(null);
  const [reacting, setReacting] = useState(false);

  // Show update form inline
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateBody, setUpdateBody] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const isAuthor = currentUser?.id === review.userId;
  const hasPendingEdit = (review.edits?.length ?? 0) > 0;

  async function handleReaction(type: 'helpful' | 'unhelpful') {
    if (!isAuthenticated || reacting) return;
    setReacting(true);
    try {
      if (userReaction === type) {
        // Remove reaction
        const res = await fetch(`${API_URL}/reviews/${review.id}/react`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          setHelpfulCount(data.data.helpfulCount);
          setUnhelpfulCount(data.data.unhelpfulCount);
          setUserReaction(null);
        }
      } else {
        // Add/change reaction
        const res = await fetch(`${API_URL}/reviews/${review.id}/react`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({ type }),
        });
        const data = await res.json();
        if (res.ok) {
          setHelpfulCount(data.data.helpfulCount);
          setUnhelpfulCount(data.data.unhelpfulCount);
          setUserReaction(type);
        }
      }
    } finally {
      setReacting(false);
    }
  }

  async function handleSubmitUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!updateBody.trim() || updateBody.length < 20) return;
    setUpdateLoading(true);
    setUpdateError('');
    try {
      const res = await fetch(`${API_URL}/reviews/${review.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ body: updateBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUpdateError(data.error?.message ?? 'Error');
        return;
      }
      setUpdateSuccess(true);
      setShowUpdateForm(false);
      setUpdateBody('');
      onUpdate?.();
    } catch {
      setUpdateError(isBn ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setUpdateLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-background p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden">
            {review.user.avatarUrl ? (
              <img
                src={review.user.avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              review.user.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{review.user.displayName}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarRating value={review.rating} size="sm" />
          <div className="flex gap-2">
            {review.isVerifiedPurchase && (
              <span className="text-xs text-green-600">
                ✓ {isBn ? 'যাচাইকৃত' : 'Verified'}
              </span>
            )}
            {review.editedAt && (
              <span className="text-xs text-muted-foreground">
                {isBn ? 'সম্পাদিত' : 'Edited'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <p className="mt-3 text-sm leading-relaxed">{review.body}</p>

      {/* View Original (if edited) */}
      {review.originalBody && (
        <div className="mt-2">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-xs text-primary hover:underline"
          >
            {showOriginal
              ? (isBn ? 'মূল রিভিউ লুকান' : 'Hide original')
              : (isBn ? 'মূল রিভিউ দেখুন' : 'View original review')}
          </button>
          {showOriginal && (
            <div className="mt-2 rounded-lg bg-muted/40 p-3 text-sm border-l-2 border-muted-foreground/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {isBn ? 'মূল রিভিউ' : 'Original Review'}
                </span>
                {review.originalRating && (
                  <StarRating value={review.originalRating} size="sm" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{review.originalBody}</p>
            </div>
          )}
        </div>
      )}

      {/* Photos */}
      {review.photoUrls?.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {review.photoUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="h-20 w-20 rounded-lg object-cover cursor-pointer hover:opacity-90"
            />
          ))}
        </div>
      )}

      {/* Updates */}
      {review.updates && review.updates.length > 0 && (
        <div className="mt-3 space-y-2">
          {review.updates.map((update) => (
            <div key={update.id} className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 border-l-2 border-blue-400">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                📝 {isBn ? 'আপডেট' : 'Update'} — {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
              </p>
              <p className="text-sm">{update.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reactions */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => handleReaction('helpful')}
          disabled={reacting || !isAuthenticated}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
            userReaction === 'helpful'
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'border-border text-muted-foreground hover:border-green-300 hover:text-green-600'
          } disabled:opacity-50`}
        >
          👍 {helpfulCount > 0 && <span>{helpfulCount}</span>}
        </button>
        <button
          onClick={() => handleReaction('unhelpful')}
          disabled={reacting || !isAuthenticated}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
            userReaction === 'unhelpful'
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'border-border text-muted-foreground hover:border-red-300 hover:text-red-600'
          } disabled:opacity-50`}
        >
          👎 {unhelpfulCount > 0 && <span>{unhelpfulCount}</span>}
        </button>

        {/* Author actions */}
        {isAuthor && (
          <div className="ml-auto flex gap-2">
            {!hasPendingEdit && (
              <button
                onClick={onEdit}
                className="text-xs text-primary hover:underline"
              >
                {isBn ? 'সম্পাদনা' : 'Edit'}
              </button>
            )}
            {hasPendingEdit && (
              <span className="text-xs text-amber-600">
                {isBn ? 'সম্পাদনা পর্যালোচনাধীন' : 'Edit pending review'}
              </span>
            )}
            {!showUpdateForm && !updateSuccess && (
              <button
                onClick={() => setShowUpdateForm(true)}
                className="text-xs text-primary hover:underline"
              >
                {isBn ? 'আপডেট যোগ করুন' : 'Add Update'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Update Form (inline) */}
      {showUpdateForm && (
        <form onSubmit={handleSubmitUpdate} className="mt-3 space-y-2">
          <textarea
            value={updateBody}
            onChange={(e) => setUpdateBody(e.target.value)}
            placeholder={isBn ? 'আপনার আপডেট লিখুন (২০-৫০০ অক্ষর)' : 'Write your update (20-500 characters)'}
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{updateBody.length}/500</p>
            {updateError && <p className="text-xs text-red-600">{updateError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowUpdateForm(false); setUpdateBody(''); setUpdateError(''); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={updateLoading || updateBody.length < 20}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {updateLoading ? (isBn ? 'জমা হচ্ছে...' : 'Submitting...') : (isBn ? 'আপডেট জমা দিন' : 'Submit Update')}
              </button>
            </div>
          </div>
        </form>
      )}

      {updateSuccess && (
        <p className="mt-2 text-xs text-green-600">✓ {isBn ? 'আপডেট সংরক্ষিত হয়েছে' : 'Update submitted'}</p>
      )}

      {/* Business Response */}
      {review.response && (
        <div className="mt-4 rounded-lg bg-muted/50 p-4 border-l-2 border-primary">
          <p className="text-xs font-semibold text-primary mb-1">
            {isBn ? '📢 ব্যবসার প্রতিক্রিয়া' : '📢 Business Response'} —{' '}
            {review.response.user.displayName}
          </p>
          <p className="text-sm">{review.response.body}</p>
        </div>
      )}
    </div>
  );
}
