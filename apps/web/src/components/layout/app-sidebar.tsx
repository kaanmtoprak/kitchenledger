'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  ChefHat,
  Factory,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Şubeler', href: '/branches', icon: Store },
  { label: 'Malzemeler', href: '/ingredients', icon: UtensilsCrossed },
  { label: 'Tedarikçiler', href: '/suppliers', icon: Truck },
  { label: 'Satın Almalar', href: '/purchases', icon: ShoppingCart },
  { label: 'Stok', href: '/inventory', icon: Boxes },
  { label: 'Ürünler', href: '/products', icon: Package },
  { label: 'Reçeteler', href: '/recipes', icon: ChefHat },
  { label: 'Üretimler', href: '/productions', icon: Factory },
];

export function AppSidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn('space-y-1', className)}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          KitchenLedger
        </Link>
      </div>
      <div className="flex-1 p-4">
        <AppSidebarNav />
      </div>
    </aside>
  );
}
