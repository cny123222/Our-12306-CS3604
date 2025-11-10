/**
 * SelectDropdown组件
 * 源文件：frontend/src/components/SelectDropdown.tsx
 * 测试文件：frontend/test/components/SelectDropdown.test.tsx
 * 
 * 说明：这是代码骨架，仅用于让测试可执行且失败
 */

import React, { useState } from 'react';

interface SelectDropdownProps {
  options: string[];
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options,
  value,
  placeholder,
  onChange,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    if (!disabled) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = (option: string) => {
    if (!disabled) {
      onChange(option);
      setIsExpanded(false);
    }
  };

  return (
    <div 
      className={`select-dropdown ${disabled ? 'disabled' : ''}`}
      data-testid="select-dropdown"
      onClick={handleToggle}
    >
      <div className="selected-value">
        {value || placeholder}
      </div>
      <span 
        data-testid="dropdown-arrow"
        className="arrow"
      >
        ▼
      </span>
      {isExpanded && !disabled && (
        <div className="options-list">
          {options.map((option, index) => (
            <div
              key={index}
              className="option"
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

