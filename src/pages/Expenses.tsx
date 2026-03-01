import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, Plus, Trash2, Calendar, IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';
import { expensesApi, invoicesApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  total: number;
  paymentMethod?: string;
  advancePaymentMethod?: string;
  advanceAmount?: number;
  invoiceDate: string;
  checkIn?: string;
  createdAt?: string;
  paymentStatus: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addExpenseMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense added successfully' });
      setFormData({
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      onClose();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add expense', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpenseMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Utilities, Maintenance, Salaries"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the expense"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={addExpenseMutation.isPending} className="flex-1">
              {addExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Calculate total income from invoices (same logic as Reports page) ──
// Counts advance payments + final/remaining payments separately so every
// rupee received is included, regardless of invoice payment status.
function calcTotalIncome(invoices: Invoice[], inPeriod: (d: string) => boolean): number {
  let total = 0;

  invoices.forEach((inv) => {
    const advance    = inv.advanceAmount ?? 0;
    const hasAdvance = advance > 0;
    const advanceDate = inv.checkIn || inv.createdAt || inv.invoiceDate;
    const finalDate   = inv.invoiceDate;

    if (hasAdvance) {
      // Advance payment — counted on the date it was collected
      if (inPeriod(advanceDate)) total += advance;

      // Remaining payment — counted on checkout/invoice date
      if (inv.paymentStatus === 'paid' && inv.paymentMethod) {
        const remaining = inv.total - advance;
        if (remaining > 0 && inPeriod(finalDate)) total += remaining;
      }
    } else {
      // Single full payment
      if (inv.paymentStatus === 'paid' && inv.paymentMethod && inPeriod(finalDate)) {
        total += inv.total;
      }
    }
  });

  return total;
}

// ── Main component ─────────────────────────────────────────────────────
export default function Expenses() {
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'monthly' | 'yearly' | ''>('monthly');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: expensesApi.getAll,
  });

  // All invoices (every status) so advance payments on partial/pending are included
  const { data: allInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', 'all'],
    queryFn: () => invoicesApi.getAll(''),
  });

  const isLoading = expensesLoading || invoicesLoading;

  // ── Period filter ──────────────────────────────────────────────────
  const inPeriod = (dateStr: string) => {
    const d   = new Date(dateStr);
    const now = new Date();
    switch (timePeriod) {
      case 'daily':   return d.toDateString() === now.toDateString();
      case 'monthly': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      case 'yearly':  return d.getFullYear() === now.getFullYear();
      default:        return true; // all time
    }
  };

  // ── Filtered totals ────────────────────────────────────────────────
  const filteredExpenses: Expense[] = (expenses as Expense[]).filter(e => inPeriod(e.date));
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const totalIncome = calcTotalIncome(allInvoices as Invoice[], inPeriod);
  const netProfit   = totalIncome - totalExpenses;

  // ── Delete ────────────────────────────────────────────────────────
  const deleteExpenseMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete expense', variant: 'destructive' });
    },
  });

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const periodLabel: Record<string, string> = {
    '': 'All Time', daily: 'Today', monthly: 'This Month', yearly: 'This Year',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Expense Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all hotel expenses — {periodLabel[timePeriod]}
            </p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsAddExpenseModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Add Expense
          </Button>
        </div>

        {/* Time Period Filter */}
        <div className="flex flex-wrap gap-2">
          {([['', 'All Time'], ['daily', 'Today'], ['monthly', 'This Month'], ['yearly', 'This Year']] as [string, string][]).map(([val, label]) => (
            <Button
              key={val}
              variant={timePeriod === val ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod(val as typeof timePeriod)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Financial Summary */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}><CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"/>
                  <div className="h-8 bg-gray-200 rounded w-3/4"/>
                </div>
              </CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Income */}
            <Card className="border-t-4 border-t-green-400">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{periodLabel[timePeriod]}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card className="border-t-4 border-t-red-400">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            {/* Net Profit */}
            <Card className={`border-t-4 ${netProfit >= 0 ? 'border-t-blue-400' : 'border-t-red-400'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ₹{netProfit.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {netProfit >= 0 ? '✓ Profit' : '✗ Loss'}
                    </p>
                  </div>
                  <IndianRupee className={`h-8 w-8 ${netProfit >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                All Expenses ({filteredExpenses.length})
              </CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Period Total</p>
                <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expensesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"/>
                <p className="mt-4 text-muted-foreground">Loading expenses...</p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No expenses found</h3>
                <p className="text-muted-foreground mb-4">
                  {timePeriod ? `No expenses recorded for ${periodLabel[timePeriod].toLowerCase()}` : 'Start by adding your first expense record'}
                </p>
                <Button onClick={() => setIsAddExpenseModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Expense
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense: Expense) => (
                    <Card key={expense.id} className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                              <Wallet className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{expense.category}</h3>
                              {expense.description && (
                                <p className="text-sm text-gray-600 mt-0.5">{expense.description}</p>
                              )}
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(expense.date).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-2 shrink-0">
                            <p className="text-2xl font-bold text-red-600">
                              ₹{expense.amount.toLocaleString()}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteExpense(expense.id)}
                              disabled={deleteExpenseMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}