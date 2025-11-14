// 订单列表展示面板组件
import React from 'react';
import OrderSearchFilter from './OrderSearchFilter';
import OrderResultDisplay from './OrderResultDisplay';
import WarmTipsSection from '../WarmTipsSection';
import './OrderListPanel.css';

interface OrderListPanelProps {
  orders: any[];
  onSearch: (startDate: string, endDate: string, keyword: string) => void;
  onNavigateToTrainList: () => void;
}

const OrderListPanel: React.FC<OrderListPanelProps> = ({
  orders,
  onSearch,
  onNavigateToTrainList
}) => {
  return (
    <div className="order-list-panel">
      <div className="order-type-section">
        <h3 className="order-type-title">历史订单</h3>
      </div>

      <OrderSearchFilter onSearch={onSearch} />

      <OrderResultDisplay
        orders={orders}
        onNavigateToTrainList={onNavigateToTrainList}
      />

      <WarmTipsSection />
    </div>
  );
};

export default OrderListPanel;

