import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value = "1/20/2026",
  onChange,
  placeholder = "选择日期"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0)); // January 2026
  const [selectedDate, setSelectedDate] = useState(value);

  // Update selectedDate when value prop changes
  React.useEffect(() => {
    setSelectedDate(value);
    // Also update currentMonth to show the correct month in calendar
    const [month, day, year] = value.split('/');
    setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
  }, [value]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDateClick = (day: number) => {
    const newDate = `${currentMonth.getMonth() + 1}/${day}/${currentMonth.getFullYear()}`;
    setSelectedDate(newDate);
    onChange?.(newDate);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="relative">
      <div
        className="flex items-center border border-[#888] bg-white h-[25px] px-1 cursor-pointer w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar size={12} className="text-[#0F1111] mr-1 flex-shrink-0" />
        <input
          type="text"
          className="border-none outline-none flex-grow text-[10px] text-[#0F1111] cursor-pointer bg-transparent"
          value={selectedDate}
          readOnly
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 bg-white border border-[#888] shadow-lg mt-1 w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <button 
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-medium text-lg">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button 
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {daysOfWeek.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => (
              <div key={index} className="aspect-square">
                {day && (
                  <button
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "w-full h-full flex items-center justify-center text-sm hover:bg-gray-100",
                      day === 20 && "bg-[#008296] text-white hover:bg-[#007185]"
                    )}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;