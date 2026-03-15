import { Link } from '@/i18n/navigation';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-8xl font-bold text-muted-foreground/20">404</p>
      <h1 className="text-2xl font-bold mt-4">পৃষ্ঠাটি পাওয়া যায়নি</h1>
      <p className="text-muted-foreground mt-2">Page not found</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        হোমে ফিরুন / Go Home
      </Link>
    </div>
  );
}
