import React from 'react';
import './PurchaseInfoRow.css';
import SelectDropdown from './SelectDropdown';

interface PurchaseInfoRowProps {
  sequence: number;
  passenger: any;
  ticketType: string;
  seatType: string;
  availableSeatTypes: any[];
  onSeatTypeChange: (seatType: string) => void;
  onTicketTypeChange: (ticketType: string) => void;
}

/**
 * 购票信息行组件
 */
const PurchaseInfoRow: React.FC<PurchaseInfoRowProps> = ({
  sequence,
  passenger,
  ticketType,
  seatType,
  availableSeatTypes,
  onSeatTypeChange,
  onTicketTypeChange,
}) => {
  const ticketTypeOptions = [
    { value: 'adult', label: '成人票' },
    { value: 'student', label: '学生票' },
    { value: 'child', label: '儿童票' },
  ];
  
  const seatTypeOptions = availableSeatTypes.map(seat => ({
    value: seat.type,
    label: `${seat.type}（¥${seat.price}元）`
  }));
  
  // TODO: 证件号码脱敏显示
  const maskIdNumber = (idNumber: string) => {
    if (!idNumber || idNumber.length < 8) return idNumber;
    return idNumber.substring(0, 4) + '************' + idNumber.substring(idNumber.length - 4);
  };
  
  return (
    <div className="purchase-info-row">
      <div className="row-cell">{sequence}</div>
      <div className="row-cell">
        <SelectDropdown
          options={ticketTypeOptions}
          value={ticketType}
          onChange={onTicketTypeChange}
          placeholder="选择票种"
        />
      </div>
      <div className="row-cell">
        <SelectDropdown
          options={seatTypeOptions}
          value={seatType}
          onChange={onSeatTypeChange}
          placeholder="选择席别"
        />
      </div>
      <div className="row-cell readonly">{passenger.name}</div>
      <div className="row-cell readonly">{passenger.idCardType || '居民身份证'}</div>
      <div className="row-cell readonly">{maskIdNumber(passenger.idCardNumber)}</div>
    </div>
  );
};

export default PurchaseInfoRow;

