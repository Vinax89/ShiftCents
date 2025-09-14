import { Logo } from '@/components/logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
       <div className="flex items-center gap-2 mb-8">
            <Logo className="h-10 w-10"/>
            <span className="text-3xl font-headline font-semibold">ShiftCents</span>
        </div>
      {children}
    </main>
  );
}
