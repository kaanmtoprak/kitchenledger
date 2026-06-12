'use client';

import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebarNav } from '@/components/layout/app-sidebar';
import { OrganizationSwitcher } from '@/components/layout/organization-switcher';
import { useAuth } from '@/lib/auth/use-auth';
import { usePermissions } from '@/lib/auth/use-permissions';

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const permissions = usePermissions();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-[0_1px_3px_0_rgb(15_23_42/0.05)] backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Menüyü aç</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-slate-200 bg-surface-sidebar p-0">
            <div className="flex h-[4.5rem] flex-col justify-center border-b border-slate-200 px-6">
              <span className="text-lg font-bold tracking-tight text-foreground">
                KitchenLedger
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Operasyon Paneli
              </span>
            </div>
            <div className="p-4">
              <AppSidebarNav
                canManageTeam={permissions.canManageTeam}
                canViewAuditLogs={permissions.canViewAuditLogs}
              />
            </div>
          </SheetContent>
        </Sheet>
        <div className="md:hidden">
          <p className="text-base font-bold tracking-tight text-foreground">KitchenLedger</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <OrganizationSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-slate-100">
              <Avatar className="h-9 w-9 ring-2 ring-slate-100">
                <AvatarFallback className="bg-blue-50 text-xs font-semibold text-blue-700">
                  {user ? getInitials(user.firstName, user.lastName) : 'KL'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {user ? `${user.firstName} ${user.lastName}` : 'Kullanıcı'}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
