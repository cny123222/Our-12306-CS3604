// 订单项组件
import React from 'react';
import './OrderItem.css';

interface OrderItemProps {
  order: any;
  onViewDetails?: () => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, onViewDetails }) => {
  // 格式化状态显示
  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '待支付',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="order-item">
      <div className="order-header">
        <div className="order-info">
          <span className="order-label">订单号：</span>
          <span className="order-value">{order.order_id}</span>
        </div>
        <div className="order-status">{formatStatus(order.status || 'completed')}</div>
      </div>

      <div className="order-body">
        <div className="train-info">
          <div className="train-number">{order.train_no || '--'}</div>
          <div className="route-info">
            <span className="departure">{order.departure_station || '--'}</span>
            <span className="arrow">→</span>
            <span className="arrival">{order.arrival_station || '--'}</span>
          </div>
          <div className="date-info">
            {order.departure_date || '--'}
            {order.departure_time && ` ${order.departure_time}`}
            {order.arrival_time && ` - ${order.arrival_time}`}
          </div>
        </div>

        <div className="passenger-info">
          <div className="passenger-label">乘客：</div>
          <div className="passenger-list">
            {order.passenger_name || '未知'}
          </div>
        </div>

        {order.seat_info && (
          <div className="seat-info-display">
            <div className="seat-label">席位：</div>
            <div className="seat-value">{order.seat_info}</div>
          </div>
        )}

        <div className="price-info">
          <div className="price-label">票价：</div>
          <div className="price-value">¥{order.total_price ? order.total_price.toFixed(2) : '0.00'}</div>
        </div>
      </div>

      {onViewDetails && (
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

