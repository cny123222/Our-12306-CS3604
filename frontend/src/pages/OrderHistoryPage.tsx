// 历史订单页
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavigation from '../components/TopNavigation';
import SideMenu from '../components/SideMenu';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import BottomNavigation from '../components/BottomNavigation';
import OrderListPanel from '../components/Order/OrderListPanel';
import './OrderHistoryPage.css';

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token') || 'valid-test-token';
      const response = await fetch('/api/user/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setFilteredOrders(data.orders || []);
      }
    } catch (err) {
      setError('获取订单列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (start: string, end: string, kw: string) => {
    setStartDate(start);
    setEndDate(end);
    setKeyword(kw);

    if (!start && !end && !kw) {
      setFilteredOrders(orders);
      return;
    }

    try {
      const token = localStorage.getItem('token') || 'valid-test-token';
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      if (kw) params.append('keyword', kw);

      const response = await fetch(`/api/user/orders/search?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFilteredOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleMenuClick = (section: string) => {
    switch (section) {
      case 'train-orders':
        // 已在当前页面
        break;
      case 'personal-info':
        navigate('/personal-info');
        break;
      case 'phone-verification':
        navigate('/phone-verification');
        break;
      case 'passengers':
        navigate('/passengers');
        break;
    }
  };

  return (
    <div className="order-history-page">
      <TopNavigation onLogoClick={() => navigate('/')} />

      <div className="main-content">
        <SideMenu currentSection="train-orders" onMenuClick={handleMenuClick} />

        <div className="content-area">
          <BreadcrumbNavigation
            path={['个人中心']}
            currentPage="火车票订单"
          />

          <OrderListPanel
            orders={filteredOrders}
            onSearch={handleSearch}
            onNavigateToTrainList={() => navigate('/trains')}
          />
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default OrderHistoryPage;

