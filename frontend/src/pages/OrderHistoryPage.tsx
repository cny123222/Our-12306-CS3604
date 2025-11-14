/**
 * 历史订单页
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrderHistoryPage.css';
import TopNavigation from '../components/TopNavigation';
import BottomNavigation from '../components/BottomNavigation';
import SideMenu from '../components/PersonalInfo/SideMenu';

interface Order {
  id: number;
  trainNumber: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  seatType: string;
  passengerName: string;
  status: string;
  totalPrice: number;
}

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 设置默认日期范围
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    const start = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);

    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('/api/user/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          startDate,
          endDate,
          keyword: searchKeyword
        }
      });

      if (response.data) {
        setOrders(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToHome = () => {
    navigate('/');
  };

  const handleMenuClick = (section: string) => {
    if (section === 'view-personal-info') {
      navigate('/personal/info');
    } else if (section === 'phone-verification') {
      navigate('/personal/phone-verification');
    } else if (section === 'passenger-management') {
      navigate('/personal/passengers');
    }
  };

  const handleSearch = () => {
    fetchOrders();
  };

  const handleNavigateToTrainBooking = () => {
    navigate('/');
  };

  return (
    <div className="order-history-page">
      <TopNavigation onLogoClick={handleNavigateToHome} showWelcomeLogin={true} />

      <div className="breadcrumb">
        <span className="breadcrumb-text">当前位置：个人中心&gt;</span>
        <span className="breadcrumb-current">火车票订单</span>
      </div>

      <div className="main-content">
        <SideMenu currentSection="train-order" onMenuClick={handleMenuClick} />

        <div className="order-history-panel">
          {/* 订单类型标签 */}
          <div className="order-type-tabs">
            <div className="tab active">历史订单</div>
          </div>

          {/* 筛选区域 */}
          <div className="filter-area">
            <div className="filter-row">
              <label>乘车日期：</label>
              <input
                type="date"
                className="date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="date-separator">-</span>
              <input
                type="date"
                className="date-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="filter-row">
              <input
                type="text"
                className="keyword-input"
                placeholder="订单号/车次/姓名"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <button className="search-button" onClick={handleSearch}>
                查询
              </button>
            </div>
          </div>

          {/* 订单结果展示区 */}
          <div className="order-results">
            {isLoading ? (
              <div className="loading">加载中...</div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-text">
                  您没有对应的订单内容哦~<br />
                  您可以通过
                  <span className="link-text" onClick={handleNavigateToTrainBooking}>车票预订</span>
                  功能，来制定出行计划。
                </div>
              </div>
            ) : (
              <div className="order-list">
                {orders.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-header">
                      <span className="order-number">订单号：{order.id}</span>
                      <span className="order-status">{order.status}</span>
                    </div>
                    <div className="order-content">
                      <div className="train-info">
                        <span className="train-number">{order.trainNumber}</span>
                        <span className="station">{order.departureStation}</span>
                        <span className="arrow">→</span>
                        <span className="station">{order.arrivalStation}</span>
                      </div>
                      <div className="order-details">
                        <span>乘客：{order.passengerName}</span>
                        <span>席别：{order.seatType}</span>
                        <span>票价：¥{order.totalPrice}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 温馨提示区域 */}
          <div className="tips-area">
            <h4 className="tips-title">温馨提示</h4>
            <ol className="tips-list">
              <li>订单信息在本网站保存期限为30日。</li>
              <li>在12306.cn网站改签和退票，改签应不晚于票面日期当日24:00，变更到站不晚于开车前48小时，退票应不晚于开车前。</li>
              <li>在本网站办理退票，只能逐次单张办理。</li>
              <li>车票改签、变更到站均只能办理一次。已经改签或变更到站的车票不再办理改签；对已改签车票、团体票暂不提供"变更到站"服务。</li>
              <li>退票、改签、变更到站后，如有应退票款，按购票时所使用的在线支付工具相关规定，将在规定时间内退还至原在线支付工具账户，请及时查询。如有疑问，请致电12306人工客服查询。</li>
              <li>投保、退保或查看电子保单状态，请点击"我的保险"或"购/赠/退保险"。</li>
              <li>"除有效期有其他规定的车票外，车票当日当次有效。旅客自行中途上车、下车的，未乘区间的票款不予退还。"</li>
              <li>如因运力原因或其他不可控因素导致列车调度调整时，当前车型可能会发生变动。</li>
              <li>未尽事宜详见《国铁集团铁路旅客运输规程》《广深港高速铁路跨境旅客运输组织规则》《中老铁路跨境旅客联运组织规则》等有关规定和车站公告。</li>
            </ol>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default OrderHistoryPage;



