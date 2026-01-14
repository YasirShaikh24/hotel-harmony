import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, Plus, Trash2, Calendar, IndianRupee, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { expensesApi, incomeApi, financialApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

interface Income {
  id: string;
  source: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AddIncomeModal({ isOpen, onClose }: AddIncomeModalProps) {
  const [formData, setFormData] = useState({
    source: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addIncomeMutation = useMutation({
    mutationFn: incomeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({
        title: 'Success',
        description: 'Income added successfully',
      });
      setFormData({
        source: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add income',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addIncomeMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Income</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">Income Source</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g., Room Booking, Restaurant, Services"
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
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the income"
              required
            />
          </div>

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

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={addIncomeMutation.isPending} className="flex-1">
              {addIncomeMutation.isPending ? 'Adding...' : 'Add Income'}
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

function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
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
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
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
    addExpenseMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Maintenance, Utilities, Staff"
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
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the expense"
              required
            />
          </div>

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
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'income'>('expenses');
  const [timePeriod, setTimePeriod] = useState<'daily' | 'monthly' | 'yearly' | ''>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: expensesApi.getAll,
  });

  const { data: income, isLoading: incomeLoading } = useQuery({
    queryKey: ['income', timePeriod],
    queryFn: () => incomeApi.getAll(timePeriod),
  });

  const { data: financialSummary } = useQuery({
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

  const deleteIncomeMutation = useMutation({
    mutationFn: incomeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({
        title: 'Success',
        description: 'Income deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete income',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const handleDeleteIncome = (id: string) => {
    if (window.confirm('Are you sure you want to delete this income record?')) {
      deleteIncomeMutation.mutate(id);
    }
  };

  const totalExpenses = expenses?.reduce((sum: number, expense: Expense) => sum + expense.amount, 0) || 0;
  const totalIncome = income?.reduce((sum: number, incomeItem: Income) => sum + incomeItem.amount, 0) || 0;
  const netProfit = totalIncome - totalExpenses;

  const isLoading = expensesLoading || incomeLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading expenses...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Financial Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track income, expenses, and financial performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsAddIncomeModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => setIsAddExpenseModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Time Period Filter */}
        <div className="flex gap-2">
          <Button 
            variant={timePeriod === '' ? 'default' : 'outline'}
            onClick={() => setTimePeriod('')}
          >
            All Time
          </Button>
          <Button 
            variant={timePeriod === 'daily' ? 'default' : 'outline'}
            onClick={() => setTimePeriod('daily')}
          >
            Daily
          </Button>
          <Button 
            variant={timePeriod === 'monthly' ? 'default' : 'outline'}
            onClick={() => setTimePeriod('monthly')}
          >
            Monthly
          </Button>
          <Button 
            variant={timePeriod === 'yearly' ? 'default' : 'outline'}
            onClick={() => setTimePeriod('yearly')}
          >
            Yearly
          </Button>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">₹{(financialSummary?.totalIncome || totalIncome).toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-red-600">₹{(financialSummary?.totalExpenses || totalExpenses).toLocaleString()}</p>
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
                  <p className={`text-2xl font-bold ${(financialSummary?.netProfit || netProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(financialSummary?.netProfit || netProfit).toLocaleString()}
                  </p>
                </div>
                <DollarSign className={`h-8 w-8 ${(financialSummary?.netProfit || netProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Period</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {timePeriod ? timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1) : 'All Time'}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'expenses' ? 'default' : 'outline'}
            onClick={() => setActiveTab('expenses')}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Expenses ({expenses?.length || 0})
          </Button>
          <Button 
            variant={activeTab === 'income' ? 'default' : 'outline'}
            onClick={() => setActiveTab('income')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Income ({income?.length || 0})
          </Button>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {activeTab === 'expenses' ? (
            expenses?.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No expenses found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding your first expense record.
                  </p>
                  <Button onClick={() => setIsAddExpenseModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </CardContent>
              </Card>
            ) : (
              expenses?.map((expense: Expense) => (
                <Card key={expense.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{expense.category}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(expense.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">
                          ₹{expense.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">{expense.description}</p>
                    </div>

                    <div className="flex gap-2 pt-2">
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
                  </CardContent>
                </Card>
              ))
            )
          ) : (
            income?.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No income records found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding your first income record.
                  </p>
                  <Button onClick={() => setIsAddIncomeModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income
                  </Button>
                </CardContent>
              </Card>
            ) : (
              income?.map((incomeItem: Income) => (
                <Card key={incomeItem.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{incomeItem.source}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(incomeItem.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ₹{incomeItem.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">{incomeItem.description}</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteIncome(incomeItem.id)}
                        disabled={deleteIncomeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          )}
        </div>

        {/* Modals */}
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
        />
        
        <AddIncomeModal
          isOpen={isAddIncomeModalOpen}
          onClose={() => setIsAddIncomeModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}