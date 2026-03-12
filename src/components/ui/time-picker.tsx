import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface TimePickerProps {
  value: string; // Format: "2:00 PM"
  onChange: (time: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function TimePicker({ value, onChange, placeholder = "Select time", required = false, id }: TimePickerProps) {
  // Parse the current value
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: '12', minute: '00', period: 'PM' };
    
    const [time, period] = timeStr.split(' ');
    const [hour, minute] = time.split(':');
    
    return {
      hour: hour || '12',
      minute: minute || '00',
      period: period || 'PM'
    };
  };

  const { hour, minute, period } = parseTime(value);

  const updateTime = (newHour?: string, newMinute?: string, newPeriod?: string) => {
    const finalHour = newHour || hour;
    const finalMinute = newMinute || minute;
    const finalPeriod = newPeriod || period;
    
    const timeString = `${finalHour}:${finalMinute} ${finalPeriod}`;
    onChange(timeString);
  };

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const hourNum = i + 1;
    return hourNum.toString();
  });

  // Generate minute options (00, 15, 30, 45)
  const minuteOptions = ['00', '15', '30', '45'];

  return (
    <div className="flex gap-2 items-center" id={id}>
      {/* Hour Select */}
      <Select value={hour} onValueChange={(newHour) => updateTime(newHour, undefined, undefined)}>
        <SelectTrigger className="w-16">
          <SelectValue placeholder="12" />
        </SelectTrigger>
        <SelectContent>
          {hourOptions.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">:</span>

      {/* Minute Select */}
      <Select value={minute} onValueChange={(newMinute) => updateTime(undefined, newMinute, undefined)}>
        <SelectTrigger className="w-16">
          <SelectValue placeholder="00" />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* AM/PM Select */}
      <Select value={period} onValueChange={(newPeriod) => updateTime(undefined, undefined, newPeriod)}>
        <SelectTrigger className="w-16">
          <SelectValue placeholder="PM" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}