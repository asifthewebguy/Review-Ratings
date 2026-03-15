'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function UserManagement({ locale }: { locale: string }) {
  const t = useTranslations('admin');
  const { tokens } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const isBn = locale === 'bn';

  async function search() {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users?phone=${encodeURIComponent(phone)}`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      const data = await res.json();
      setUsers(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(userId: string, isActive: boolean) {
    setActionLoading(userId);
    try {
      await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: !isActive } : u));
    } finally {
      setActionLoading(null);
    }
  }

  const ROLE_LABELS: Record<string, string> = {
    user: isBn ? 'ব্যবহারকারী' : 'User',
    business_owner: isBn ? 'ব্যবসা মালিক' : 'Business Owner',
    moderator: isBn ? 'মডারেটর' : 'Moderator',
    admin: isBn ? 'অ্যাডমিন' : 'Admin',
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder={t('searchByPhone')}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={search}
          disabled={loading}
          className="rounded-lg bg-primary px-5 py-2.5 text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {isBn ? 'খুঁজুন' : 'Search'}
        </button>
      </div>

      {users.length > 0 && (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{isBn ? 'নাম' : 'Name'}</th>
                <th className="text-left px-4 py-3 font-medium">{isBn ? 'ফোন' : 'Phone'}</th>
                <th className="text-left px-4 py-3 font-medium">{isBn ? 'ভূমিকা' : 'Role'}</th>
                <th className="text-left px-4 py-3 font-medium">{isBn ? 'রিভিউ' : 'Reviews'}</th>
                <th className="text-left px-4 py-3 font-medium">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">{user.displayName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{user.phone}</td>
                  <td className="px-4 py-3">
                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user._count?.reviews ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {user.isActive ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'স্থগিত' : 'Suspended')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(user.id, user.isActive)}
                      disabled={actionLoading === user.id}
                      className="text-xs border rounded-lg px-3 py-1 hover:border-primary transition-colors disabled:opacity-50"
                    >
                      {user.isActive ? t('suspend') : t('activate')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {users.length === 0 && phone && !loading && (
        <p className="text-center text-muted-foreground py-6 text-sm">{isBn ? 'কোনো ব্যবহারকারী পাওয়া যায়নি' : 'No users found'}</p>
      )}
    </div>
  );
}
