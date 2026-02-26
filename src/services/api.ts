import { supabase } from '@/integrations/supabase/client';

// Dashboard API
export const dashboardApi = {
  getStats: async (date?: string) => {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const [roomsRes, bookingsRes] = await Promise.all([
        supabase.from('rooms').select('status'),
        supabase.from('bookings').select('check_in, check_out, status')
      ]);

      if (roomsRes.error) {
        console.error('Rooms query error:', roomsRes.error);
        throw roomsRes.error;
      }
      if (bookingsRes.error) {
        console.error('Bookings query error:', bookingsRes.error);
        throw bookingsRes.error;
      }

      console.log('Rooms data:', roomsRes.data);
      console.log('Bookings data:', bookingsRes.data);

      const totalRooms = roomsRes.data?.length || 0;
      const availableRooms = roomsRes.data?.filter(r => r.status === 'available').length || 0;
      const occupiedRooms = roomsRes.data?.filter(r => r.status === 'occupied').length || 0;
      
      const todayCheckIns = bookingsRes.data?.filter(b => 
        b.check_in === targetDate && b.status === 'confirmed'
      ).length || 0;
      
      const todayCheckOuts = bookingsRes.data?.filter(b => 
        b.check_out === targetDate && b.status === 'checked_in'
      ).length || 0;

      const stats = {
        totalRooms,
        availableRooms,
        occupiedRooms,
        todayCheckIns,
        todayCheckOuts,
      };

      console.log('Dashboard stats:', stats);
      return stats;
    } catch (error) {
      console.error('Dashboard API error:', error);
      throw error;
    }
  },
};

// Rooms API
export const roomsApi = {
  getAll: async () => {
    console.log('Fetching rooms from Supabase...');
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number');
    
    console.log('Rooms response:', { data, error });
    
    if (error) {
      console.error('Rooms fetch error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('No rooms data returned from Supabase');
      return [];
    }
    
    // Map database enum types to display names
    const typeMap: Record<string, string> = {
      'single': 'Single AC',
      'double': 'Double AC',
      'deluxe': 'Deluxe',
      'suite': 'Suite',
      'presidential': 'Presidential'
    };
    
    const mappedRooms = data.map(room => ({
      id: room.id,
      roomNumber: room.room_number,
      type: typeMap[room.type] || room.type,
      price: parseFloat(room.price),
      status: room.status,
      floor: room.floor,
      description: room.description,
    }));
    
    console.log('Mapped rooms:', mappedRooms);
    return mappedRooms;
  },
  
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const typeMap: Record<string, string> = {
      'single': 'Single AC',
      'double': 'Double AC',
      'deluxe': 'Deluxe',
      'suite': 'Suite',
      'presidential': 'Presidential'
    };
    
    return {
      id: data.id,
      roomNumber: data.room_number,
      type: typeMap[data.type] || data.type,
      price: parseFloat(data.price),
      status: data.status,
      floor: data.floor,
      description: data.description,
    };
  },
  
  update: async (id: string, updateData: any) => {
    console.log('Updating room:', id, updateData);
    
    // Map display names back to database enum values
    const reverseTypeMap: Record<string, string> = {
      'Single AC': 'single',
      'Single Non-AC': 'single',
      'Double AC': 'double',
      'Double Non-AC': 'double',
      'Deluxe': 'deluxe',
      'Suite': 'suite',
      'Presidential': 'presidential'
    };
    
    const dbType = reverseTypeMap[updateData.type] || updateData.type.toLowerCase();
    
    console.log('Mapped type:', updateData.type, '->', dbType);
    
    const { data, error } = await supabase
      .from('rooms')
      .update({
        type: dbType,
        price: updateData.price,
        status: updateData.status,
      })
      .eq('id', id)
      .select()
      .single();
    
    console.log('Update response:', { data, error });
    
    if (error) {
      console.error('Room update error:', error);
      throw error;
    }
    
    const typeMap: Record<string, string> = {
      'single': 'Single AC',
      'double': 'Double AC',
      'deluxe': 'Deluxe',
      'suite': 'Suite',
      'presidential': 'Presidential'
    };
    
    return {
      id: data.id,
      roomNumber: data.room_number,
      type: typeMap[data.type] || data.type,
      price: parseFloat(data.price),
      status: data.status,
      floor: data.floor,
      description: data.description,
    };
  },
};

// Bookings API
// ================= BOOKINGS API =================
// ================= BOOKINGS API =================
export const bookingsApi = {

  // ================= GET ALL BOOKINGS =================
  getAll: async (status?: string) => {
    let query = supabase
      .from('bookings')
      .select(`
        id,
        customer_id,
        room_id,
        check_in,
        check_out,
        status,
        adults,
        children,
        special_requests,
        advance_amount,
        advance_payment_method,
        created_at,
        customer:customers(id, name, email, mobile),
        room:rooms(*)
      `)
      .order('created_at', { ascending: false });

    if (status === 'checkin') {
      query = query.eq('status', 'confirmed');
    } else if (status === 'checkout') {
      query = query.eq('status', 'checked_in');
    }

    const { data, error } = await query;
    if (error) throw error;

    const typeMap: Record<string, string> = {
      single: 'Single AC',
      double: 'Double AC',
      deluxe: 'Deluxe',
      suite: 'Suite',
      presidential: 'Presidential'
    };

    return data.map(booking => ({
      id: booking.id,
      customerName: booking.customer?.name,
      customerEmail: booking.customer?.email,
      customerPhone: booking.customer?.mobile,
      customerGstNumber: booking.customer?.customer_gst_number || '',
      roomNumber: booking.room?.room_number,
      roomType: typeMap[booking.room?.type] || booking.room?.type,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      status: booking.status,
      adults: booking.adults,
      children: booking.children,
      specialRequests: booking.special_requests,
      totalAmount: booking.room
        ? parseFloat(booking.room.price) *
          Math.ceil(
            (new Date(booking.check_out).getTime() -
              new Date(booking.check_in).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
      advanceAmount: parseFloat(booking.advance_amount || 0),
      advancePaymentMethod: booking.advance_payment_method,
      createdAt: booking.created_at,
    }));
  },

  // ================= CREATE BOOKING =================
  create: async (bookingData: any) => {

    // 1️⃣ Get room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_number', bookingData.roomNumber)
      .single();

    if (roomError || !room) throw new Error('Room not found');

    // 2️⃣ Overlap check
    const { data: existingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', room.id)
      .neq('status', 'cancelled');

    if (overlapError) throw overlapError;

    const newCheckIn = new Date(bookingData.checkIn);
    const newCheckOut = new Date(bookingData.checkOut);

    const hasOverlap = existingBookings.some((b: any) => {
      const existingCheckIn = new Date(b.check_in);
      const existingCheckOut = new Date(b.check_out);
      return newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
    });

    if (hasOverlap) {
      throw new Error('Room already booked for selected dates');
    }

    // 3️⃣ Create or Update Customer
    let customer;

    const { data: existingCustomer, error: findError } = await supabase
      .from('customers')
      .select('id, name, email, mobile, aadhar_encrypted, address, created_at')
      .eq('mobile', bookingData.customerPhone)
      .single();

    if (findError && findError.code !== 'PGRST116') throw findError;

    if (existingCustomer) {
      customer = existingCustomer;

      const updates: any = {};

      if (existingCustomer.name !== bookingData.customerName)
        updates.name = bookingData.customerName;

      if (existingCustomer.email !== bookingData.customerEmail)
        updates.email = bookingData.customerEmail;

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', existingCustomer.id);

        if (updateError) throw updateError;
      }

    } else {

      const insertCustomer: any = {
        name: bookingData.customerName,
        mobile: bookingData.customerPhone,
        email: bookingData.customerEmail,
      };

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert(insertCustomer)
        .select()
        .single();

      if (customerError) throw customerError;
      customer = newCustomer;
    }

    // 4️⃣ Create Booking (NO GST HERE ❌)
    const insertPayload = {
      customer_id: customer.id,
      room_id: room.id,
      check_in: bookingData.checkIn,
      check_out: bookingData.checkOut,
      status: 'confirmed',
      adults: bookingData.adults || 1,
      children: bookingData.children || 0,
      special_requests: bookingData.specialRequests || null,
      advance_amount: bookingData.advanceAmount || 0,
      advance_payment_method: bookingData.advancePaymentMethod || null,
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(insertPayload)
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 5️⃣ Create Invoice
    const days = Math.ceil(
      (new Date(bookingData.checkOut).getTime() -
       new Date(bookingData.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    const roomCharges = room.price * days;
    const cgst = roomCharges * 0.025;
    const sgst = roomCharges * 0.025;
    const total = roomCharges + cgst + sgst;

    await supabase.from('invoices').insert({
      booking_id: booking.id,
      room_charges: roomCharges,
      additional_charges: 0,
      cgst,
      sgst,
      total,
      payment_status: bookingData.advanceAmount > 0 ? 'partial' : 'pending',
      payment_method: bookingData.advancePaymentMethod || null,
    });

    return booking;
  },

  // ================= UPDATE BOOKING =================
  update: async (id: string, updateData: any) => {

    const { data: oldBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, customer_id, room_id, check_in, check_out, status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const updatePayload = {
      check_in: updateData.checkIn,
      check_out: updateData.checkOut,
      status: updateData.status,
      adults: updateData.adults,
      children: updateData.children,
      special_requests: updateData.specialRequests || null,
    };

    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Room Status Logic
    if (updateData.status === 'checked_in') {
      await supabase.from('rooms')
        .update({ status: 'occupied' })
        .eq('id', oldBooking.room_id);
    }

    if (updateData.status === 'checked_out' ||
        updateData.status === 'cancelled') {
      await supabase.from('rooms')
        .update({ status: 'available' })
        .eq('id', oldBooking.room_id);
    }

    return booking;
  },
};
// Invoices API
export const invoicesApi = {
  getAll: async (status?: string) => {
    let query = supabase
      .from('invoices')
      .select(`
        id,
        booking_id,
        room_charges,
        additional_charges,
        cgst,
        sgst,
        total,
        payment_status,
        payment_method,
        created_at,
        booking:bookings(
          id,
          customer_id,
          room_id,
          check_in,
          check_out,
          advance_amount,
          advance_payment_method,
          customer:customers(id, name, email, mobile),
          room:rooms(*)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('payment_status', status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    const typeMap: Record<string, string> = {
      'single': 'Single AC',
      'double': 'Double AC',
      'deluxe': 'Deluxe',
      'suite': 'Suite',
      'presidential': 'Presidential'
    };
    
    return data.map(invoice => ({
      id: invoice.id,
      bookingId: invoice.booking_id,
      customerName: invoice.booking?.customer?.name,
      customerEmail: invoice.booking?.customer?.email,
      customerPhone: invoice.booking?.customer?.mobile,
      // prefer gst stored on booking (added/updated at time of reservation), fall back to customer table
      customerGstNumber: invoice.booking?.customer_gst_number || invoice.booking?.customer?.gst_number || invoice.booking?.customer?.gstNumber || '',
      roomNumber: invoice.booking?.room?.room_number,
      roomType: typeMap[invoice.booking?.room?.type] || invoice.booking?.room?.type,
      checkIn: invoice.booking?.check_in,
      checkOut: invoice.booking?.check_out,
      days: Math.ceil((new Date(invoice.booking?.check_out).getTime() - new Date(invoice.booking?.check_in).getTime()) / (1000 * 60 * 60 * 24)),
      roomCharges: parseFloat(invoice.room_charges),
      additionalCharges: parseFloat(invoice.additional_charges || 0),
      cgst: parseFloat(invoice.cgst),
      sgst: parseFloat(invoice.sgst),
      total: parseFloat(invoice.total),
      advanceAmount: parseFloat(invoice.booking?.advance_amount || 0),
      advancePaymentMethod: invoice.booking?.advance_payment_method,
      paymentStatus: invoice.payment_status,
      paymentMethod: invoice.payment_method,
      invoiceDate: invoice.created_at.split('T')[0],
      createdAt: invoice.created_at,
    }));
  },
  
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        booking_id,
        room_charges,
        additional_charges,
        cgst,
        sgst,
        total,
        payment_status,
        payment_method,
        created_at,
        booking:bookings(
          id,
          customer_id,
          room_id,
          check_in,
          check_out,
          advance_amount,
          advance_payment_method,
          customer:customers(id, name, email, mobile),
          room:rooms(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const typeMap: Record<string, string> = {
      'single': 'Single AC',
      'double': 'Double AC',
      'deluxe': 'Deluxe',
      'suite': 'Suite',
      'presidential': 'Presidential'
    };
    
    return {
      id: data.id,
      bookingId: data.booking_id,
      customerName: data.booking?.customer?.name,
      customerEmail: data.booking?.customer?.email,
      customerPhone: data.booking?.customer?.mobile,
      // GST number coming from booking record first, then customer
      customerGstNumber: data.booking?.customer_gst_number || data.booking?.customer?.gst_number || data.booking?.customer?.gstNumber || '',
      roomNumber: data.booking?.room?.room_number,
      roomType: typeMap[data.booking?.room?.type] || data.booking?.room?.type,
      checkIn: data.booking?.check_in,
      checkOut: data.booking?.check_out,
      days: Math.ceil((new Date(data.booking?.check_out).getTime() - new Date(data.booking?.check_in).getTime()) / (1000 * 60 * 60 * 24)),
      roomCharges: parseFloat(data.room_charges),
      additionalCharges: parseFloat(data.additional_charges || 0),
      cgst: parseFloat(data.cgst),
      sgst: parseFloat(data.sgst),
      total: parseFloat(data.total),
      advanceAmount: parseFloat(data.booking?.advance_amount || 0),
      advancePaymentMethod: data.booking?.advance_payment_method,
      paymentStatus: data.payment_status,
      paymentMethod: data.payment_method,
      invoiceDate: data.created_at.split('T')[0],
      createdAt: data.created_at,
    };
  },
  
  update: async (id: string, updateData: any) => {
    // Get invoice with booking and room info
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        booking:bookings(
          id,
          check_out,
          room_id,
          status
        )
      `)
      .eq('id', id)
      .single();
    
    if (invoiceError) throw invoiceError;

    // Update invoice
    const { data, error } = await supabase
      .from('invoices')
      .update({
        payment_status: updateData.paymentStatus,
        payment_method: updateData.paymentMethod,
        additional_charges: updateData.additionalCharges,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    // If marking as paid, check if checkout date has passed
    if (updateData.paymentStatus === 'paid' && invoice.booking) {
      const checkoutDate = new Date(invoice.booking.check_out);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      checkoutDate.setHours(0, 0, 0, 0);

      // If checkout date is today or in the past, update room to available and booking to checked_out
      if (checkoutDate <= today) {
        // Update booking status to checked_out
        await supabase
          .from('bookings')
          .update({ status: 'checked_out' })
          .eq('id', invoice.booking.id);

        // Update room status to available
        await supabase
          .from('rooms')
          .update({ status: 'available' })
          .eq('id', invoice.booking.room_id);
      }
    }
    
    return data;
  },
  
  generatePdf: async (id: string) => {
    return { 
      success: true, 
      message: 'PDF generated successfully',
      filename: `invoice-${id}.pdf`
    };
  },
  
  downloadPdf: (id: string) => {
    return `#download-${id}`;
  },
  
  shareWhatsApp: async (id: string) => {
    const invoice = await invoicesApi.getById(id);
    const message = `Dear ${invoice.customerName}, your hotel invoice ${invoice.id} for Room ${invoice.roomNumber} is ready. Total amount: ₹${invoice.total}. Check-in: ${invoice.checkIn}, Check-out: ${invoice.checkOut}. Thank you!`;
    
    return { 
      success: true, 
      message: 'Invoice shared via WhatsApp',
      sentTo: invoice.customerPhone,
      content: message
    };
  },
};

// Expenses API
export const expensesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(expense => ({
      id: expense.id,
      category: expense.category,
      amount: parseFloat(expense.amount),
      description: expense.description,
      date: expense.date,
      createdAt: expense.created_at,
    }));
  },
  
  create: async (expenseData: any) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        category: expenseData.category,
        amount: expenseData.amount,
        description: expenseData.description,
        date: expenseData.date,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  update: async (id: string, updateData: any) => {
    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  delete: async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },
};

// Income API
export const incomeApi = {
  getAll: async (period?: string) => {
    let query = supabase
      .from('income')
      .select('*')
      .order('date', { ascending: false });
    
    if (period) {
      const now = new Date();
      if (period === 'daily') {
        const today = now.toISOString().split('T')[0];
        query = query.eq('date', today);
      } else if (period === 'monthly') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        query = query.gte('date', firstDay).lte('date', lastDay);
      } else if (period === 'yearly') {
        const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        query = query.gte('date', firstDay).lte('date', lastDay);
      }
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(income => ({
      id: income.id,
      amount: parseFloat(income.amount),
      description: income.description,
      source: income.description?.split(' - ')[0] || 'Other',
      date: income.date,
      createdAt: income.created_at,
    }));
  },
  
  create: async (incomeData: any) => {
    const { data, error } = await supabase
      .from('income')
      .insert({
        amount: incomeData.amount,
        description: incomeData.source ? `${incomeData.source} - ${incomeData.description}` : incomeData.description,
        date: incomeData.date,
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      source: incomeData.source,
    };
  },
  
  update: async (id: string, updateData: any) => {
    const { data, error } = await supabase
      .from('income')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  delete: async (id: string) => {
    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },
};

// Financial API
export const financialApi = {
  getSummary: async (period?: string) => {
    const incomeData = await incomeApi.getAll(period);
    const expensesData = await expensesApi.getAll();
    
    let filteredExpenses = expensesData;
    if (period) {
      const now = new Date();
      filteredExpenses = expensesData.filter(expense => {
        const expenseDate = new Date(expense.date);
        
        if (period === 'daily') {
          return expenseDate.toDateString() === now.toDateString();
        } else if (period === 'monthly') {
          return expenseDate.getMonth() === now.getMonth() && 
                 expenseDate.getFullYear() === now.getFullYear();
        } else if (period === 'yearly') {
          return expenseDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }
    
    const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    
    return {
      totalIncome,
      totalExpenses,
      netProfit,
      period: period || 'all'
    };
  },
};

// Customers API
export const customersApi = {
  getAll: async (searchQuery?: string) => {
    let query = supabase
      .from('customers')
      .select(`
        id,
        name,
        mobile,
        email,
        aadhar_encrypted,
        address,
        created_at,
        bookings(
          id,
          check_out,
          invoices(total)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,mobile.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(customer => {
      const bookings = customer.bookings || [];
      const totalStays = bookings.length;
      const totalRevenue = bookings.reduce((sum: number, booking: any) => {
        const invoiceTotal = booking.invoices?.[0]?.total || 0;
        return sum + parseFloat(invoiceTotal);
      }, 0);
      const lastStay = bookings.length > 0 
        ? bookings.reduce((latest: string, booking: any) => {
            return booking.check_out > latest ? booking.check_out : latest;
          }, bookings[0].check_out)
        : null;
      
      return {
        id: customer.id,
        name: customer.name,
        phone: customer.mobile,
        email: customer.email,
        aadhar: customer.aadhar_encrypted,
        address: customer.address,
        totalStays,
        totalRevenue,
        lastStay,
        createdAt: customer.created_at,
      };
    });
  },
  
  getById: async (id: string) => {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        mobile,
        email,
        aadhar_encrypted,
        address,
        created_at
      `)
      .eq('id', id)
      .single();
    
    if (customerError) throw customerError;
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(*),
        invoices(*)
      `)
      .eq('customer_id', id)
      .order('check_in', { ascending: false });
    
    if (bookingsError) throw bookingsError;
    
    const typeMap: Record<string, string> = {
      'single': 'Single AC',
      'double': 'Double AC',
      'deluxe': 'Deluxe',
      'suite': 'Suite',
      'presidential': 'Presidential'
    };
    
    const totalStays = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => {
      const invoiceTotal = booking.invoices?.[0]?.total || 0;
      return sum + parseFloat(invoiceTotal);
    }, 0);
    const lastStay = bookings.length > 0 ? bookings[0].check_out : null;
    
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.mobile,
      email: customer.email,
      aadhar: customer.aadhar_encrypted,
      address: customer.address,
      totalStays,
      totalRevenue,
      lastStay,
      createdAt: customer.created_at,
      bookings: bookings.map(booking => ({
        id: booking.id,
        roomNumber: booking.room?.room_number,
        roomType: typeMap[booking.room?.type] || booking.room?.type,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        status: booking.status,
        adults: booking.adults,
        children: booking.children,
        amount: booking.invoices?.[0]?.total ? parseFloat(booking.invoices[0].total) : 0,
      })),
    };
  },
};