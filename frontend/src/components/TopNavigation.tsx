import React from 'react';
import './TopNavigation.css';

interface TopNavigationProps {
  onLogoClick?: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ onLogoClick }) => {
  const handleLogoClick = () => {
    // TODO: 实现Logo点击逻辑
    // 验收标准：
    // - 左侧应显示中国铁路12306官方Logo
    // - Logo右侧应显示黑色"中国铁路12306"和灰色"12306 CHINA RAILWAY"
    // - Logo区域右侧应显示黑色"欢迎登录12306"
    // - Logo区域应可点击跳转到12306首页
    onLogoClick?.();
  };

  return (
    <header className="top-navigation">
      <div className="nav-container">
        <div className="logo-section" onClick={handleLogoClick}>
          <div className="logo">
            12306
          </div>
          <h1 className="site-title">中国铁路12306</h1>
        </div>
        <div className="welcome-text">
          欢迎登录12306
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;