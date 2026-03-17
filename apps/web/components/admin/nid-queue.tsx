'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

const API_URL = '/api/v1';

export function NidQueue({ locale }: { locale: string }) {
  const { tokens } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({});
  const isBn = locale === 'bn';

  useEffect(() => { fetchQueue(); }, []);

  async function fetchQueue() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/nid-queue?status=pending&limit=20`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      const data = await res.json();
      setUsers(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(userId: string, status: 'approved' | 'rejected') {
    const reason = rejectReason[userId];
    if (status === 'rejected' && !reason) {
      setShowRejectInput((prev) => ({ ...prev, [userId]: true }));
      return;
    }
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/nid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
        body: JSON.stringify({ status, rejectedReason: reason }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">{isBn ? 'লোড হচ্ছে...' : 'Loading...'}</div>;
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border bg-background p-10 text-center text-muted-foreground">
        <p className="text-3xl mb-2">✅</p>
        <p>{isBn ? 'কোনো মুলতুবি NID যাচাই নেই' : 'No pending NID verifications'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="rounded-xl border bg-background p-5">
          <div className="mb-3">
            <p className="font-semibold">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.phone}</p>
            {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {isBn ? 'NID নম্বর' : 'NID Number'}:{' '}
              <span className="font-medium font-mono">{user.nidNumber}</span>
            </p>
            {user.nidExtractedName && (
              <p className="text-xs text-muted-foreground">
                {isBn ? 'নাম (OCR)' : 'Name (OCR)'}:{' '}
                <span className="font-medium">{user.nidExtractedName}</span>
              </p>
            )}
            {user.nidExtractedDob && (
              <p className="text-xs text-muted-foreground">
                {isBn ? 'জন্ম তারিখ (OCR)' : 'DOB (OCR)'}:{' '}
                <span className="font-medium">{user.nidExtractedDob}</span>
              </p>
            )}
            {user.nidExtractedAddress && (
              <p className="text-xs text-muted-foreground">
                {isBn ? 'ঠিকানা (OCR)' : 'Address (OCR)'}:{' '}
                <span className="font-medium">{user.nidExtractedAddress}</span>
              </p>
            )}
            {user.nidExtractedFather && (
              <p className="text-xs text-muted-foreground">
                {isBn ? 'পিতা (OCR)' : 'Father (OCR)'}:{' '}
                <span className="font-medium">{user.nidExtractedFather}</span>
              </p>
            )}
            {user.nidExtractedMother && (
              <p className="text-xs text-muted-foreground">
                {isBn ? 'মাতা (OCR)' : 'Mother (OCR)'}:{' '}
                <span className="font-medium">{user.nidExtractedMother}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {isBn ? 'জমার তারিখ' : 'Submitted'}:{' '}
              {new Date(user.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}
            </p>
          </div>

          {/* Document images */}
          <div className="flex flex-wrap gap-3 mb-3">
            {user.nidDocUrl && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{isBn ? 'সামনের দিক' : 'Front'}</p>
                <img src={user.nidDocUrl} alt="NID Front" className="max-h-48 rounded border object-contain bg-muted" />
              </div>
            )}
            {user.nidDocUrlBack && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{isBn ? 'পেছনের দিক' : 'Back'}</p>
                <img src={user.nidDocUrlBack} alt="NID Back" className="max-h-48 rounded border object-contain bg-muted" />
              </div>
            )}
          </div>

          {/* Rejection reason input — shown when reject is clicked */}
          {showRejectInput[user.id] && (
            <input
              type="text"
              placeholder={isBn ? 'প্রত্যাখ্যানের কারণ লিখুন (আবশ্যক)' : 'Enter rejection reason (required)'}
              value={rejectReason[user.id] ?? ''}
              onChange={(e) => setRejectReason((prev) => ({ ...prev, [user.id]: e.target.value }))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}

          <div className="flex gap-3">
            <button
              onClick={() => handleAction(user.id, 'approved')}
              disabled={actionLoading === user.id}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isBn ? '✓ অনুমোদন করুন' : '✓ Approve'}
            </button>
            <button
              onClick={() => handleAction(user.id, 'rejected')}
              disabled={actionLoading === user.id}
              className="rounded-lg border border-red-300 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isBn ? '✗ প্রত্যাখ্যান করুন' : '✗ Reject'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
