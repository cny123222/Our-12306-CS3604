// 订单项组件
import React from 'react';
import './OrderItem.css';

interface OrderItemProps {
  order: any;
  onViewDetails?: () => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, onViewDetails }) => {
  return (
    <div className="order-item">
      <div className="order-header">
        <div className="order-info">
          <span className="order-label">订单号：</span>
          <span className="order-value">{order.order_id}</span>
        </div>
        <div className="order-status">{order.status || '已完成'}</div>
      </div>

      <div className="order-body">
        <div className="train-info">
          <div className="train-number">{order.train_no}</div>
          <div className="route-info">
            <span className="departure">{order.departure_station}</span>
            <span className="arrow">→</span>
            <span className="arrival">{order.arrival_station}</span>
          </div>
          <div className="date-info">{order.departure_date}</div>
        </div>

        <div className="passenger-info">
          <div className="passenger-label">乘客：</div>
          <div className="passenger-list">
            {order.passenger_name || '张三'}
          </div>
        </div>

        <div className="price-info">
          <div className="price-label">票价：</div>
          <div className="price-value">¥{order.total_price || '0.00'}</div>
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

