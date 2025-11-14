// 订单结果展示组件
import React from 'react';
import OrderItem from './OrderItem';
import './OrderResultDisplay.css';

interface OrderResultDisplayProps {
  orders: any[];
  onNavigateToTrainList: () => void;
}

const OrderResultDisplay: React.FC<OrderResultDisplayProps> = ({
  orders,
  onNavigateToTrainList
}) => {
  if (orders.length === 0) {
    return (
      <div className="order-result-display empty">
        <div className="empty-icon">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <rect x="20" y="30" width="80" height="60" rx="4" stroke="#2196f3" strokeWidth="2" fill="none"/>
            <circle cx="50" cy="65" r="15" stroke="#2196f3" strokeWidth="2" fill="none"/>
            <line x1="62" y1="76" x2="75" y2="89" stroke="#2196f3" strokeWidth="2"/>
            <line x1="30" y1="45" x2="70" y2="45" stroke="#2196f3" strokeWidth="2"/>
            <line x1="30" y1="55" x2="55" y2="55" stroke="#2196f3" strokeWidth="2"/>
          </svg>
        </div>
        <p className="empty-message">
          您没有对应的订单内容哦~您可以通过
          <span className="link" onClick={onNavigateToTrainList}>车票预订</span>
          功能，来制定出行计划。
        </p>
      </div>
    );
  }

  return (
    <div className="order-result-display">
      {orders.map((order) => (
        <OrderItem key={order.id} order={order} />
      ))}
    </div>
  );
};

export default OrderResultDisplay;

