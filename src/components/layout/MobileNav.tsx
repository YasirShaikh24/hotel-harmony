import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  Receipt,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, TrendingUp, Wallet, MessageSquare } from 'lucide-react';

const primaryNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'receptionist', 'customer'] },
  { icon: BedDouble, label: 'Rooms', href: '/rooms', roles: ['admin', 'receptionist'] },
  { icon: CalendarCheck, label: 'Bookings', href: '/bookings', roles: ['admin', 'receptionist', 'customer'] },
  { icon: Receipt, label: 'Billing', href: '/billing', roles: ['admin', 'receptionist', 'customer'] },
];

const moreNavItems = [
  { icon: Users, label: 'Customers', href: '/customers', roles: ['admin', 'receptionist'] },
  { icon: TrendingUp, label: 'Reports', href: '/reports', roles: ['admin'] },
  { icon: Wallet, label: 'Expenses', href: '/expenses', roles: ['admin'] },
  { icon: MessageSquare, label: 'WhatsApp', href: '/whatsapp-logs', roles: ['admin'] },
];

export function MobileNav() {
  const { user } = useAuth();
  const location = useLocation();

  const filteredPrimaryItems = primaryNavItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  const filteredMoreItems = moreNavItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <nav className="mobile-nav">
      <div className="flex items-center justify-around h-16 px-2">
        {filteredPrimaryItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'mobile-nav-item flex-1',
                isActive && 'active text-primary'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          );
        })}

        {filteredMoreItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="mobile-nav-item flex-1">
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs mt-1">More</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 mb-2">
              {filteredMoreItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <NavLink to={item.href} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}
