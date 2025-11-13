import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './OrderPage.css';
import TopNavigation from '../components/TopNavigation';
import MainNavigation from '../components/MainNavigation';
import TrainInfoSection from '../components/TrainInfoSection';
import PassengerInfoSection from '../components/PassengerInfoSection';
import OrderSubmitSection from '../components/OrderSubmitSection';
import WarmTipsSection from '../components/WarmTipsSection';
import BottomNavigation from '../components/BottomNavigation';
import OrderConfirmationModal from '../components/OrderConfirmationModal';

/**
 * 订单填写页主容器组件
 */
const OrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 从路由参数获取车次信息
  const { trainNo, departureStation, arrivalStation, departureDate } = location.state || {};
  
  const [trainInfo, setTrainInfo] = useState<any>(null);
  const [fareInfo, setFareInfo] = useState<any>(null);
  const [availableSeats, setAvailableSeats] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
  const [purchaseInfo, setPurchaseInfo] = useState<any[]>([]);
  const [defaultSeatType, setDefaultSeatType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // TODO: 实现页面加载时获取车次信息和乘客列表
  useEffect(() => {
    // TODO: 检查用户登录状态
    // TODO: 调用API获取订单页面数据
  }, []);
  
  // TODO: 实现乘客选择逻辑
  const handlePassengerSelect = (passengerId: string, selected: boolean) => {
    // TODO: 更新已选乘客列表
    // TODO: 更新购票信息表格
  };
  
  // TODO: 实现席位变更逻辑
  const handleSeatTypeChange = (index: number, seatType: string) => {
    // TODO: 更新购票信息中的席别
  };
  
  // TODO: 实现票种变更逻辑
  const handleTicketTypeChange = (index: number, ticketType: string) => {
    // TODO: 更新购票信息中的票种
  };
  
  // TODO: 实现返回车次列表页
  const handleBack = () => {
    navigate('/trains', { state: { departureStation, arrivalStation, departureDate } });
  };
  
  // TODO: 实现提交订单逻辑
  const handleSubmit = async () => {
    // TODO: 验证至少选择一名乘客
    // TODO: 调用API提交订单
    // TODO: 显示信息核对弹窗
  };
  
  // TODO: 实现订单确认逻辑
  const handleConfirmOrder = async () => {
    // TODO: 调用API确认订单
    // TODO: 显示处理中提示
    // TODO: 显示购买成功提示
  };
  
  const handleLogoClick = () => {
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
  
  return (
    <div className="order-page">
      <TopNavigation onLogoClick={handleLogoClick} />
      <MainNavigation
        isLoggedIn={isLoggedIn}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToPersonalCenter}
      />
      
      <main className="order-main">
        {isLoading ? (
          <div className="loading">加载中...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <TrainInfoSection
              trainInfo={trainInfo}
              fareInfo={fareInfo}
              availableSeats={availableSeats}
            />
            
            <PassengerInfoSection
              passengers={passengers}
              onPassengerSelect={handlePassengerSelect}
              onSearchPassenger={() => {}}
              availableSeatTypes={[]}
              defaultSeatType={defaultSeatType}
              selectedPassengers={selectedPassengers}
              purchaseInfo={purchaseInfo}
              onSeatTypeChange={handleSeatTypeChange}
              onTicketTypeChange={handleTicketTypeChange}
            />
            
            <OrderSubmitSection
              onSubmit={handleSubmit}
              onBack={handleBack}
              isSubmitting={isLoading}
            />
            
            <WarmTipsSection onTermsClick={() => {}} />
          </>
        )}
      </main>
      
      <BottomNavigation onFriendLinkClick={() => {}} />
      
      {showConfirmModal && (
        <OrderConfirmationModal
          isVisible={showConfirmModal}
          orderId={orderId}
          onConfirm={handleConfirmOrder}
          onBack={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default OrderPage;
