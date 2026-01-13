import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats } from '@/types/hotel';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date();
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
      const yearStart = format(startOfYear(today), 'yyyy-MM-dd');
      const yearEnd = format(endOfYear(today), 'yyyy-MM-dd');
      const todayStr = format(today, 'yyyy-MM-dd');

      // Fetch rooms
      const { data: rooms } = await supabase.from('rooms').select('status');
      
      const totalRooms = rooms?.length || 0;
      const availableRooms = rooms?.filter(r => r.status === 'available').length || 0;
      const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;

      // Fetch today's bookings
      const { data: todayCheckIns } = await supabase
        .from('bookings')
        .select('id')
        .eq('check_in', todayStr);

      const { data: todayCheckOuts } = await supabase
        .from('bookings')
        .select('id')
        .eq('check_out', todayStr);

      // Fetch monthly income
      const { data: monthlyIncomeData } = await supabase
        .from('income')
        .select('amount')
        .gte('date', monthStart)
        .lte('date', monthEnd);

      const monthlyIncome = monthlyIncomeData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      // Fetch yearly income
      const { data: yearlyIncomeData } = await supabase
        .from('income')
        .select('amount')
        .gte('date', yearStart)
        .lte('date', yearEnd);

      const yearlyIncome = yearlyIncomeData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      // Fetch total expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', yearStart)
        .lte('date', yearEnd);

      const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const netProfit = yearlyIncome - totalExpenses;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      return {
        totalRooms,
        availableRooms,
        occupiedRooms,
        todayCheckIns: todayCheckIns?.length || 0,
        todayCheckOuts: todayCheckOuts?.length || 0,
        monthlyIncome,
        yearlyIncome,
        totalExpenses,
        netProfit,
        occupancyRate,
      };
    },
  });
}

export function useMonthlyIncomeChart() {
  return useQuery({
    queryKey: ['monthly-income-chart'],
    queryFn: async () => {
      const today = new Date();
      const yearStart = format(startOfYear(today), 'yyyy-MM-dd');
      const yearEnd = format(endOfYear(today), 'yyyy-MM-dd');

      const { data } = await supabase
        .from('income')
        .select('amount, date')
        .gte('date', yearStart)
        .lte('date', yearEnd)
        .order('date', { ascending: true });

      // Group by month
      const monthlyData: { [key: string]: number } = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      months.forEach(month => {
        monthlyData[month] = 0;
      });

      data?.forEach(item => {
        const date = new Date(item.date);
        const month = months[date.getMonth()];
        monthlyData[month] += Number(item.amount);
      });

      return months.map(month => ({
        month,
        income: monthlyData[month],
      }));
    },
  });
}

export function useRoomOccupancyChart() {
  return useQuery({
    queryKey: ['room-occupancy-chart'],
    queryFn: async () => {
      const { data: rooms } = await supabase.from('rooms').select('status');

      const statusCounts: { [key: string]: number } = {
        available: 0,
        occupied: 0,
        maintenance: 0,
        cleaning: 0,
      };

      rooms?.forEach(room => {
        if (statusCounts.hasOwnProperty(room.status)) {
          statusCounts[room.status]++;
        }
      });

      return Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
    },
  });
}

export function useExpenseVsIncomeChart() {
  return useQuery({
    queryKey: ['expense-vs-income-chart'],
    queryFn: async () => {
      const today = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yearStart = format(startOfYear(today), 'yyyy-MM-dd');
      const yearEnd = format(endOfYear(today), 'yyyy-MM-dd');

      const { data: incomeData } = await supabase
        .from('income')
        .select('amount, date')
        .gte('date', yearStart)
        .lte('date', yearEnd);

      const { data: expenseData } = await supabase
        .from('expenses')
        .select('amount, date')
        .gte('date', yearStart)
        .lte('date', yearEnd);

      const monthlyIncome: { [key: string]: number } = {};
      const monthlyExpense: { [key: string]: number } = {};

      months.forEach(month => {
        monthlyIncome[month] = 0;
        monthlyExpense[month] = 0;
      });

      incomeData?.forEach(item => {
        const month = months[new Date(item.date).getMonth()];
        monthlyIncome[month] += Number(item.amount);
      });

      expenseData?.forEach(item => {
        const month = months[new Date(item.date).getMonth()];
        monthlyExpense[month] += Number(item.amount);
      });

      return months.map(month => ({
        month,
        income: monthlyIncome[month],
        expense: monthlyExpense[month],
      }));
    },
  });
}
