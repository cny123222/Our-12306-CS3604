import React from 'react';
import './PassengerCheckbox.css';

interface PassengerCheckboxProps {
  passenger: any;
  isChecked: boolean;
  onChange: (selected: boolean) => void;
}

/**
 * 乘客勾选框组件
 */
const PassengerCheckbox: React.FC<PassengerCheckboxProps> = ({
  passenger,
  isChecked,
  onChange,
}) => {
  return (
    <label className={`passenger-checkbox ${isChecked ? 'checked' : ''}`}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onChange(e.target.checked)}
        className="passenger-checkbox-input"
      />
      <span className="passenger-checkbox-label">
        {passenger.name}
        {passenger.idCardType && (
          <span className="passenger-id-type">（{passenger.idCardType}）</span>
        )}
      </span>
    </label>
  );
};

export default PassengerCheckbox;

