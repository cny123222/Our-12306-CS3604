// 订单项组件
import React from 'react';
import './OrderItem.css';

interface OrderItemProps {
  order: any;
  onViewDetails?: () => void;
  onCancelOrder?: () => void;
  onPayOrder?: () => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ 
  order, 
  onViewDetails, 
  onCancelOrder,
  onPayOrder 
}) => {
  // 格式化状态显示
  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '待支付',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  // 格式化座位信息
  const formatSeatInfo = (passenger: any, status: string) => {
    if (status === 'completed' && passenger.seat_number) {
      // 已完成订单且有座位号
      // 座位号格式可能是 "4-01" 或类似格式，需要转换为 "04车01号"
      const seatNo = passenger.seat_number;
      
      // 尝试解析座位号格式
      if (seatNo.includes('-')) {
        const parts = seatNo.split('-');
        if (parts.length === 2) {
          const carNum = parts[0].padStart(2, '0');  // 车厢号补零
          const seatNum = parts[1].padStart(2, '0'); // 座位号补零
          return `${carNum}车${seatNum}号`;
        }
      }
      
      // 如果格式不符合预期，直接返回原始值
      return seatNo;
    } else if (passenger.car_number) {
      // 有车厢号但没有座位号
      return `${passenger.car_number}车`;
    } else {
      // 没有分配座位
      return '待分配';
    }
  };

  // 获取乘客列表，如果没有则创建默认数据
  const passengers = order.passengers && order.passengers.length > 0 
    ? order.passengers 
    : [{
        passenger_name: order.passenger_name || '乘客',
        seat_type: order.seat_type || '二等座',
        seat_number: order.seat_number || null,
        car_number: order.car_number || null,
        ticket_type: order.ticket_type || '成人票'
      }];

  // 计算单价
  const singlePrice = order.total_price / passengers.length;

  return (
    <div className="order-item">
      {/* 订单日期 */}
      <div className="order-date-row">
        <svg className="order-date-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="#2876c8" strokeWidth="1.5" fill="none"/>
        </svg>
        <span className="order-date-label">订票日期：</span>
        <span className="order-date-value">{order.created_at ? order.created_at.split(' ')[0] : order.departure_date}</span>
      </div>

      {/* 订单主体信息 - 表格行 */}
      <div className="order-main-content">
        {/* 车次信息列（只显示一次）*/}
        <div className="order-cell train-cell">
          <div className="train-route">
            <span className="train-from">{order.departure_station}</span>
            <span className="train-arrow">→</span>
            <span className="train-to">{order.arrival_station}</span>
            <span className="train-number">{order.train_no}</span>
          </div>
          <div className="train-datetime">
            {order.departure_date}
            <span className="train-time">{order.departure_time ? ` ${order.departure_time}开` : ' 开'}</span>
          </div>
        </div>

        {/* 右侧乘客信息区域（分成多行）*/}
        <div className="passengers-info-area">
          {passengers.map((passenger: any, index: number) => (
            <div key={index} className="passenger-row">
              {/* 旅客信息列 */}
              <div className="order-cell passenger-cell">
                <div className="passenger-name">{passenger.passenger_name}</div>
                <div className="passenger-id-type">{passenger.id_card_type || '居民身份证'}</div>
              </div>

              {/* 席位信息列 */}
              <div className="order-cell seat-cell">
                <div className="seat-detail">
                  {passenger.seat_type}
                  <br />
                  {formatSeatInfo(passenger, order.status)}
                </div>
              </div>

              {/* 票价列 */}
              <div className="order-cell price-cell">
                <div className="price-detail">
                  <div className="ticket-type">{passenger.ticket_type || '成人票'}</div>
                  <div className="price-amount">
                    <span className="price-value">{singlePrice.toFixed(1)}元</span>
                    {order.discount && (
                      <span className="price-discount">{order.discount}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 车票状态列 */}
              <div className="order-cell status-cell">
                <div className="status-value">{formatStatus(order.status)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 订单操作按钮 */}
      {order.status === 'pending' && (
        <div className="order-actions">
          <button className="action-button cancel-button" onClick={onCancelOrder}>
            取消订单
          </button>
          <button className="action-button pay-button" onClick={onPayOrder}>
            去支付
          </button>
        </div>
      )}

      {onViewDetails && order.status !== 'pending' && (
        <div className="order-footer">
          <button className="view-details-button" onClick={onViewDetails}>
            查看详情
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderItem;

