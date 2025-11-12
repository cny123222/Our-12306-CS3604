import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TrainListPage.css';
import TopNavigation from '../components/TopNavigation';
import MainNavigation from '../components/MainNavigation';
import TrainSearchBar from '../components/TrainSearchBar';
import TrainFilterPanel from '../components/TrainFilterPanel';
import TrainList from '../components/TrainList';
import BottomNavigation from '../components/BottomNavigation';

/**
 * 车次列表页主容器组件
 */
const TrainListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchParams, setSearchParams] = useState<any>({
    departureStation: location.state?.departureStation || '',
    arrivalStation: location.state?.arrivalStation || '',
    departureDate: location.state?.departureDate || new Date().toISOString().split('T')[0],
    isHighSpeed: location.state?.isHighSpeed || false
  });
  const [trains, setTrains] = useState<any[]>([]);
  const [filteredTrains, setFilteredTrains] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [queryTimestamp, setQueryTimestamp] = useState<Date>(new Date());
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // TODO: 实现从URL参数获取搜索条件
  useEffect(() => {
    // TODO: 获取查询参数并调用API
  }, []);

  // TODO: 实现5分钟过期检查
  useEffect(() => {
    // TODO: 定时检查查询时间是否超过5分钟
  }, [queryTimestamp]);

  // 实现导航功能
  const handleNavigateToHome = () => {
    navigate('/');
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  const handleNavigateToPersonalCenter = () => {
    if (isLoggedIn) {
      // TODO: navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const handleNavigateToOrderPage = (trainNo: string) => {
    // TODO: 跳转到订单页
    console.log('Navigate to order page for train:', trainNo);
  };

  // 实现筛选功能
  const handleFilterChange = (filters: any) => {
    // TODO: 根据筛选条件更新车次列表
    console.log('Filter changed:', filters);
  };

  return (
    <div className="train-list-page">
      <TopNavigation onLogoClick={handleNavigateToHome} />
      <MainNavigation
        isLoggedIn={isLoggedIn}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToPersonalCenter}
      />
      <div className="train-list-content">
        <TrainSearchBar
          initialDepartureStation={searchParams.departureStation || ''}
          initialArrivalStation={searchParams.arrivalStation || ''}
          initialDepartureDate={searchParams.departureDate || ''}
          onSearch={setSearchParams}
        />
        <TrainFilterPanel
          onFilterChange={handleFilterChange}
          departureStations={[]}
          arrivalStations={[]}
          seatTypes={[]}
        />
        {error && <div className="error-message">{error}</div>}
        {isLoading ? (
          <div className="loading">加载中...</div>
        ) : (
          <TrainList
            trains={filteredTrains}
            onReserve={handleNavigateToOrderPage}
            isLoggedIn={isLoggedIn}
          />
        )}
      </div>
      <BottomNavigation onFriendLinkClick={() => {}} />
    </div>
  );
};

export default TrainListPage;

