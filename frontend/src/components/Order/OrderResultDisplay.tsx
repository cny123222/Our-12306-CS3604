// 订单结果展示组件
import React from 'react';
import OrderItem from './OrderItem';
import './OrderResultDisplay.css';

interface OrderResultDisplayProps {
  orders: any[];
  onNavigateToTrainList: () => void;
  showEmptyState?: boolean;  // 是否显示空状态（只有未完成订单显示）
}

const OrderResultDisplay: React.FC<OrderResultDisplayProps> = ({
  orders,
  onNavigateToTrainList,
  showEmptyState = true
}) => {
  // 如果没有订单且需要显示空状态（仅未完成订单）
  if (orders.length === 0 && showEmptyState) {
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
          您没有对应的订单内容哦~
          <br />
          您可以通过
          <span className="link" onClick={onNavigateToTrainList}>车票预订</span>
          功能，来制定出行计划。
        </p>
      </div>
    );
  }

  // 其他情况：显示表头和订单列表（即使列表为空）
  return (
    <div className="order-result-display">
      {/* 表格表头 */}
      <div className="order-table">
        <div className="order-table-header">
          <div className="header-cell train-info-header">车次信息</div>
          <div className="header-cell passenger-info-header">旅客信息</div>
          <div className="header-cell seat-info-header">席位信息</div>
          <div className="header-cell price-header">票价</div>
          <div className="header-cell status-header">车票状态</div>
        </div>

        {/* 订单列表 */}
        <div className="order-table-body">
          {orders.map((order) => (
            <OrderItem key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderResultDisplay;

