import React from 'react';
import './OrderInfoDisplay.css';

interface Passenger {
  sequence: number;
  name: string;
  idCardType: string;
  idCardNumber: string;
  ticketType: string;
  seatType: string;
  carNumber?: string;
  seatNumber?: string;
  price: number;
}

interface TrainInfo {
  trainNo: string;
  departureStation: string;
  arrivalStation: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
}

interface OrderInfoDisplayProps {
  trainInfo: TrainInfo;
  passengers: Passenger[];
  totalPrice: number;
}

/**
 * 订单信息显示组件
 */
const OrderInfoDisplay: React.FC<OrderInfoDisplayProps> = ({
  trainInfo,
  passengers,
  totalPrice
}) => {
  // 格式化日期显示
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} （${weekday}）`;
  };

  // 格式化身份证号码（中间打码）
  const maskIdCard = (idCard: string): string => {
    if (!idCard || idCard.length < 8) return idCard;
    const start = idCard.substring(0, 4);
    const end = idCard.substring(idCard.length - 4);
    const middle = '*'.repeat(idCard.length - 8);
    return `${start}${middle}${end}`;
  };

  // 格式化座位号显示
  const formatSeatDisplay = (carNumber?: string, seatNumber?: string): string => {
    if (seatNumber) {
      // 如果座位号格式是 "4-01"，只取座位部分
      if (seatNumber.includes('-')) {
        const parts = seatNumber.split('-');
        const seat = parts[1] || parts[0];
        return seat;
      }
      return seatNumber;
    }
    return '待分配';
  };

  return (
    <div className="order-info-display">
      {/* 订单信息标题 */}
      <div className="order-info-header">
        <h3 className="order-info-title">订单信息</h3>
      </div>

      {/* 车次信息 */}
      <div className="train-info-section">
        <div className="train-info-text">
          {formatDate(trainInfo.departureDate)} {trainInfo.trainNo} 次 {trainInfo.departureStation} 站（{trainInfo.departureTime} 开）— {trainInfo.arrivalStation} 站（{trainInfo.arrivalTime} 到）
        </div>
      </div>

      {/* 乘车人信息表格 */}
      <div className="passenger-table-container">
        <table className="passenger-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>姓名</th>
              <th>证件类型</th>
              <th>证件号码</th>
              <th>票种</th>
              <th>席别</th>
              <th>车厢号</th>
              <th>座位号</th>
              <th>票价</th>
            </tr>
          </thead>
          <tbody>
            {passengers.map((passenger, index) => (
              <tr key={index}>
                <td>{passenger.sequence}</td>
                <td>{passenger.name}</td>
                <td>{passenger.idCardType}</td>
                <td>{maskIdCard(passenger.idCardNumber)}</td>
                <td>{passenger.ticketType}</td>
                <td>{passenger.seatType}</td>
                <td>{passenger.carNumber ? `${String(passenger.carNumber).padStart(2, '0')}车` : '-'}</td>
                <td>{formatSeatDisplay(passenger.carNumber, passenger.seatNumber)}</td>
                <td>¥{passenger.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={8} className="total-label">合计</td>
              <td className="total-price">¥{totalPrice.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default OrderInfoDisplay;

