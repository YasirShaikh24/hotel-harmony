const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data storage
let rooms = [];
let bookings = [];
let invoices = [];
let expenses = [];
let income = [];

// Initialize rooms data (101-117)
const initializeRooms = () => {
  const roomTypes = [
    { type: 'Single AC', price: 3000 },
    { type: 'Single Non-AC', price: 2000 },
    { type: 'Double AC', price: 4500 },
    { type: 'Double Non-AC', price: 3500 }
  ];
  
  const statuses = ['available', 'occupied']; // Only available and occupied
  
  for (let i = 101; i <= 117; i++) { // Changed from 118 to 117
    const roomTypeData = roomTypes[Math.floor(Math.random() * roomTypes.length)];
    const status = i === 101 ? 'occupied' : (Math.random() > 0.7 ? 'occupied' : 'available'); // More available rooms
    
    rooms.push({
      id: uuidv4(),
      roomNumber: i.toString(),
      type: roomTypeData.type,
      price: roomTypeData.price,
      status,
      floor: Math.floor(i / 100),
      description: `${roomTypeData.type} room with modern amenities`
    });
  }
};

// Initialize data
initializeRooms();

// Add some sample income data
income.push(
  {
    id: uuidv4(),
    source: 'Room Booking',
    amount: 15000,
    description: 'Room 101 booking payment',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    source: 'Restaurant',
    amount: 2500,
    description: 'Restaurant services',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    createdAt: new Date().toISOString()
  }
);

// Routes

// Dashboard Stats
app.get('/api/dashboard/stats', (req, res) => {
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  
  // Calculate today's check-ins and check-outs from bookings
  const today = new Date().toISOString().split('T')[0];
  const todayCheckIns = bookings.filter(b => 
    b.checkIn === today && b.status === 'confirmed'
  ).length;
  const todayCheckOuts = bookings.filter(b => 
    b.checkOut === today && b.status === 'checked_in'
  ).length;
  
  res.json({
    totalRooms,
    availableRooms,
    occupiedRooms,
    todayCheckIns,
    todayCheckOuts,
  });
});

// Rooms Routes
app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

app.put('/api/rooms/:id', (req, res) => {
  const roomIndex = rooms.findIndex(r => r.id === req.params.id);
  if (roomIndex === -1) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  rooms[roomIndex] = { ...rooms[roomIndex], ...req.body };
  res.json(rooms[roomIndex]);
});

// Bookings Routes
app.get('/api/bookings', (req, res) => {
  const { status } = req.query;
  let filteredBookings = bookings;
  
  if (status === 'checkin') {
    filteredBookings = bookings.filter(b => b.status === 'confirmed');
  } else if (status === 'checkout') {
    filteredBookings = bookings.filter(b => b.status === 'checked_in');
  }
  
  res.json(filteredBookings);
});

app.post('/api/bookings', (req, res) => {
  const bookingData = req.body;
  
  // Get room information
  const room = rooms.find(r => r.roomNumber === bookingData.roomNumber);
  if (!room) {
    return res.status(400).json({ error: 'Room not found' });
  }
  
  // Check if room is available
  if (room.status !== 'available') {
    return res.status(400).json({ error: 'Room is not available' });
  }
  
  // Use provided total amount or calculate based on room type and days
  let totalAmount = bookingData.totalAmount;
  if (!totalAmount) {
    const checkInDate = new Date(bookingData.checkIn);
    const checkOutDate = new Date(bookingData.checkOut);
    const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    totalAmount = room.price * days;
  }
  
  const newBooking = {
    id: uuidv4(),
    ...bookingData,
    roomType: room.type,
    totalAmount,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
  
  bookings.push(newBooking);
  
  // Update room status to occupied when booking is confirmed
  room.status = 'occupied';
  
  // Create invoice automatically
  const invoice = {
    id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
    bookingId: newBooking.id,
    customerName: bookingData.customerName,
    customerEmail: bookingData.customerEmail,
    customerPhone: bookingData.customerPhone,
    roomNumber: bookingData.roomNumber,
    roomType: room.type,
    checkIn: bookingData.checkIn,
    checkOut: bookingData.checkOut,
    days: Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24)),
    roomCharges: totalAmount,
    additionalCharges: 0,
    cgst: totalAmount * 0.09,
    sgst: totalAmount * 0.09,
    total: totalAmount + (totalAmount * 0.18),
    paymentStatus: 'pending',
    invoiceDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  
  invoices.push(invoice);
  
  res.status(201).json(newBooking);
});

app.put('/api/bookings/:id', (req, res) => {
  const bookingIndex = bookings.findIndex(b => b.id === req.params.id);
  if (bookingIndex === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  const oldBooking = bookings[bookingIndex];
  const updatedData = req.body;
  
  // If room number is being changed, update room statuses
  if (updatedData.roomNumber && updatedData.roomNumber !== oldBooking.roomNumber) {
    // Make old room available
    const oldRoom = rooms.find(r => r.roomNumber === oldBooking.roomNumber);
    if (oldRoom) {
      oldRoom.status = 'available';
    }
    
    // Make new room occupied (if booking is confirmed or checked_in)
    const newRoom = rooms.find(r => r.roomNumber === updatedData.roomNumber);
    if (newRoom && (updatedData.status === 'confirmed' || updatedData.status === 'checked_in')) {
      newRoom.status = 'occupied';
      // Update room type in booking data
      updatedData.roomType = newRoom.type;
    }
  }
  
  // Update room status based on booking status changes
  const room = rooms.find(r => r.roomNumber === (updatedData.roomNumber || oldBooking.roomNumber));
  if (room) {
    if (updatedData.status === 'checked_in' && oldBooking.status !== 'checked_in') {
      room.status = 'occupied';
    } else if (updatedData.status === 'checked_out' && oldBooking.status === 'checked_in') {
      room.status = 'available';
    } else if (updatedData.status === 'cancelled') {
      room.status = 'available';
    }
  }
  
  const updatedBooking = { ...oldBooking, ...updatedData };
  bookings[bookingIndex] = updatedBooking;
  
  // Update corresponding invoice if it exists
  const invoiceIndex = invoices.findIndex(inv => inv.bookingId === updatedBooking.id);
  if (invoiceIndex !== -1) {
    const invoice = invoices[invoiceIndex];
    invoices[invoiceIndex] = {
      ...invoice,
      customerName: updatedBooking.customerName,
      customerEmail: updatedBooking.customerEmail,
      customerPhone: updatedBooking.customerPhone,
      roomNumber: updatedBooking.roomNumber,
      roomType: updatedBooking.roomType,
      checkIn: updatedBooking.checkIn,
      checkOut: updatedBooking.checkOut,
      days: Math.ceil((new Date(updatedBooking.checkOut) - new Date(updatedBooking.checkIn)) / (1000 * 60 * 60 * 24)),
      roomCharges: updatedBooking.totalAmount,
      cgst: updatedBooking.totalAmount * 0.09,
      sgst: updatedBooking.totalAmount * 0.09,
      total: updatedBooking.totalAmount + (updatedBooking.totalAmount * 0.18),
    };
  }
  
  res.json(updatedBooking);
});

// Invoices Routes
app.get('/api/invoices', (req, res) => {
  const { status } = req.query;
  let filteredInvoices = invoices;
  
  if (status) {
    filteredInvoices = invoices.filter(i => i.paymentStatus === status);
  }
  
  res.json(filteredInvoices);
});

app.get('/api/invoices/:id', (req, res) => {
  const invoice = invoices.find(i => i.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  res.json(invoice);
});

app.put('/api/invoices/:id', (req, res) => {
  const invoiceIndex = invoices.findIndex(i => i.id === req.params.id);
  if (invoiceIndex === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  invoices[invoiceIndex] = { ...invoices[invoiceIndex], ...req.body };
  res.json(invoices[invoiceIndex]);
});

// Generate PDF endpoint (mock)
app.post('/api/invoices/:id/pdf', (req, res) => {
  const invoice = invoices.find(i => i.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  const today = new Date().toISOString().split('T')[0];
  const filename = `${today}_Room${invoice.roomNumber}_${invoice.id}.pdf`;
  
  res.json({ 
    success: true, 
    pdfUrl: `http://localhost:${PORT}/api/invoices/${req.params.id}/download`,
    filename,
    message: 'PDF generated successfully' 
  });
});

// Download PDF endpoint (mock)
app.get('/api/invoices/:id/download', (req, res) => {
  const invoice = invoices.find(i => i.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  const today = new Date().toISOString().split('T')[0];
  const filename = `${today}_Room${invoice.roomNumber}_${invoice.id}.pdf`;
  
  // Mock PDF content with invoice details
  const pdfContent = `
HOTEL INVOICE - ${invoice.id}
Date: ${today}
Room: ${invoice.roomNumber} (${invoice.roomType})
Customer: ${invoice.customerName}
Phone: ${invoice.customerPhone}
Email: ${invoice.customerEmail}

Stay Details:
Check-in: ${invoice.checkIn}
Check-out: ${invoice.checkOut}
Duration: ${invoice.days} nights

Charges:
Room Charges: ₹${invoice.roomCharges}
Additional Charges: ₹${invoice.additionalCharges}
CGST (9%): ₹${invoice.cgst}
SGST (9%): ₹${invoice.sgst}
Total Amount: ₹${invoice.total}

Payment Status: ${invoice.paymentStatus.toUpperCase()}
  `;
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfContent);
});

// Share invoice via WhatsApp (direct send)
app.post('/api/invoices/:id/share', (req, res) => {
  const invoice = invoices.find(i => i.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  const message = `Dear ${invoice.customerName}, your hotel invoice ${invoice.id} for Room ${invoice.roomNumber} is ready. Total amount: ₹${invoice.total}. Check-in: ${invoice.checkIn}, Check-out: ${invoice.checkOut}. Thank you for staying with us!`;
  
  // In a real implementation, you would integrate with WhatsApp Business API
  // For now, we'll simulate the direct send
  res.json({ 
    success: true, 
    message: 'Invoice sent via WhatsApp successfully',
    sentTo: invoice.customerPhone,
    content: message
  });
});

// Expenses Routes
app.get('/api/expenses', (req, res) => {
  res.json(expenses);
});

app.post('/api/expenses', (req, res) => {
  const newExpense = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  expenses.push(newExpense);
  res.status(201).json(newExpense);
});

app.put('/api/expenses/:id', (req, res) => {
  const expenseIndex = expenses.findIndex(e => e.id === req.params.id);
  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  
  expenses[expenseIndex] = { ...expenses[expenseIndex], ...req.body };
  res.json(expenses[expenseIndex]);
});

app.delete('/api/expenses/:id', (req, res) => {
  const expenseIndex = expenses.findIndex(e => e.id === req.params.id);
  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  
  expenses.splice(expenseIndex, 1);
  res.json({ success: true, message: 'Expense deleted successfully' });
});

// Income Routes
app.get('/api/income', (req, res) => {
  const { period } = req.query; // daily, monthly, yearly
  let filteredIncome = income;
  
  if (period) {
    const now = new Date();
    filteredIncome = income.filter(item => {
      const itemDate = new Date(item.date);
      
      if (period === 'daily') {
        return itemDate.toDateString() === now.toDateString();
      } else if (period === 'monthly') {
        return itemDate.getMonth() === now.getMonth() && 
               itemDate.getFullYear() === now.getFullYear();
      } else if (period === 'yearly') {
        return itemDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }
  
  res.json(filteredIncome);
});

app.post('/api/income', (req, res) => {
  const newIncome = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  income.push(newIncome);
  res.status(201).json(newIncome);
});

app.put('/api/income/:id', (req, res) => {
  const incomeIndex = income.findIndex(i => i.id === req.params.id);
  if (incomeIndex === -1) {
    return res.status(404).json({ error: 'Income record not found' });
  }
  
  income[incomeIndex] = { ...income[incomeIndex], ...req.body };
  res.json(income[incomeIndex]);
});

app.delete('/api/income/:id', (req, res) => {
  const incomeIndex = income.findIndex(i => i.id === req.params.id);
  if (incomeIndex === -1) {
    return res.status(404).json({ error: 'Income record not found' });
  }
  
  income.splice(incomeIndex, 1);
  res.json({ success: true, message: 'Income record deleted successfully' });
});

// Financial summary endpoint
app.get('/api/financial-summary', (req, res) => {
  const { period } = req.query; // daily, monthly, yearly
  const now = new Date();
  
  let filteredIncome = income;
  let filteredExpenses = expenses;
  
  if (period) {
    filteredIncome = income.filter(item => {
      const itemDate = new Date(item.date);
      
      if (period === 'daily') {
        return itemDate.toDateString() === now.toDateString();
      } else if (period === 'monthly') {
        return itemDate.getMonth() === now.getMonth() && 
               itemDate.getFullYear() === now.getFullYear();
      } else if (period === 'yearly') {
        return itemDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
    
    filteredExpenses = expenses.filter(item => {
      const itemDate = new Date(item.date);
      
      if (period === 'daily') {
        return itemDate.toDateString() === now.toDateString();
      } else if (period === 'monthly') {
        return itemDate.getMonth() === now.getMonth() && 
               itemDate.getFullYear() === now.getFullYear();
      } else if (period === 'yearly') {
        return itemDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }
  
  const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  
  res.json({
    totalIncome,
    totalExpenses,
    netProfit,
    period: period || 'all'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Total rooms initialized: ${rooms.length} (101-117)`);
});