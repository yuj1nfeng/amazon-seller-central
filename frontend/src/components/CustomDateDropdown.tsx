import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../utils/cn';

interface CustomDateDropdownProps {
  value?: string;
  onChange?: (value: string) => void;
}

// Helper functions to calculate dynamic dates
const getFormattedDate = (date: Date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const getTodayLabel = () => {
  const today = new Date();
  return `Today - ${getFormattedDate(today)}`;
};

const getYesterdayLabel = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `Yesterday - ${getFormattedDate(yesterday)}`;
};

const getWeekToDateLabel = () => {
  const today = new Date();
  return `Week to date - ${getFormattedDate(today)}`;
};

const getMonthToDateLabel = () => {
  const today = new Date();
  return `Month to date - ${getFormattedDate(today)}`;
};

const getYearToDateLabel = () => {
  const today = new Date();
  return `Year to date - ${getFormattedDate(today)}`;
};

const CustomDateDropdown: React.FC<CustomDateDropdownProps> = ({
  value = "today",
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate dynamic labels
  const todayLabel = getTodayLabel();
  const yesterdayLabel = getYesterdayLabel();
  const weekToDateLabel = getWeekToDateLabel();
  const monthToDateLabel = getMonthToDateLabel();
  const yearToDateLabel = getYearToDateLabel();

  const dateOptions = [
    { label: todayLabel, value: "today" },
    { label: yesterdayLabel, value: "yesterday" },
    { label: weekToDateLabel, value: "week" },
    { label: monthToDateLabel, value: "month" },
    { label: yearToDateLabel, value: "year" },
    { label: "Custom", value: "custom" }
  ];

  const handleOptionClick = (option: typeof dateOptions[0]) => {
    onChange?.(option.value);
    setIsOpen(false);
  };

  const selectedOption = dateOptions.find(opt => opt.value === value) || dateOptions[5];

  return (
    <div className="relative">
      <div
        className="flex items-center justify-between w-60 h-[29px] px-2 border border-[#a6a6a6] border-t-[#949494] rounded-[3px] bg-white cursor-pointer shadow-[0_1px_0_rgba(255,255,255,.5),0_1px_0_rgba(0,0,0,.07)_inset] bg-gradient-to-b from-[#f7f8fa] to-[#e7e9ec]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[13px] text-[#0F1111] truncate">{selectedOption.label}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 bg-white border border-[#888] shadow-lg mt-1 w-60">
          {dateOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => handleOptionClick(option)}
              className={cn(
                "px-3 py-2 text-[13px] cursor-pointer hover:bg-gray-100",
                option.value === "custom" && "border-t border-[#008296] bg-[#e6f7ff]"
              )}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDateDropdown;