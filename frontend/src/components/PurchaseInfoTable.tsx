import React from 'react';
import './PurchaseInfoTable.css';
import PurchaseInfoRow from './PurchaseInfoRow';

interface PurchaseInfoTableProps {
  purchaseInfo: any[];
  availableSeatTypes: any[];
  onSeatTypeChange: (index: number, seatType: string) => void;
  onTicketTypeChange: (index: number, ticketType: string) => void;
  fareInfo?: any;
}

/**
 * 购票信息填写表格组件
 */
const PurchaseInfoTable: React.FC<PurchaseInfoTableProps> = ({
  purchaseInfo,
  availableSeatTypes,
  onSeatTypeChange,
  onTicketTypeChange,
  fareInfo,
}) => {
  if (purchaseInfo.length === 0) {
    return (
      <div className="purchase-info-empty">
        请从上方乘客列表中选择乘车人
      </div>
    );
  }
  
  return (
    <div className="purchase-info-table">
      <div className="table-header">
        <div className="table-header-cell">序号</div>
        <div className="table-header-cell">票种</div>
        <div className="table-header-cell">席别</div>
        <div className="table-header-cell">姓名</div>
        <div className="table-header-cell">证件类型</div>
        <div className="table-header-cell">证件号码</div>
      </div>
      
      <div className="table-body">
        {purchaseInfo.map((info, index) => (
          <PurchaseInfoRow
            key={index}
            sequence={index + 1}
            passenger={info.passenger}
            ticketType={info.ticketType}
            seatType={info.seatType}
            availableSeatTypes={availableSeatTypes}
            onSeatTypeChange={(seatType) => onSeatTypeChange(index, seatType)}
            onTicketTypeChange={(ticketType) => onTicketTypeChange(index, ticketType)}
            fareInfo={fareInfo}
          />
        ))}
      </div>
    </div>
  );
};

export default PurchaseInfoTable;

