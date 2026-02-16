import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  BedDouble,
  Users,
  CalendarCheck,
  Receipt,
  TrendingUp,
  Wallet,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'receptionist', 'customer'] },
  { icon: BedDouble, label: 'Rooms', href: '/rooms', roles: ['admin', 'receptionist'] },
  { icon: CalendarCheck, label: 'Bookings', href: '/bookings', roles: ['admin', 'receptionist', 'customer'] },
  { icon: Receipt, label: 'Billing', href: '/billing', roles: ['admin', 'receptionist', 'customer'] },
  { icon: TrendingUp, label: 'Reports', href: '/reports', roles: ['admin'] },
  { icon: Wallet, label: 'Expenses', href: '/expenses', roles: ['admin'] },
  { icon: MessageSquare, label: 'WhatsApp Logs', href: '/whatsapp-logs', roles: ['admin'] },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen bg-sidebar transition-all duration-300 flex flex-col',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <img
              src="/hk.png"
              alt="Hotel Krishna Logo"
              className="w-10 h-10 rounded-full object-cover shadow-gold"
            />
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground">Hotel Krishna</span>
              <span className="text-xs text-sidebar-foreground/70">Management System</span>
            </div>
          </div>
        ) : (
          <img
            src="/hk.png"
            alt="Hotel Krishna Logo"
            className="w-10 h-10 rounded-full object-cover mx-auto shadow-gold"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-gold'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'animate-pulse-soft')} />
                  {isOpen && (
                    <span className="font-medium truncate">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Role Badge */}
      {isOpen && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="bg-sidebar-accent rounded-lg p-3">
            <p className="text-xs text-sidebar-foreground/70">Logged in as</p>
            <p className="font-semibold text-sidebar-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-primary text-sidebar-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform', !isOpen && 'rotate-180')} />
      </button>
    </aside>
  );
}