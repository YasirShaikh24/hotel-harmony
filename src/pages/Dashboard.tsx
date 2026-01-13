import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useDashboardStats, useMonthlyIncomeChart, useRoomOccupancyChart } from '@/hooks/useDashboardStats';
import { BedDouble, Users, CalendarCheck, IndianRupee, TrendingUp, Wallet, Home, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(142, 70%, 45%)', 'hsl(0, 72%, 51%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)'];

export default function Dashboard() {
  const { user, isAdmin, isReceptionist, isCustomer } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: monthlyIncome, isLoading: incomeLoading } = useMonthlyIncomeChart();
  const { data: occupancyData, isLoading: occupancyLoading } = useRoomOccupancyChart();

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

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
            Array(4).fill(0).map((_, i) => (
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
                title="Available Rooms"
                value={stats?.availableRooms || 0}
                icon={Home}
                variant="success"
              />
              <StatCard
                title="Occupied Rooms"
                value={stats?.occupiedRooms || 0}
                icon={Users}
                variant="warning"
              />
              <StatCard
                title="Occupancy Rate"
                value={`${stats?.occupancyRate || 0}%`}
                icon={TrendingUp}
                variant="info"
              />
            </>
          )}
        </div>

        {/* Admin-specific stats */}
        {isAdmin && (
          <div className="dashboard-grid">
            <StatCard
              title="Monthly Income"
              value={formatCurrency(stats?.monthlyIncome || 0)}
              icon={IndianRupee}
            />
            <StatCard
              title="Yearly Income"
              value={formatCurrency(stats?.yearlyIncome || 0)}
              icon={TrendingUp}
            />
            <StatCard
              title="Total Expenses"
              value={formatCurrency(stats?.totalExpenses || 0)}
              icon={Wallet}
            />
            <StatCard
              title="Net Profit"
              value={formatCurrency(stats?.netProfit || 0)}
              icon={IndianRupee}
              variant={stats?.netProfit && stats.netProfit > 0 ? 'success' : 'warning'}
            />
          </div>
        )}

        {/* Receptionist stats */}
        {isReceptionist && (
          <div className="dashboard-grid">
            <StatCard
              title="Today's Check-ins"
              value={stats?.todayCheckIns || 0}
              icon={CalendarCheck}
              variant="success"
            />
            <StatCard
              title="Today's Check-outs"
              value={stats?.todayCheckOuts || 0}
              icon={LogOut}
              variant="info"
            />
          </div>
        )}

        {/* Charts - Admin only */}
        {isAdmin && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Income Chart */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Monthly Income</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyIncome}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Income']}
                      />
                      <Bar dataKey="income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Room Occupancy Pie Chart */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Room Status</CardTitle>
              </CardHeader>
              <CardContent>
                {occupancyLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={occupancyData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {occupancyData?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Customer View */}
        {isCustomer && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Your Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View your current and past bookings in the Bookings section.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
