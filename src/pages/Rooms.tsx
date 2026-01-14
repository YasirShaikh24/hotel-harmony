import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BedDouble, Users, Edit, X } from 'lucide-react';
import { roomsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'occupied':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

interface Room {
  id: string;
  roomNumber: string;
  type: string;
  price: number;
  status: string;
  floor: number;
  description: string;
}

interface EditRoomModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
}

function EditRoomModal({ room, isOpen, onClose }: EditRoomModalProps) {
  const [formData, setFormData] = useState({
    type: room.type,
    price: room.price.toString(),
    status: room.status,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateRoomMutation = useMutation({
    mutationFn: (data: any) => roomsApi.update(room.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: 'Success',
        description: 'Room updated successfully',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update room',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRoomMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Room {room.roomNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Room Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single AC">Single AC</SelectItem>
                <SelectItem value="Single Non-AC">Single Non-AC</SelectItem>
                <SelectItem value="Double AC">Double AC</SelectItem>
                <SelectItem value="Double Non-AC">Double Non-AC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per Night (₹)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value="available"
                  checked={formData.status === 'available'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
                <span>Available</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value="occupied"
                  checked={formData.status === 'occupied'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
                <span>Occupied</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={updateRoomMutation.isPending} className="flex-1">
              {updateRoomMutation.isPending ? 'Updating...' : 'Update Room'}
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

export default function Rooms() {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  const totalRooms = rooms?.length || 0;
  const availableRooms = rooms?.filter((r: Room) => r.status === 'available').length || 0;
  const occupiedRooms = rooms?.filter((r: Room) => r.status === 'occupied').length || 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading rooms...</p>
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
              Room Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage hotel rooms and pricing (Rooms 101-117)
            </p>
          </div>
        </div>

        {/* Room Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
                  <p className="text-2xl font-bold">{totalRooms}</p>
                </div>
                <BedDouble className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-green-600">{availableRooms}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-green-600"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                  <p className="text-2xl font-bold text-red-600">{occupiedRooms}</p>
                </div>
                <Users className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms?.map((room: Room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
                  <Badge className={getStatusColor(room.status)}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{room.type}</span>
                  <span>•</span>
                  <span>Floor {room.floor}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">₹{room.price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">per night</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setEditingRoom(room)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Room Modal */}
        {editingRoom && (
          <EditRoomModal
            room={editingRoom}
            isOpen={!!editingRoom}
            onClose={() => setEditingRoom(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}