'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuthStore } from '@/lib/store';
import { LoginModal } from '@/components/auth/login-modal';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface HeaderProps {
  locale: string;
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations('common');
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const otherLocale = locale === 'bn' ? 'en' : 'bn';

  async function handleLogout() {
    await api.delete('/auth/session');
    clearAuth();
    setShowUserMenu(false);
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-primary">
            ReviewBD
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <Link
              href={pathname}
              locale={otherLocale as 'bn' | 'en'}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {locale === 'bn' ? 'English' : 'বাংলা'}
            </Link>

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {user.displayName.charAt(0)}
                  </span>
                  <span className="max-w-[120px] truncate">{user.displayName}</span>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border bg-background shadow-lg py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm hover:bg-muted"
                      >
                        {t('dashboard')}
                      </Link>
                      {(user?.role === 'admin' || user?.role === 'moderator') && (
                        <Link
                          href="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm hover:bg-muted transition-colors text-red-600"
                        >
                          {locale === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}
                        </Link>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted"
                      >
                        {t('logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button onClick={() => setShowLogin(true)} size="sm">
                {t('login')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
