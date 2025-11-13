import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import TopNavigation from '../components/TopNavigation';
import MainNavigation from '../components/MainNavigation';
import TrainSearchForm from '../components/TrainSearchForm';
import BottomNavigation from '../components/BottomNavigation';

/**
 * 首页/查询页主容器组件
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // 从localStorage读取登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 检查localStorage中是否有authToken
    const token = localStorage.getItem('authToken');
    setIsLoggedIn(!!token);
  }, []);

  // 实现导航功能
  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  const handleNavigateToPersonalCenter = () => {
    // TODO: 跳转到个人中心
    if (isLoggedIn) {
      // navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const handleNavigateToTrainList = (params: any) => {
    // 将查询参数传递到车次列表页
    navigate('/trains', { state: params });
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="home-page">
      <TopNavigation onLogoClick={handleLogoClick} />
      <MainNavigation
        isLoggedIn={isLoggedIn}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToPersonalCenter}
      />
      <main className="home-main">
        <div className="home-search-container">
          <div className="home-search-wrapper">
            <TrainSearchForm onNavigateToTrainList={handleNavigateToTrainList} />
          </div>
        </div>
        
        {/* 宣传栏区域 */}
        <section className="promo-section">
          <div className="promo-grid">
            <div className="promo-card member-service">
              <div className="promo-card-content">
                <h3 className="promo-card-title">会员服务</h3>
                <div className="promo-card-description">
                  <p>铁路畅行 尊享体验</p>
                  <p>12306铁路会员积分服务</p>
                </div>
              </div>
            </div>
            
            <div className="promo-card food-specialty">
              <div className="promo-card-content">
                <h3 className="promo-card-title">餐饮·特产</h3>
                <div className="promo-card-description">
                  <p>带有温度的旅途配餐</p>
                  <p>享受星级的体验和家乡的味道</p>
                </div>
              </div>
            </div>
            
            <div className="promo-card railway-insurance">
              <div className="promo-card-content">
                <h3 className="promo-card-title">铁路保险</h3>
                <div className="promo-card-description">
                  <p>用心呵护 放心出行</p>
                  <p>12306铁路保障出行安全</p>
                </div>
              </div>
            </div>
            
            <div className="promo-card time-ticket">
              <div className="promo-card-content">
                <h3 className="promo-card-title">计次·定期票</h3>
                <div className="promo-card-description">
                  <p>预约随心乘 出行更便捷</p>
                  <p>为您提供全新的自助式出行体验</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <BottomNavigation onFriendLinkClick={() => {}} />
    </div>
  );
};

export default HomePage;

