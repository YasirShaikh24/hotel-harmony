import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, IndianRupee, Calendar,
  Smartphone, Banknote, Receipt, Wallet
} from 'lucide-react';
import { invoicesApi, expensesApi } from '@/services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

type TimePeriod = 'daily' | 'monthly' | 'yearly' | 'all';
type ActiveTab = 'overview' | 'income' | 'expenses';

interface Invoice {
  id: string;
  roomNumber: string;
  customerName: string;
  total: number;
  paymentMethod?: string;
  advancePaymentMethod?: string;
  advanceAmount?: number;
  invoiceDate: string;
  checkIn?: string;
  paymentStatus: string;
  createdAt?: string;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface IncomeEntry {
  id: string;
  roomNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: string;  // 'Cash' | 'GPay'
  date: string;           // actual date this money was received
  isAdvance: boolean;
  invoiceId: string;
}

// ── helpers ────────────────────────────────────────────────────────────
const normaliseMethod = (m?: string): string => {
  if (!m) return 'Unknown';
  const l = m.toLowerCase().trim();
  if (l === 'gpay' || l === 'upi') return 'GPay';
  if (l === 'cash') return 'Cash';
  return m;
};

const methodStyle = (method: string) => ({
  iconBg:     method === 'GPay' ? 'bg-green-100'      : method === 'Cash' ? 'bg-orange-100'      : 'bg-gray-100',
  iconText:   method === 'GPay' ? 'text-green-600'    : method === 'Cash' ? 'text-orange-600'    : 'text-gray-600',
  leftBorder: method === 'GPay' ? 'border-l-green-400': method === 'Cash' ? 'border-l-orange-400': 'border-l-gray-400',
  badgeCls:   method === 'GPay'
    ? 'border-green-400 text-green-700 bg-green-50'
    : method === 'Cash'
    ? 'border-orange-400 text-orange-700 bg-orange-50'
    : 'border-gray-400 text-gray-700 bg-gray-50',
  amountText: method === 'GPay' ? 'text-green-600' : method === 'Cash' ? 'text-orange-600' : 'text-gray-600',
});

// ── component ──────────────────────────────────────────────────────────
export default function Reports() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [activeTab, setActiveTab]   = useState<ActiveTab>('overview');

  // Fetch ALL invoices regardless of status so advances on pending/partial are included
  const { data: allInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', 'all'],
    queryFn:  () => invoicesApi.getAll(''),
  });

  const { data: allExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn:  expensesApi.getAll,
  });

  // ── date filter applied per-entry ─────────────────────────────────
  const inPeriod = (dateStr: string) => {
    const d   = new Date(dateStr);
    const now = new Date();
    switch (timePeriod) {
      case 'daily':   return d.toDateString() === now.toDateString();
      case 'monthly': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      case 'yearly':  return d.getFullYear() === now.getFullYear();
      default:        return true;
    }
  };

  // ── Build flat IncomeEntry list ────────────────────────────────────
  //
  // Rules:
  //  • Advance payment → own entry, uses advancePaymentMethod + checkIn date
  //  • Remaining/final → own entry, uses paymentMethod + invoiceDate (checkout day)
  //  • Single full pay (no advance, paid) → one entry, uses paymentMethod + invoiceDate
  //
  // The period filter is applied on the DATE of each individual payment so
  // "Today" shows only money that physically arrived today.

  const incomeEntries: IncomeEntry[] = [];

  (allInvoices as Invoice[]).forEach((inv) => {
    const advance    = inv.advanceAmount ?? 0;
    const hasAdvance = advance > 0;

    // Date the advance was collected: prefer checkIn, else createdAt, else invoiceDate
    const advanceDate = inv.checkIn || inv.createdAt || inv.invoiceDate;
    const finalDate   = inv.invoiceDate;

    if (hasAdvance) {
      // ── Advance payment entry ──
      if (inPeriod(advanceDate)) {
        incomeEntries.push({
          id:            `${inv.id}-advance`,
          roomNumber:    inv.roomNumber,
          customerName:  inv.customerName,
          amount:        advance,
          paymentMethod: normaliseMethod(inv.advancePaymentMethod),
          date:          advanceDate,
          isAdvance:     true,
          invoiceId:     inv.id,
        });
      }

      // ── Remaining / final payment entry (only when fully settled) ──
      if (inv.paymentStatus === 'paid' && inv.paymentMethod) {
        const remaining = inv.total - advance;
        if (remaining > 0 && inPeriod(finalDate)) {
          incomeEntries.push({
            id:            `${inv.id}-final`,
            roomNumber:    inv.roomNumber,
            customerName:  inv.customerName,
            amount:        remaining,
            paymentMethod: normaliseMethod(inv.paymentMethod),
            date:          finalDate,
            isAdvance:     false,
            invoiceId:     inv.id,
          });
        }
      }
    } else {
      // ── Single full payment (no advance) ──
      if (inv.paymentStatus === 'paid' && inv.paymentMethod && inPeriod(finalDate)) {
        incomeEntries.push({
          id:            `${inv.id}-full`,
          roomNumber:    inv.roomNumber,
          customerName:  inv.customerName,
          amount:        inv.total,
          paymentMethod: normaliseMethod(inv.paymentMethod),
          date:          finalDate,
          isAdvance:     false,
          invoiceId:     inv.id,
        });
      }
    }
  });

  // ── filtered expenses ──────────────────────────────────────────────
  const filteredExpenses: Expense[] = (allExpenses as Expense[]).filter(e => inPeriod(e.date));

  // ── aggregates ────────────────────────────────────────────────────
  const sumByMethod = (m: string) =>
    incomeEntries.filter(e => e.paymentMethod === m).reduce((s, e) => s + e.amount, 0);

  const gpayIncome  = sumByMethod('GPay');
  const cashIncome  = sumByMethod('Cash');
  const totalIncome = incomeEntries.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit   = totalIncome - totalExpenses;

  // ── chart data ────────────────────────────────────────────────────
  const comparisonData = [
    { name: 'Income',     amount: totalIncome,    color: '#10b981' },
    { name: 'Expenses',   amount: totalExpenses,  color: '#ef4444' },
    { name: 'Net Profit', amount: netProfit,       color: netProfit >= 0 ? '#3b82f6' : '#ef4444' },
  ];

  const paymentMethodChartData = [
    { name: 'GPay', value: gpayIncome,  color: '#10b981' },
    { name: 'Cash', value: cashIncome,  color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const expensesByCategory = filteredExpenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));

  const isLoading = invoicesLoading || expensesLoading;

  const periodLabel: Record<TimePeriod, string> = {
    daily: 'Today', monthly: 'This Month', yearly: 'This Year', all: 'All Time',
  };

  // ── render ────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">
            Complete financial overview — {periodLabel[timePeriod]}
          </p>
        </div>

        {/* Period filter */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(periodLabel) as [TimePeriod, string][]).map(([p, label]) => (
            <Button key={p} size="sm" variant={timePeriod === p ? 'default' : 'outline'} onClick={() => setTimePeriod(p)}>
              {label}
            </Button>
          ))}
        </div>

        {/* ── Summary cards ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <Card key={i}><CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"/>
                  <div className="h-8 bg-gray-200 rounded w-3/4"/>
                </div>
              </CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Revenue */}
            

            {/* GPay */}
            <Card className="border-t-4 border-t-emerald-400">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">GPay Income</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">₹{gpayIncome.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {incomeEntries.filter(e => e.paymentMethod === 'GPay').length} txns
                      {incomeEntries.filter(e => e.paymentMethod === 'GPay' && e.isAdvance).length > 0 &&
                        ` · ${incomeEntries.filter(e => e.paymentMethod === 'GPay' && e.isAdvance).length} advance`
                      }
                    </p>
                  </div>
                  <Smartphone className="h-7 w-7 text-emerald-500"/>
                </div>
              </CardContent>
            </Card>

            {/* Cash */}
            <Card className="border-t-4 border-t-orange-400">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cash Income</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">₹{cashIncome.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {incomeEntries.filter(e => e.paymentMethod === 'Cash').length} txns
                      {incomeEntries.filter(e => e.paymentMethod === 'Cash' && e.isAdvance).length > 0 &&
                        ` · ${incomeEntries.filter(e => e.paymentMethod === 'Cash' && e.isAdvance).length} advance`
                      }
                    </p>
                  </div>
                  <Banknote className="h-7 w-7 text-orange-500"/>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">₹{totalIncome.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{incomeEntries.length} transactions</p>
                  </div>
                  <TrendingUp className="h-7 w-7 text-green-500"/>
                </div>
              </CardContent>
            </Card>

            {/* Net Profit */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net Profit</p>
                    <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ₹{netProfit.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Exp: ₹{totalExpenses.toLocaleString()}
                    </p>
                  </div>
                  <IndianRupee className={`h-7 w-7 ${netProfit >= 0 ? 'text-blue-500' : 'text-red-500'}`}/>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          {(['overview','income','expenses'] as ActiveTab[]).map(tab => (
            <Button key={tab} variant={activeTab === tab ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab)} className="rounded-b-none">
              {tab === 'income'   && <TrendingUp className="h-4 w-4 mr-2"/>}
              {tab === 'expenses' && <Wallet     className="h-4 w-4 mr-2"/>}
              {tab === 'overview' ? 'Overview' : tab === 'income' ? 'Income Details' : 'Expense Details'}
            </Button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name"/>
                    <YAxis/>
                    <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`}/>
                    <Bar dataKey="amount">
                      {comparisonData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Income by Payment Method</CardTitle></CardHeader>
              <CardContent>
                {paymentMethodChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={paymentMethodChartData} cx="50%" cy="50%" outerRadius={100}
                        dataKey="value" labelLine={false}
                        label={({name, value}) => `${name}: ₹${value.toLocaleString()}`}>
                        {paymentMethodChartData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                      </Pie>
                      <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No payment data
                  </div>
                )}
              </CardContent>
            </Card>

            {categoryData.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3"/>
                      <XAxis dataKey="name"/>
                      <YAxis/>
                      <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`}/>
                      <Bar dataKey="value" fill="#ef4444"/>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── INCOME TAB ── */}
        {activeTab === 'income' && (
          <div className="space-y-6">

            {/* GPay / Cash summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Smartphone className="h-5 w-5 text-green-600"/>GPay / UPI Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">₹{gpayIncome.toLocaleString()}</p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>{incomeEntries.filter(e => e.paymentMethod === 'GPay').length} total transactions</span>
                    <span>·</span>
                    <span className="text-blue-600 font-medium">
                      {incomeEntries.filter(e => e.paymentMethod === 'GPay' && e.isAdvance).length} advance
                    </span>
                    <span>·</span>
                    <span className="text-purple-600 font-medium">
                      {incomeEntries.filter(e => e.paymentMethod === 'GPay' && !e.isAdvance).length} final
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Banknote className="h-5 w-5 text-orange-600"/>Cash Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">₹{cashIncome.toLocaleString()}</p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>{incomeEntries.filter(e => e.paymentMethod === 'Cash').length} total transactions</span>
                    <span>·</span>
                    <span className="text-blue-600 font-medium">
                      {incomeEntries.filter(e => e.paymentMethod === 'Cash' && e.isAdvance).length} advance
                    </span>
                    <span>·</span>
                    <span className="text-purple-600 font-medium">
                      {incomeEntries.filter(e => e.paymentMethod === 'Cash' && !e.isAdvance).length} final
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction list */}
            <Card>
              <CardHeader>
                <CardTitle>All Income Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                    <p className="text-muted-foreground">No income transactions for this period</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...incomeEntries]
                      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(entry => {
                        const s = methodStyle(entry.paymentMethod);
                        return (
                          <Card key={entry.id}
                            className={`hover:shadow-md transition-shadow border-l-4 ${s.leftBorder}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-4">

                                {/* Left section */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {/* Method icon */}
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.iconBg}`}>
                                    {entry.paymentMethod === 'GPay'
                                      ? <Smartphone className={`h-5 w-5 ${s.iconText}`}/>
                                      : <Banknote   className={`h-5 w-5 ${s.iconText}`}/>
                                    }
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    {/* Row 1: room · customer · method badge · advance/final badge */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-gray-900">
                                        Room {entry.roomNumber}
                                      </span>
                                      <span className="text-muted-foreground text-xs">·</span>
                                      <span className="text-gray-700 text-sm">{entry.customerName}</span>

                                      {/* Payment method badge */}
                                      <Badge variant="outline"
                                        className={`text-xs font-semibold inline-flex items-center gap-1 ${s.badgeCls}`}>
                                        {entry.paymentMethod === 'GPay'
                                          ? <><Smartphone className="h-3 w-3"/>GPay</>
                                          : <><Banknote   className="h-3 w-3"/>Cash</>
                                        }
                                      </Badge>

                                      {/* Advance / Final badge */}
                                      {entry.isAdvance ? (
                                        <Badge className="text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-100">
                                          Advance Payment
                                        </Badge>
                                      ) : (
                                        <Badge className="text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-100">
                                          Final Payment
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Row 2: date + description */}
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                                      <Calendar className="h-3 w-3 shrink-0"/>
                                      <span>
                                        {new Date(entry.date).toLocaleDateString('en-IN', {
                                          day: '2-digit', month: 'short', year: 'numeric',
                                        })}
                                      </span>
                                      <span>·</span>
                                      <span className="italic">
                                        {entry.isAdvance
                                          ? `Advance collected via ${entry.paymentMethod}`
                                          : `Full/remaining payment via ${entry.paymentMethod}`
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: amount */}
                                <div className="text-right shrink-0">
                                  <p className={`text-2xl font-bold ${entry.isAdvance ? 'text-blue-600' : s.iconText}`}>
                                    ₹{entry.amount.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {entry.isAdvance ? 'advance' : 'payment'}
                                  </p>
                                </div>

                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── EXPENSE TAB ── */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {categoryData.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Expense Categories Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {categoryData.map(cat => (
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

            <Card>
              <CardHeader><CardTitle>All Expense Transactions</CardTitle></CardHeader>
              <CardContent>
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                    <p className="text-muted-foreground">No expenses for this period</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredExpenses.map(expense => (
                      <Card key={expense.id}
                        className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <Wallet className="h-5 w-5 text-red-600"/>
                              </div>
                              <div>
                                <p className="font-semibold">{expense.category}</p>
                                <p className="text-sm text-gray-600 mt-0.5">{expense.description}</p>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3"/>
                                  <span>
                                    {new Date(expense.date).toLocaleDateString('en-IN', {
                                      day: '2-digit', month: 'short', year: 'numeric',
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-2xl font-bold text-red-600 shrink-0">
                              ₹{expense.amount.toLocaleString()}
                            </p>
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