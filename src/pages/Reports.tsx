import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, IndianRupee, Calendar, Smartphone, Banknote, Receipt, Wallet } from 'lucide-react';
import { invoicesApi, expensesApi } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

type TimePeriod = 'daily' | 'monthly' | 'yearly' | 'all';
type ActiveTab = 'overview' | 'income' | 'expenses';

interface Invoice {
  id: string;
  roomNumber: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  invoiceDate: string;
  paymentStatus: string;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export default function Reports() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Fetch all paid invoices (income)
  const { data: allInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', 'paid'],
    queryFn: () => invoicesApi.getAll('paid'),
  });

  // Fetch all expenses
  const { data: allExpenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: expensesApi.getAll,
  });

  // Filter data by time period
  const filterByPeriod = (date: string) => {
    const itemDate = new Date(date);
    const now = new Date();
    
    switch (timePeriod) {
      case 'daily':
        return itemDate.toDateString() === now.toDateString();
      case 'monthly':
        return itemDate.getMonth() === now.getMonth() && 
               itemDate.getFullYear() === now.getFullYear();
      case 'yearly':
        return itemDate.getFullYear() === now.getFullYear();
      case 'all':
      default:
        return true;
    }
  };

  const filteredInvoices = allInvoices?.filter((inv: Invoice) => 
    filterByPeriod(inv.invoiceDate)
  ) || [];

  const filteredExpenses = allExpenses?.filter((exp: Expense) => 
    filterByPeriod(exp.date)
  ) || [];

  // Calculate income by payment method
  const gpayIncome = filteredInvoices
    .filter((inv: Invoice) => inv.paymentMethod?.toLowerCase() === 'gpay')
    .reduce((sum: number, inv: Invoice) => sum + inv.total, 0);

  const cashIncome = filteredInvoices
    .filter((inv: Invoice) => inv.paymentMethod?.toLowerCase() === 'cash')
    .reduce((sum: number, inv: Invoice) => sum + inv.total, 0);

  const totalIncome = filteredInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0);
  const totalExpenses = filteredExpenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  // Group expenses by category
  const expensesByCategory = filteredExpenses.reduce((acc: Record<string, number>, exp: Expense) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  // Payment method distribution for pie chart
  const paymentMethodData = [
    { name: 'GPay', value: gpayIncome, color: '#10b981' },
    { name: 'Cash', value: cashIncome, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // Income vs Expense comparison
  const comparisonData = [
    { name: 'Income', amount: totalIncome, color: '#10b981' },
    { name: 'Expenses', amount: totalExpenses, color: '#ef4444' },
    { name: 'Net Profit', amount: netProfit, color: netProfit >= 0 ? '#3b82f6' : '#ef4444' },
  ];

  const isLoading = invoicesLoading || expensesLoading;

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'daily': return 'Today';
      case 'monthly': return 'This Month';
      case 'yearly': return 'This Year';
      case 'all': return 'All Time';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Financial Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete financial overview and analytics - {getPeriodLabel()}
            </p>
          </div>
        </div>

        {/* Time Period Filters */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={timePeriod === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('daily')}
          >
            Today
          </Button>
          <Button 
            variant={timePeriod === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('monthly')}
          >
            This Month
          </Button>
          <Button 
            variant={timePeriod === 'yearly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('yearly')}
          >
            This Year
          </Button>
          <Button 
            variant={timePeriod === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('all')}
          >
            All Time
          </Button>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{filteredInvoices.length} payments</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.length} expenses</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ₹{netProfit.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {netProfit >= 0 ? 'Profit' : 'Loss'}
                    </p>
                  </div>
                  <IndianRupee className={`h-8 w-8 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold text-purple-600">{filteredInvoices.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b">
          <Button 
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className="rounded-b-none"
          >
            Overview
          </Button>
          <Button 
            variant={activeTab === 'income' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('income')}
            className="rounded-b-none"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Income Details
          </Button>
          <Button 
            variant={activeTab === 'expenses' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('expenses')}
            className="rounded-b-none"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Expense Details
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expense Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#8884d8">
                      {comparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Method Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Income by Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No payment data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Category Breakdown */}
            {categoryData.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                      <Bar dataKey="value" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Income Tab */}
        {activeTab === 'income' && (
          <div className="space-y-6">
            {/* Payment Method Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    GPay Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">₹{gpayIncome.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredInvoices.filter((inv: Invoice) => inv.paymentMethod?.toLowerCase() === 'gpay').length} transactions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-orange-600" />
                    Cash Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">₹{cashIncome.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredInvoices.filter((inv: Invoice) => inv.paymentMethod?.toLowerCase() === 'cash').length} transactions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Income List */}
            <Card>
              <CardHeader>
                <CardTitle>All Income Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No income transactions for this period</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInvoices.map((invoice: Invoice) => (
                      <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                invoice.paymentMethod?.toLowerCase() === 'gpay' ? 'bg-green-100' : 'bg-orange-100'
                              }`}>
                                {invoice.paymentMethod?.toLowerCase() === 'gpay' ? (
                                  <Smartphone className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Banknote className="h-5 w-5 text-orange-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold">Room {invoice.roomNumber}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-gray-700">{invoice.customerName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {invoice.paymentMethod || 'N/A'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                  <span>•</span>
                                  <span>Invoice: {invoice.id.slice(0, 8)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">
                                ₹{invoice.total.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {/* Category Summary */}
            {categoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Expense Categories Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="p-4 border rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">{cat.name}</p>
                        <p className="text-2xl font-bold text-red-600">₹{cat.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {((cat.value / totalExpenses) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Expense List */}
            <Card>
              <CardHeader>
                <CardTitle>All Expense Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No expenses for this period</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredExpenses.map((expense: Expense) => (
                      <Card key={expense.id} className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-red-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold">{expense.category}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(expense.date).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-red-600">
                                ₹{expense.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
