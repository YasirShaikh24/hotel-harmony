import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Plus, Trash2, Calendar, IndianRupee, TrendingUp, TrendingDown, Receipt, CreditCard, Banknote, Building2, Smartphone } from 'lucide-react';
import { expensesApi, financialApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const EXPENSE_CATEGORIES = [
  'Rent/Lease',
  'Salaries & Wages',
  'Utilities (Electricity, Water, Gas)',
  'Maintenance & Repairs',
  'Housekeeping Supplies',
  'Food & Beverages',
  'Marketing & Advertising',
  'Insurance',
  'Taxes & Licenses',
  'Internet & Phone',
  'Laundry Services',
  'Security',
  'Miscellaneous'
];

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod?: string;
  receiptNumber?: string;
  vendorName?: string;
  createdAt: string;
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
    paymentMethod: 'cash',
    receiptNumber: '',
    vendorName: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addExpenseMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({
        title: 'Success',
        description: 'Expense added successfully',
      });
      setFormData({
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        receiptNumber: '',
        vendorName: '',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add expense',
        variant: 'destructive',
      });
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor/Service Provider (Optional)</Label>
            <Input
              id="vendorName"
              value={formData.vendorName}
              onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
              placeholder="e.g., ABC Electricals, XYZ Services"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Monthly electricity bill, AC repair for Room 105"
              required
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

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                formData.paymentMethod === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === 'cash'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-4 h-4"
                />
                <Banknote className="h-5 w-5 text-green-600" />
                <span className="font-medium">Cash</span>
              </label>
              <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                formData.paymentMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={formData.paymentMethod === 'bank'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-4 h-4"
                />
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Bank</span>
              </label>
              <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                formData.paymentMethod === 'card' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === 'card'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-4 h-4"
                />
                <CreditCard className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Card</span>
              </label>
              <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                formData.paymentMethod === 'upi' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={formData.paymentMethod === 'upi'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-4 h-4"
                />
                <Smartphone className="h-5 w-5 text-orange-600" />
                <span className="font-medium">UPI</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptNumber">Receipt/Invoice Number (Optional)</Label>
            <Input
              id="receiptNumber"
              value={formData.receiptNumber}
              onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
              placeholder="e.g., INV-2024-001"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={addExpenseMutation.isPending} className="flex-1">
              {addExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Expenses() {
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'monthly' | 'yearly' | ''>('monthly');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: expensesApi.getAll,
  });

  const { data: financialSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['financial-summary', timePeriod],
    queryFn: () => financialApi.getSummary(timePeriod),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4 text-green-600" />;
      case 'bank':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'card':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'upi':
        return <Smartphone className="h-4 w-4 text-orange-600" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'N/A';
  };

  // Filter expenses by category
  const filteredExpenses = categoryFilter
    ? expenses?.filter((exp: Expense) => exp.category === categoryFilter)
    : expenses;

  // Calculate category-wise totals
  const categoryTotals = expenses?.reduce((acc: Record<string, number>, exp: Expense) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const totalExpenses = filteredExpenses?.reduce((sum: number, expense: Expense) => sum + expense.amount, 0) || 0;

  const isLoading = expensesLoading || summaryLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Expense Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all hotel expenses
            </p>
          </div>
          <Button 
            className="bg-red-600 hover:bg-red-700"
            onClick={() => setIsAddExpenseModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Time Period Filter */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={timePeriod === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('')}
          >
            All Time
          </Button>
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
        </div>

        {/* Financial Summary */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{(financialSummary?.totalIncome || 0).toLocaleString()}
                    </p>
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
                    <p className="text-2xl font-bold text-red-600">
                      ₹{(financialSummary?.totalExpenses || 0).toLocaleString()}
                    </p>
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
                    <p className={`text-2xl font-bold ${(financialSummary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{(financialSummary?.netProfit || 0).toLocaleString()}
                    </p>
                  </div>
                  <IndianRupee className={`h-8 w-8 ${(financialSummary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Filter */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium whitespace-nowrap">Filter by Category:</Label>
              <Select value={categoryFilter || 'all'} onValueChange={(value) => setCategoryFilter(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category} {categoryTotals?.[category] ? `(₹${categoryTotals[category].toLocaleString()})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoryFilter && (
                <Button variant="outline" size="sm" onClick={() => setCategoryFilter('')}>
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {categoryFilter ? `${categoryFilter} Expenses` : 'All Expenses'} ({filteredExpenses?.length || 0})
              </CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expensesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading expenses...</p>
              </div>
            ) : filteredExpenses?.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No expenses found</h3>
                <p className="text-muted-foreground mb-4">
                  {categoryFilter 
                    ? `No expenses in ${categoryFilter} category`
                    : 'Start by adding your first expense record'
                  }
                </p>
                <Button onClick={() => setIsAddExpenseModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses?.map((expense: Expense) => (
                  <Card key={expense.id} className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                              <Wallet className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900">{expense.category}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {new Date(expense.date).toLocaleDateString('en-IN', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                            </div>
                          </div>
                          
                          <div className="ml-13 space-y-2">
                            {expense.vendorName && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Receipt className="h-4 w-4" />
                                <span>Vendor: {expense.vendorName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-4 flex-wrap text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                {getPaymentMethodIcon(expense.paymentMethod)}
                                <span>{getPaymentMethodLabel(expense.paymentMethod)}</span>
                              </div>
                              {expense.receiptNumber && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Receipt className="h-4 w-4" />
                                  <span>Receipt: {expense.receiptNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex flex-col items-end gap-2">
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
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
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

        {/* Add Expense Modal */}
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
