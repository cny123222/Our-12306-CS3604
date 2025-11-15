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
  const [activeTab, setActiveTab] = useState<'pending' | 'unpaid' | 'history'>('unpaid');

  // 根据选中标签过滤订单
  const filteredOrders = useMemo(() => {
    if (activeTab === 'pending') {
      // 未完成订单：状态为 pending 且未支付
      return orders.filter(order => order.status === 'pending' && !order.paid);
    } else if (activeTab === 'unpaid') {
      // 未出行订单：状态为 pending 但已创建订单
      return orders.filter(order => order.status === 'pending');
    } else if (activeTab === 'history') {
      // 历史订单：状态为 completed 或 cancelled
      return orders.filter(order => order.status === 'completed' || order.status === 'cancelled');
    }
    return [];
  }, [orders, activeTab]);

  // 不同标签的温馨提示内容
  const getTipsForTab = () => {
    if (activeTab === 'pending') {
      return [
        '席位已锁定，请在指定时间内完成网上支付。',
        '逾期未支付，系统将取消本次交易。',
        '在完成支付或取消本订单之前，您将无法购买其他车票。',
        '未尽事宜详见《国铁集团铁路旅客运输规程》《广深港高速铁路跨境旅客运输组织规则》《中老铁路跨境旅客联运组织规则》等有关规定和车站公告。'
      ];
    } else {
      return [
        '订单信息保存期限为30日。',
        '在12306.cn网站改签和退票，改签应不晚于票面日期当日24:00，变更到站不晚于开车前48小时，退票应不晚于开车前。',
        '在本网站办理退票，只能逐次单张办理。',
        '车票改签、变更到站均只能办理一次。已经改签或变更到站的车票不再办理改签；对已改签车票、团体票暂不提供"变更到站"服务。',
        '退票、改签、变更到站后，如有应退票款，按购票时所使用的在线支付工具相关规定，将在规定时间内退还至原在线支付工具账户，请及时查询。如有疑问，请致电12306人工客服查询。',
        '投保、退保或查看电子保单状态，请点击"我的保险"或"购/赠/退保险"。',
        '"除有效期有其他规定的车票外，车票当日当次有效。旅客自行中途上车、下车的，未乘区间的票款不予退还。"',
        '如因运力原因或其他不可控因素导致列车调度调整时，当前车型可能会发生变动。',
        '未尽事宜详见《国铁集团铁路旅客运输规程》《广深港高速铁路跨境旅客运输组织规则》《中老铁路跨境旅客联运组织规则》等有关规定和车站公告。'
      ];
    }
  };

  return (
    <div className="order-list-panel">
      <div className="order-type-section">
        <div className="order-tabs">
          <button 
            className={`order-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            未完成订单
          </button>
          <button 
            className={`order-tab ${activeTab === 'unpaid' ? 'active' : ''}`}
            onClick={() => setActiveTab('unpaid')}
          >
            未出行订单
          </button>
          <button 
            className={`order-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            历史订单
          </button>
        </div>
      </div>

      {/* 未出行订单和历史订单都显示搜索筛选 */}
      {(activeTab === 'unpaid' || activeTab === 'history') && (
        <OrderSearchFilter 
          onSearch={onSearch} 
          variant={activeTab === 'history' ? 'history' : 'unpaid'} 
        />
      )}

      {/* 显示订单结果 */}
      <OrderResultDisplay
        orders={filteredOrders}
        onNavigateToTrainList={onNavigateToTrainList}
        showEmptyState={activeTab === 'pending'}  // 只有未完成订单显示空状态
      />

      {/* 所有标签都显示温馨提示 */}
      <WarmTipsSection tips={getTipsForTab()} variant="default" />
    </div>
  );
};

export default OrderListPanel;

