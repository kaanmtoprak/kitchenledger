'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  ChefHat,
  ClipboardList,
  Factory,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Genel',
    items: [{ label: 'Panel', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operasyon',
    items: [
      { label: 'Satın Almalar', href: '/purchases', icon: ShoppingCart },
      { label: 'Siparişler', href: '/orders', icon: ClipboardList },
      { label: 'Stok', href: '/inventory', icon: Boxes },
      { label: 'Üretimler', href: '/productions', icon: Factory },
    ],
  },
  {
    label: 'Tanımlar',
    items: [
      { label: 'Şubeler', href: '/branches', icon: Store },
      { label: 'Malzemeler', href: '/ingredients', icon: UtensilsCrossed },
      { label: 'Tedarikçiler', href: '/suppliers', icon: Truck },
      { label: 'Ürünler', href: '/products', icon: Package },
      { label: 'Reçeteler', href: '/recipes', icon: ChefHat },
    ],
  },
];

export function AppSidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn('space-y-6', className)}>
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            {group.label}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
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
      <div className="flex-1 overflow-y-auto p-4">
        <AppSidebarNav />
      </div>
    </aside>
  );
}
