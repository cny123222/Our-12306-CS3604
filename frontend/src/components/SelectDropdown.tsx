/**
 * SelectDropdown组件
 * 源文件：frontend/src/components/SelectDropdown.tsx
 * 测试文件：frontend/test/components/SelectDropdown.test.tsx
 * 
 * 说明：下拉选择框组件
 */

import React, { useState, useRef, useEffect } from 'react';
import './SelectDropdown.css';

interface SelectDropdownProps {
  options: string[];
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  testId?: string;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options,
  value,
  placeholder,
  onChange,
  disabled = false,
  testId = 'select-dropdown'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExpanded]);

  const handleToggle = (e: React.MouseEvent) => {
    if (!disabled) {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = (option: string) => {
    if (!disabled) {
      onChange(option);
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleToggle(e as any);
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className={`select-dropdown ${disabled ? 'disabled' : ''} ${isExpanded ? 'expanded' : ''}`}
      data-testid={testId}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      <div className="selected-value-display">
        {value || placeholder}
      </div>
      <input
        type="hidden"
        value={value || placeholder}
        readOnly
      />
      <span 
        data-testid="dropdown-arrow"
        className={`arrow ${isExpanded ? 'rotated' : ''}`}
      >
        ▼
      </span>
      {isExpanded && !disabled && options.length > 0 && (
        <div className="options-list">
          {options.map((option, index) => (
            <div
              key={index}
              className={`option ${option === value ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(option);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectDropdown;

