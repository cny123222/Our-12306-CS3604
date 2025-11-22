import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PaymentPage.css';
import TrainListTopBar from '../components/TrainListTopBar';
import MainNavigation from '../components/MainNavigation';
import BottomNavigation from '../components/BottomNavigation';
import PaymentCountdownTimer from '../components/PaymentCountdownTimer';
import OrderInfoDisplay from '../components/OrderInfoDisplay';
import WarmTipsSection from '../components/WarmTipsSection';
import CancelOrderModal from '../components/CancelOrderModal';
import TimeoutModal from '../components/TimeoutModal';

/**
 * 订单支付页
 */
const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('authToken');
      setIsLoggedIn(!!token);
      if (!token) {
        navigate('/login');
      }
    };
    
    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, [navigate]);

  // 加载支付页面数据
  useEffect(() => {
    if (!orderId || !isLoggedIn) return;

    const fetchPaymentData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/payment/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 400 && errorData.error?.includes('过期')) {
            setShowTimeoutModal(true);
            return;
          }
          throw new Error(errorData.error || '获取支付页面数据失败');
        }

        const data = await response.json();
        setPaymentData(data);
      } catch (err: any) {
        setError(err.message || '加载失败');
        console.error('加载支付页面数据失败:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentData();
  }, [orderId, isLoggedIn]);

  // 处理取消订单
  const handleCancelOrder = async () => {
    if (!orderId) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/payment/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '取消订单失败');
      }

      // 取消成功，跳转到车次列表页
      navigate('/trains');
    } catch (err: any) {
      setError(err.message || '取消订单失败');
      console.error('取消订单失败:', err);
    } finally {
      setIsProcessing(false);
      setShowCancelModal(false);
    }
  };

  // 处理确认支付
  const handleConfirmPayment = async () => {
    if (!orderId) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/payment/${orderId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 && errorData.error?.includes('过期')) {
          setShowTimeoutModal(true);
          return;
        }
        throw new Error(errorData.error || '支付失败');
      }

      // 支付成功，跳转到购票成功页
      navigate(`/purchase-success/${orderId}`);
    } catch (err: any) {
      setError(err.message || '支付失败');
      console.error('支付失败:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理倒计时超时
  const handleTimeout = () => {
    setShowTimeoutModal(true);
  };

  // 处理超时弹窗确认
  const handleTimeoutConfirm = () => {
    setShowTimeoutModal(false);
    navigate('/trains');
  };

  // 处理导航
  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  const handleNavigateToPersonalCenter = () => {
    if (isLoggedIn) {
      navigate('/personal-info');
    } else {
      navigate('/login');
    }
  };

  const handleMy12306Click = () => {
    if (isLoggedIn) {
      navigate('/personal-info');
    } else {
      navigate('/login');
    }
  };

  const username = isLoggedIn ? (localStorage.getItem('username') || localStorage.getItem('userId') || '用户') : '';

  // 支付页温馨提示内容
  const paymentWarmTips = [
    '请在指定时间内完成网上支付。',
    '逾期未支付，系统将取消本次交易。',
    '在完成支付或取消本订单之前，您将无法购买其他车票。',
    '购买铁路乘意险保障您的出行安全，提供意外伤害身故伤残、意外伤害医疗费用、意外伤害住院津贴、突发急性病身故保障，同时保障您和随行被监护人因疏忽或过失造成第三者人身伤亡和财产损失依法应由您承担的直接经济赔偿责任，详见保险条款',
    '请充分理解保险责任、责任免除、保险期间、合同解除等约定，详见保险条款。凭保单号或保单查询号登录www.china-ric.com 查看电子保单或下载电子发票。',
    '如因运力原因或其他不可控因素导致列车调度调整时，当前车型可能会发生变动。',
    '跨境旅客旅行须知详见铁路跨境旅客相关运输组织规则和车站公告。',
    '未尽事宜详见《国铁集团铁路旅客运输规程》等有关规定和车站公告。'
  ];

  if (isLoading) {
    return (
      <div className="payment-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error && !paymentData) {
    return (
      <div className="payment-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <TrainListTopBar 
        isLoggedIn={isLoggedIn} 
        username={username} 
        onMy12306Click={handleMy12306Click} 
      />
      <MainNavigation
        isLoggedIn={isLoggedIn}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToPersonalCenter}
      />

      <main className="payment-main">
        {/* 席位锁定时效倒计时区域 */}
        {paymentData && (
          <PaymentCountdownTimer
            orderId={orderId!}
            initialTimeRemaining={paymentData.timeRemaining}
            onTimeout={handleTimeout}
          />
        )}

        {/* 订单信息与确认支付区 */}
        {paymentData && (
          <OrderInfoDisplay
            trainInfo={paymentData.trainInfo}
            passengers={paymentData.passengers}
            totalPrice={paymentData.totalPrice}
          />
        )}

        {/* 操作按钮 */}
        <div className="payment-actions">
          <button
            className="payment-button cancel-order-button"
            onClick={() => setShowCancelModal(true)}
            disabled={isProcessing}
          >
            取消订单
          </button>
          <button
            className="payment-button confirm-payment-button"
            onClick={handleConfirmPayment}
            disabled={isProcessing}
          >
            {isProcessing ? '处理中...' : '确认支付'}
          </button>
        </div>

        {/* 温馨提示面板 */}
        <WarmTipsSection tips={paymentWarmTips} variant="default" />

        {error && (
          <div className="error-message">{error}</div>
        )}
      </main>

      <BottomNavigation />

      {/* 取消订单确认弹窗 */}
      <CancelOrderModal
        isVisible={showCancelModal}
        onConfirm={handleCancelOrder}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* 超时提示弹窗 */}
      <TimeoutModal
        isVisible={showTimeoutModal}
        onConfirm={handleTimeoutConfirm}
      />
    </div>
  );
};

export default PaymentPage;

