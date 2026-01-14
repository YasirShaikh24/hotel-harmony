import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Download, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// Mock data for reports
const monthlyRevenue = [
  { month: 'Jan', revenue: 450000, bookings: 89 },
  { month: 'Feb', revenue: 520000, bookings: 102 },
  { month: 'Mar', revenue: 480000, bookings: 95 },
  { month: 'Apr', revenue: 610000, bookings: 118 },
  { month: 'May', revenue: 580000, bookings: 112 },
  { month: 'Jun', revenue: 650000, bookings: 125 },
];

const roomTypeRevenue = [
  { name: 'Single', value: 25, revenue: 125000, color: '#8884d8' },
  { name: 'Double', value: 35, revenue: 280000, color: '#82ca9d' },
  { name: 'Deluxe', value: 25, revenue: 325000, color: '#ffc658' },
  { name: 'Suite', value: 15, revenue: 450000, color: '#ff7300' },
];

const occupancyTrend = [
  { month: 'Jan', occupancy: 65 },
  { month: 'Feb', occupancy: 72 },
  { month: 'Mar', occupancy: 68 },
  { month: 'Apr', occupancy: 78 },
  { month: 'May', occupancy: 75 },
  { month: 'Jun', occupancy: 82 },
];

export default function Reports() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive business insights and performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₹32,45,000</p>
                  <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>+12.5%</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">641</p>
                  <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>+8.2%</span>
                  </div>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Occupancy</p>
                  <p className="text-2xl font-bold">73.2%</p>
                  <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>+5.1%</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue per Room</p>
                  <p className="text-2xl font-bold">₹6,490</p>
                  <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
                    <TrendingDown className="h-4 w-4" />
                    <span>-2.3%</span>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">₹</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Bookings'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Room Type Revenue Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Room Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roomTypeRevenue}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roomTypeRevenue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Occupancy Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Occupancy Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={occupancyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Occupancy Rate']} />
                  <Line 
                    type="monotone" 
                    dataKey="occupancy" 
                    stroke="#82ca9d" 
                    strokeWidth={3}
                    dot={{ fill: '#82ca9d', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roomTypeRevenue.map((room) => (
                  <div key={room.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: room.color }}
                      ></div>
                      <span className="font-medium">{room.name} Rooms</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₹{room.revenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{room.value}% share</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Best Performing Month</h4>
                <p className="text-2xl font-bold text-green-600">June 2024</p>
                <p className="text-sm text-muted-foreground">₹6,50,000 revenue with 125 bookings</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Most Popular Room Type</h4>
                <p className="text-2xl font-bold text-blue-600">Double Rooms</p>
                <p className="text-sm text-muted-foreground">35% of total bookings</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Average Stay Duration</h4>
                <p className="text-2xl font-bold text-purple-600">3.2 Days</p>
                <p className="text-sm text-muted-foreground">Increased by 0.5 days from last quarter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}