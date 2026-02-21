import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { BedDouble, Users, CalendarCheck, Home, LogOut, CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user, isReceptionist, isCustomer } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllData, setShowAllData] = useState(false);
  
  const dateParam = showAllData ? undefined : format(selectedDate, 'yyyy-MM-dd');
  const { data: stats, isLoading: statsLoading } = useDashboardStats(dateParam);

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
              Here's what's happening at the hotel {showAllData ? 'overall' : 'today'}.
            </p>
          </div>
        </div>

        {/* Compact Date Filter Bar */}
        <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Compact Date Display */}
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30 flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white leading-none">
                      {format(selectedDate, 'dd')}
                    </div>
                    <div className="text-xs text-white/80 uppercase">
                      {format(selectedDate, 'MMM')}
                    </div>
                  </div>
                  <div className="h-10 w-px bg-white/30"></div>
                  <div>
                    <div className="text-sm font-medium text-white/80">
                      {format(selectedDate, 'EEEE')}
                    </div>
                    <div className="text-xs text-white/70">
                      {format(selectedDate, 'yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                  <div className="text-xs text-white/80 mb-0.5">
                    {showAllData ? 'All Time Stats' : 'Today\'s Stats'}
                  </div>
                  <div className="text-2xl font-bold text-white leading-none">
                    {stats?.totalRooms || 0} Rooms
                  </div>
                </div>
              </div>
              
              {/* Compact Action Buttons */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      size="sm"
                      className="bg-white text-purple-600 hover:bg-purple-50 font-semibold shadow-md"
                    >
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Select Date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setShowAllData(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Button 
                  size="sm"
                  onClick={() => setShowAllData(!showAllData)}
                  className={`font-semibold shadow-md ${
                    showAllData 
                      ? 'bg-white text-purple-600 hover:bg-purple-50' 
                      : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                  }`}
                >
                  {showAllData ? 'Today Only' : 'Show All'}
                </Button>
                
                <Button 
                  size="sm"
                  onClick={() => {
                    setSelectedDate(new Date());
                    setShowAllData(false);
                  }}
                  className="bg-white/20 text-white border border-white/30 hover:bg-white/30 font-semibold shadow-md"
                >
                  Today
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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