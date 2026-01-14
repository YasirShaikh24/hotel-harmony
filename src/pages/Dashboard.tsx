import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { BedDouble, Users, CalendarCheck, Home, LogOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, isReceptionist, isCustomer } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening at the hotel today.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="dashboard-grid">
          {statsLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                title="Total Rooms"
                value={stats?.totalRooms || 0}
                icon={BedDouble}
                variant="primary"
              />
              <StatCard
                title="Occupied"
                value={stats?.occupiedRooms || 0}
                icon={Users}
                variant="warning"
              />
              <StatCard
                title="Available"
                value={stats?.availableRooms || 0}
                icon={Home}
                variant="success"
              />
              <StatCard
                title="Today's Check-ins"
                value={stats?.todayCheckIns || 0}
                icon={CalendarCheck}
                variant="info"
              />
              <StatCard
                title="Today's Check-outs"
                value={stats?.todayCheckOuts || 0}
                icon={LogOut}
                variant="info"
              />
            </>
          )}
        </div>

        {/* Remove receptionist-specific stats section */}

        {/* Customer-specific content */}
        {isCustomer && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border">
              <h2 className="text-xl font-semibold mb-2">Your Bookings</h2>
              <p className="text-muted-foreground mb-4">
                View your current and past bookings in the Bookings section.
              </p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                View Bookings
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}