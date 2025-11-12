import React from 'react';
import './HomePage.css';
import TopNavigation from '../components/TopNavigation';
import MainNavigation from '../components/MainNavigation';
import TrainSearchForm from '../components/TrainSearchForm';
import BottomNavigation from '../components/BottomNavigation';

/**
 * 首页/查询页主容器组件
 * 骨架实现：仅包含组件结构，不实现真实逻辑
 */
const HomePage: React.FC = () => {
  // TODO: 实现登录状态管理
  const isLoggedIn = false;

  // TODO: 实现导航功能
  const handleNavigateToLogin = () => {
    // TODO: 跳转到登录页
  };

  const handleNavigateToRegister = () => {
    // TODO: 跳转到注册页
  };

  const handleNavigateToPersonalCenter = () => {
    // TODO: 跳转到个人中心
  };

  const handleNavigateToTrainList = () => {
    // TODO: 跳转到车次列表页
  };

  return (
    <div className="home-page">
      <TopNavigation onLogoClick={() => {}} />
      <MainNavigation
        isLoggedIn={isLoggedIn}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToPersonalCenter}
      />
      <main className="home-main">
        <TrainSearchForm onNavigateToTrainList={handleNavigateToTrainList} />
      </main>
      <BottomNavigation onFriendLinkClick={() => {}} />
    </div>
  );
};

export default HomePage;

