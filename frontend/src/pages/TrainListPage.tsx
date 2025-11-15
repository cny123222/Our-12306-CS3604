import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TrainListPage.css';
import TrainListTopBar from '../components/TrainListTopBar';
import MainNavigation from '../components/MainNavigation';
import TrainSearchBar from '../components/TrainSearchBar';
import TrainFilterPanel from '../components/TrainFilterPanel';
import TrainList from '../components/TrainList';
import BottomNavigation from '../components/BottomNavigation';
import { searchTrains } from '../services/trainService';

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
  const [filterOptions, setFilterOptions] = useState<any>({
    departureStations: [],
    arrivalStations: [],
    seatTypes: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [queryTimestamp, setQueryTimestamp] = useState<Date>(new Date());
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('authToken');
      setIsLoggedIn(!!token);
    };
    
    checkLoginStatus();
    
    // 监听storage事件，当其他标签页登录/登出时同步状态
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  // 查询车次
  const fetchTrains = async (params: any) => {
    console.log('fetchTrains called with params:', params);
    
    if (!params.departureStation || !params.arrivalStation) {
      console.log('Missing required params, skipping fetch');
      return;
    }

    setIsLoading(true);
    setError('');
    console.log('Loading started...');

    try {
      // 构建车次类型筛选
      const trainTypes = params.isHighSpeed ? ['G', 'C', 'D'] : [];
      console.log('Train types filter:', trainTypes);

      // 搜索车次
      console.log('Calling searchTrains API...');
      const result = await searchTrains(
        params.departureStation,
        params.arrivalStation,
        params.departureDate,
        trainTypes
      );

      console.log('Search result:', result);

      if (!result.success) {
        throw new Error(result.error || '查询失败');
      }

      console.log('Found trains:', result.trains.length);
      setTrains(result.trains);
      setFilteredTrains(result.trains);
      setQueryTimestamp(new Date());

      // 从当前车次列表中提取筛选选项（根据需求文档）
      console.log('Extracting filter options from current train list...');
      const depStations = [...new Set(result.trains.map((t: any) => t.departureStation))];
      const arrStations = [...new Set(result.trains.map((t: any) => t.arrivalStation))];
      
      // 提取所有席别类型
      const seatTypesSet = new Set<string>();
      result.trains.forEach((train: any) => {
        if (train.availableSeats) {
          Object.keys(train.availableSeats).forEach(seatType => {
            seatTypesSet.add(seatType);
          });
        }
      });
      
      setFilterOptions({
        departureStations: depStations,
        arrivalStations: arrStations,
        seatTypes: Array.from(seatTypesSet)
      });
      
      console.log('Filter options:', {
        departureStations: depStations,
        arrivalStations: arrStations,
        seatTypes: Array.from(seatTypesSet)
      });

      setIsLoading(false);
      console.log('Loading complete!');
    } catch (error: any) {
      console.error('查询车次失败:', error);
      setError(error.message || '查询失败，请稍后重试');
      setTrains([]);
      setFilteredTrains([]);
      setIsLoading(false);
    }
  };

  // 从首页进入时，如果有搜索参数，立即查询
  useEffect(() => {
    console.log('TrainListPage mounted with params:', searchParams);
    if (searchParams.departureStation && searchParams.arrivalStation) {
      console.log('Fetching trains on mount...');
      fetchTrains(searchParams);
    }
  }, []);

  // 实现5分钟过期检查
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeDiff = now.getTime() - queryTimestamp.getTime();
      const fiveMinutesInMs = 5 * 60 * 1000;

      if (timeDiff > fiveMinutesInMs && trains.length > 0) {
        // 显示过期提示
        setError('页面内容已过期，请重新查询！');
      }
    }, 60000); // 每分钟检查一次

    return () => clearInterval(timer);
  }, [queryTimestamp, trains]);

  // 实现导航功能
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
    console.log('Navigate to order page for train:', trainNo);
    
    // 从车次列表中找到对应的车次信息
    const train = trains.find(t => t.trainNo === trainNo);
    if (!train) {
      setError('找不到车次信息');
      return;
    }
    
    console.log('Found train data:', {
      trainNo: train.trainNo,
      departureStation: train.departureStation,
      arrivalStation: train.arrivalStation,
      departureDate: train.departureDate
    });
    
    console.log('Original search params:', {
      departureStation: searchParams.departureStation,
      arrivalStation: searchParams.arrivalStation,
      departureDate: searchParams.departureDate
    });
    
    // 跳转到订单填写页，传递完整的车次信息
    // 使用原始搜索参数而不是车次数据中的站点信息
    navigate('/order', { 
      state: { 
        trainNo: train.trainNo,
        departureStation: searchParams.departureStation,
        arrivalStation: searchParams.arrivalStation,
        departureDate: searchParams.departureDate
      } 
    });
  };

  // 实现筛选功能
  const handleFilterChange = (filters: any) => {
    console.log('Filter changed:', filters);
    
    // 基于原始车次列表进行筛选
    let filtered = [...trains];
    
    // 1. 按车次类型筛选
    if (filters.trainTypes && filters.trainTypes.length > 0) {
      filtered = filtered.filter(train => {
        const firstChar = train.trainNo.charAt(0);
        return filters.trainTypes.includes(firstChar);
      });
    }
    
    // 2. 按出发车站筛选
    if (filters.departureStations && filters.departureStations.length > 0) {
      filtered = filtered.filter(train => 
        filters.departureStations.includes(train.departureStation)
      );
    }
    
    // 3. 按到达车站筛选
    if (filters.arrivalStations && filters.arrivalStations.length > 0) {
      filtered = filtered.filter(train => 
        filters.arrivalStations.includes(train.arrivalStation)
      );
    }
    
    // 4. 按席别筛选（只显示有该席别的车次）
    if (filters.seatTypes && filters.seatTypes.length > 0) {
      filtered = filtered.filter(train => {
        return filters.seatTypes.some((seatType: string) => 
          train.availableSeats && train.availableSeats[seatType] !== undefined
        );
      });
    }
    
    console.log('Filtered trains:', filtered.length);
    setFilteredTrains(filtered);
  };

  // 获取用户名
  const username = isLoggedIn ? (localStorage.getItem('username') || localStorage.getItem('userId') || '用户') : '';

  return (
    <div className="train-list-page">
      <TrainListTopBar isLoggedIn={isLoggedIn} username={username} />
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
          onSearch={(params) => {
            console.log('TrainSearchBar onSearch called with:', params);
            // 更新搜索参数状态
            setSearchParams(params);
            // 执行查询
            fetchTrains(params);
          }}
        />
        <TrainFilterPanel
          onFilterChange={handleFilterChange}
          departureStations={filterOptions.departureStations || []}
          arrivalStations={filterOptions.arrivalStations || []}
          seatTypes={filterOptions.seatTypes || []}
          departureDate={searchParams.departureDate}
        />
        {error && <div className="error-message">{error}</div>}
        {isLoading ? (
          <div className="loading">加载中...</div>
               ) : (
                 <TrainList
                   trains={filteredTrains}
                   onReserve={handleNavigateToOrderPage}
                   isLoggedIn={isLoggedIn}
                   queryTimestamp={queryTimestamp.toISOString()}
                   departureCity={searchParams.departureStation}
                   arrivalCity={searchParams.arrivalStation}
                   departureDate={searchParams.departureDate}
                 />
               )}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default TrainListPage;

