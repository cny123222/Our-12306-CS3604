import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './SuccessfulPurchasePage.css';
import TrainListTopBar from '../components/TrainListTopBar';
import MainNavigation from '../components/MainNavigation';
import BottomNavigation from '../components/BottomNavigation';
import SuccessBanner from '../components/SuccessBanner';
import OrderInfoDisplay from '../components/OrderInfoDisplay';
import WarmTipsSection from '../components/WarmTipsSection';

/**
 * 购票成功页
 */
const SuccessfulPurchasePage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(!!localStorage.getItem('authToken'));
    };
    
    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  // 加载订单数据
  useEffect(() => {
    if (!orderId) return;

    const fetchOrderData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('authToken');
        // 从订单详情获取数据
        const detailResponse = await fetch(`/api/orders/${orderId}/confirmation`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!detailResponse.ok) {
          throw new Error('获取订单信息失败');
        }

        const detailData = await detailResponse.json();
        // 生成订单号（EA + 8位字符）
        const orderNumber = 'EA' + orderId.substring(0, 8).toUpperCase().replace(/-/g, '');
        
        // 构造成功页数据
        setOrderData({
          orderNumber,
          trainInfo: detailData.trainInfo,
          passengers: detailData.passengers.map((p: any) => ({
            sequence: p.sequence,
            name: p.name,
            idCardType: p.idCardType,
            idCardNumber: p.idCardNumber,
            ticketType: p.ticketType,
            seatType: p.seatType,
            carNumber: p.carNumber,
            seatNumber: p.seatNumber,
            price: p.price || 0
          })),
          totalPrice: detailData.totalPrice
        });
      } catch (err: any) {
        setError(err.message || '加载失败');
        console.error('加载订单数据失败:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

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

  const handleContinuePurchase = () => {
    navigate('/trains');
  };

  const handleViewOrderDetails = () => {
    navigate('/orders', { state: { orderId } });
  };

  const username = isLoggedIn ? (localStorage.getItem('username') || localStorage.getItem('userId') || '用户') : '';

  // 购票成功页温馨提示内容
  const successWarmTips = [
    '如需换票，请尽早携带购票时使用的乘车人有效身份证件到车站、售票窗口、自动售（取）票机、铁路客票代售点办理。',
    '请乘车人持购票时使用的有效证件按时乘车。',
    '投保后可在"我的12306-我的保险"查看电子保单号（登陆中国铁路保险www.china-ric.com 查看电子保单）。',
    '完成微信或支付宝绑定后，购票、购买乘意险、退乘意险的通知消息，将会通过微信或支付宝通知提醒发送给您；手机号码核验、通过手机号码找回密码、列车运行调整的通知仍然通过短信发送给您。',
    '未尽事宜详见《铁路旅客运输规程》等有关规定和车站公告。'
  ];

  if (isLoading) {
    return (
      <div className="successful-purchase-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error && !orderData) {
    return (
      <div className="successful-purchase-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="successful-purchase-page">
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

      <main className="successful-purchase-main">
        {/* 成功提示区域 */}
        {orderData && (
          <SuccessBanner
            orderNumber={orderData.orderNumber}
            passengers={orderData.passengers}
          />
        )}

        {/* 订单信息与乘车信息区 */}
        {orderData && (
          <OrderInfoDisplay
            trainInfo={orderData.trainInfo}
            passengers={orderData.passengers}
            totalPrice={orderData.totalPrice}
          />
        )}

        {/* 操作按钮 */}
        <div className="success-actions">
          <button
            className="success-button food-button"
            onClick={() => {}}
          >
            餐饮·特产
          </button>
          <button
            className="success-button continue-button"
            onClick={handleContinuePurchase}
          >
            继续购票
          </button>
          <button
            className="success-button view-details-button"
            onClick={handleViewOrderDetails}
          >
            查询订单详情
          </button>
        </div>

        {/* 温馨提示面板与广告面板 */}
        <div className="success-bottom-section">
          <div className="success-warm-tips">
            <WarmTipsSection tips={successWarmTips} variant="default" />
          </div>
          
          {/* 电子客票二维码区域 */}
          <div className="qr-codes-section">
            <div className="qr-code-item">
              <img 
                src="/images/wechat-qr.png" 
                alt="微信二维码"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <p className="qr-code-text">使用微信扫一扫，可通过微信接收12306行程通知</p>
            </div>
            <div className="qr-code-item">
              <img 
                src="/images/alipay-qr.png" 
                alt="支付宝二维码"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <p className="qr-code-text">使用支付宝扫一扫，可通过支付宝通知提醒接收12306行程通知</p>
            </div>
          </div>

          {/* 广告区域 */}
          <div className="advertisement-section">
            <img 
              src="/images/advertisement.png" 
              alt="广告"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default SuccessfulPurchasePage;

