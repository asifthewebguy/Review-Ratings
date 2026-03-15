'use client';

import { useAuthStore } from '@/lib/store';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRole?: 'moderator' | 'admin';
  locale: string;
}

const ROLE_RANK: Record<string, number> = {
  user: 0, business_owner: 1, moderator: 2, admin: 3,
};

export function AdminGuard({ children, requiredRole = 'moderator', locale }: AdminGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const isBn = locale === 'bn';

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <p className="font-medium">{isBn ? 'লগইন প্রয়োজন' : 'Login required'}</p>
      </div>
    );
  }

  const userRank = ROLE_RANK[user.role ?? 'user'] ?? 0;
  const requiredRank = ROLE_RANK[requiredRole] ?? 2;

  if (userRank < requiredRank) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-4xl mb-4">⛔</p>
        <p className="font-medium">{isBn ? 'অ্যাক্সেস অস্বীকৃত' : 'Access denied'}</p>
      </div>
    );
  }

  return <>{children}</>;
}
