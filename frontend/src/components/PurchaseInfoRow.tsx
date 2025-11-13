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
  fareInfo?: any;
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
  fareInfo,
}) => {
  const ticketTypeOptions = [
    { value: '成人票', label: '成人票' }
  ];
  
  // 生成席别选项（显示席别和票价）
  const seatTypeOptions = availableSeatTypes.map(seatTypeName => {
    const price = fareInfo && fareInfo[seatTypeName] ? fareInfo[seatTypeName].price : '';
    return {
      value: seatTypeName,
      label: price ? `${seatTypeName}（¥${price}元）` : seatTypeName
    };
  });
  
  // 证件号码脱敏显示
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
      <div className="row-cell">
        <input type="text" value={passenger.name} readOnly className="readonly-input" />
      </div>
      <div className="row-cell">
        <input type="text" value={passenger.idCardType || '居民身份证'} readOnly className="readonly-input" />
      </div>
      <div className="row-cell">
        <input type="text" value={maskIdNumber(passenger.idCardNumber)} readOnly className="readonly-input" />
      </div>
    </div>
  );
};

export default PurchaseInfoRow;

