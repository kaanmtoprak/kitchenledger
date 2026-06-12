'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  ChefHat,
  ClipboardList,
  Factory,
  FileSpreadsheet,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { usePermissions } from '@/lib/auth/use-permissions';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  requiresManageTeam?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Genel',
    items: [
      { label: 'Panel', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Raporlar', href: '/reports', icon: FileSpreadsheet },
      {
        label: 'Kullanıcılar',
        href: '/team',
        icon: Users,
        requiresManageTeam: true,
      },
    ],
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

export function AppSidebarNav({
  className,
  canManageTeam = false,
}: {
  className?: string;
  canManageTeam?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn('space-y-6', className)}>
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {group.label}
          </p>
          {group.items
            .filter((item) => !item.requiresManageTeam || canManageTeam)
            .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-l-2 py-2.5 pl-[10px] pr-3 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'border-l-blue-600 bg-blue-100/60 text-blue-700'
                    : 'border-l-transparent text-slate-600 hover:bg-blue-50/50 hover:text-slate-900',
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
  const permissions = usePermissions();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-surface-sidebar md:flex md:flex-col">
      <div className="flex h-[4.5rem] flex-col justify-center border-b border-slate-200 bg-white/60 px-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-foreground">
          KitchenLedger
        </Link>
        <p className="text-[11px] font-medium text-muted-foreground">Operasyon Paneli</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <AppSidebarNav canManageTeam={permissions.canManageTeam} />
      </div>
    </aside>
  );
}
