'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Camera,
  CircleDollarSign,
  Goal,
  LayoutDashboard,
  Wallet,
} from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { BottomNav } from '@/components/bottom-nav';
import PushInit from '@/app/push-init';
import { useIsMobile } from '@/hooks/use-mobile';
import { hardware } from '@/lib/hardware';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/receipts', label: 'Receipts', icon: Wallet },
  { href: '/goals', label: 'Goals', icon: Goal },
  { href: '/taxes', label: 'Taxes', icon: CircleDollarSign },
  { href: '/viability', label: 'Viability', icon: CircleDollarSign },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      const photo = await hardware.cameraCapture({ quality: 80 });
      if (photo?.uri) {
        toast({
          title: 'Receipt Captured',
          description: 'Your receipt is being processed.',
        });
        // Here you would typically navigate or update state
        // For now, we just show a toast
      } else {
         toast({
          title: 'Capture Cancelled',
          description: 'No receipt was captured.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Camera capture error:', error);
       toast({
        title: 'Capture Failed',
        description: 'Could not access the camera.',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
    }
  };


  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-xl font-headline font-semibold">ShiftCents</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 sticky top-0 z-40 backdrop-blur-sm lg:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-xl font-semibold font-headline tracking-tight">
                <CurrentPageTitle />
              </h1>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 relative">
            {children}
            {isMobile && (
              <Button
                size="icon"
                className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-lg bg-accent hover:bg-accent/90"
                onClick={handleCapture}
                disabled={isCapturing}
                aria-label="Scan Receipt"
              >
                <Camera className="h-8 w-8" />
              </Button>
            )}
          </main>
        </SidebarInset>
      </div>
      {isMobile && <BottomNav items={navItems} />}
      <PushInit />
    </SidebarProvider>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <SidebarMenuItem>
      <Link href={href} passHref>
        <SidebarMenuButton isActive={isActive} tooltip={label}>
          <Icon />
          <span>{label}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
}

function CurrentPageTitle() {
  const pathname = usePathname();
  const currentItem = navItems.find((item) => pathname.startsWith(item.href));
  return <>{currentItem?.label || 'Dashboard'}</>;
}
