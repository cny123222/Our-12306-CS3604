// 订单列表展示面板组件
import React, { useState, useMemo } from 'react';
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
  const [activeTab, setActiveTab] = useState<'completed' | 'pending'>('completed');

  // 根据选中标签过滤订单
  const filteredOrders = useMemo(() => {
    return orders.filter(order => order.status === activeTab);
  }, [orders, activeTab]);

  return (
    <div className="order-list-panel">
      <div className="order-type-section">
        <div className="order-tabs">
          <button 
            className={`order-tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            已完成订单
          </button>
          <button 
            className={`order-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            未完成订单
          </button>
        </div>
      </div>

      <OrderSearchFilter onSearch={onSearch} />

      <OrderResultDisplay
        orders={filteredOrders}
        onNavigateToTrainList={onNavigateToTrainList}
      />

      <WarmTipsSection />
    </div>
  );
};

export default OrderListPanel;

