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

  return (
    <div className="order-item">
      {/* 订单日期 */}
      <div className="order-date-row">
        <svg className="order-date-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="#2876c8" strokeWidth="1.5" fill="none"/>
        </svg>
        <span className="order-date-label">订票日期：</span>
        <span className="order-date-value">{order.order_date || order.departure_date || '2025-09-14'}</span>
      </div>

      {/* 订单主体信息 - 表格行 */}
      <div className="order-main-content">
        {/* 车次信息列 */}
        <div className="order-cell train-cell">
          <div className="train-route">
            <span className="train-from">{order.departure_station || '北京'}</span>
            <span className="train-arrow">→</span>
            <span className="train-to">{order.arrival_station || '上海'}</span>
            <span className="train-number">{order.train_no || 'D5'}</span>
          </div>
          <div className="train-datetime">
            {order.departure_date || '2025-09-14'}
            <span className="train-time">{order.departure_time ? ` ${order.departure_time}开` : ' 21:21 开'}</span>
          </div>
        </div>

        {/* 旅客信息列 */}
        <div className="order-cell passenger-cell">
          <div className="passenger-id-type">居民身份证</div>
        </div>

        {/* 席位信息列 */}
        <div className="order-cell seat-cell">
          <div className="seat-detail">
            {order.seat_info || order.seat_type || '一等座'}
            <br />
            {order.seat_number || '12车05号下铺'}
          </div>
        </div>

        {/* 票价列 */}
        <div className="order-cell price-cell">
          <div className="price-detail">
            <div className="ticket-type">成人票</div>
            <div className="price-amount">
              <span className="price-value">
                {order.total_price ? `${order.total_price.toFixed(1)}元` : '777.0元'}
              </span>
              {order.discount && (
                <span className="price-discount">{order.discount || '8折'}</span>
              )}
            </div>
          </div>
        </div>

        {/* 车票状态列 */}
        <div className="order-cell status-cell">
          <div className="status-value">{formatStatus(order.status || 'pending')}</div>
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

