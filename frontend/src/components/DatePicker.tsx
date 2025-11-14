import React, { useState } from 'react';
import './DatePicker.css';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate: string;
  maxDate: string;
  disabled?: boolean;
}

/**
 * 日期选择器组件
 * 骨架实现：仅包含组件结构，不实现真实逻辑
 */
const DatePicker: React.FC<DatePickerProps> = ({ value, onChange: _onChange, minDate: _minDate, maxDate: _maxDate, disabled = false }) => {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <div className="date-picker">
      <input
        type="text"
        value={value}
        readOnly
        disabled={disabled}
        placeholder="返程日"
        onClick={() => !disabled && setShowCalendar(!showCalendar)}
        className={`date-input ${disabled ? 'disabled' : ''}`}
      />
      {/* 日历图标 */}
      <svg className="calendar-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      {showCalendar && !disabled && (
        <div className="calendar-dropdown">
          {/* TODO: 实现日历展示 */}
          <div className="calendar-placeholder">日历组件待实现</div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;

