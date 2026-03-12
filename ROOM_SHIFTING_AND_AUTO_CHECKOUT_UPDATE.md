# Room Shifting and Auto-Checkout Update

## Overview
This update implements two major features for the hotel management system:

1. **Auto-Checkout**: Automatically makes rooms available when checkout date passes or when manually checked out
2. **Room Shifting**: Allows customers to move from one room to another during their stay with proper billing updates

## Features Implemented

### 1. Auto-Checkout Functionality

#### Manual Checkout
- When the "Check Out" button is pressed, the room immediately becomes available
- Booking status changes to 'checked_out'
- Room status changes to 'available'

#### Automatic Checkout (Date-based)
- Added `auto_checkout_expired_bookings()` function in database
- Automatically checks out bookings that have passed their checkout date
- Makes rooms available for new bookings
- Can be run manually or set up as a scheduled job

### 2. Room Shifting Functionality

#### New API Endpoints
- `bookingsApi.shiftRoom(bookingId, newRoomId)` - Shifts a customer to a new room
- `bookingsApi.getAvailableRooms(checkIn, checkOut, excludeBookingId)` - Gets available rooms for date range

#### Room Shifting Process
1. **Validation**: Checks if new room is available for the booking dates
2. **Room Status Update**: 
   - Old room becomes 'available'
   - New room becomes 'occupied' (if booking is checked_in)
3. **Billing Update**: Automatically adjusts invoice based on price difference
4. **History Tracking**: Logs room shifts in `room_shifts` table

#### UI Components
- **Shift Room Button**: Available for 'confirmed' and 'checked_in' bookings
- **Room Selection Modal**: Shows available rooms with pricing and details
- **Real-time Updates**: Automatically refreshes room and booking data

## Database Changes

### New Table: `room_shifts`
```sql
CREATE TABLE public.room_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    old_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    new_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    price_difference DECIMAL(10, 2) DEFAULT 0,
    shifted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    shift_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### New Function: `auto_checkout_expired_bookings()`
- Automatically processes expired bookings
- Updates room availability
- Can be scheduled to run daily

## Updated Files

### Backend (API)
- `src/services/api.ts`: Added room shifting and auto-checkout logic

### Frontend (UI)
- `src/pages/Bookings.tsx`: Added shift room modal and button

### Database
- `migrations/add_room_shifting_support.sql`: New migration file

## Usage Instructions

### For Staff (Admin/Receptionist)

#### Room Shifting
1. Go to Bookings page
2. Find the booking you want to shift
3. Click "Shift Room" button (available for confirmed/checked-in bookings)
4. Select new room from available options
5. Confirm the shift - billing will be automatically adjusted

#### Manual Checkout
1. Find the checked-in booking
2. Click "Check Out" button
3. Room becomes immediately available for new bookings

### Automatic Features
- Rooms automatically become available when checkout dates pass
- Price differences are automatically calculated and applied to invoices
- Room status updates happen in real-time

## Benefits

1. **Improved Customer Service**: Easy room changes for maintenance or customer preferences
2. **Automatic Operations**: No manual intervention needed for expired bookings
3. **Accurate Billing**: Automatic price adjustments for room changes
4. **Real-time Availability**: Immediate room status updates
5. **Audit Trail**: Complete history of room changes

## Technical Notes

- All room shifts are logged for audit purposes
- Price differences are automatically calculated and applied to invoices
- Room availability checks prevent double bookings
- Real-time UI updates using React Query
- Proper error handling and user feedback

## Future Enhancements

1. **Scheduled Auto-Checkout**: Set up cron job for daily auto-checkout
2. **Room Shift Notifications**: SMS/Email notifications for room changes
3. **Bulk Room Operations**: Shift multiple bookings at once
4. **Room Maintenance Mode**: Temporary room unavailability
5. **Advanced Reporting**: Room utilization and shift analytics