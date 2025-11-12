import React from 'react';
import './MainNavigation.css';

interface MainNavigationProps {
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onPersonalCenterClick: () => void;
}

/**
 * 主导航栏组件
 * 骨架实现：仅包含组件结构，不实现真实逻辑
 */
const MainNavigation: React.FC<MainNavigationProps> = ({
  isLoggedIn,
  onLoginClick,
  onRegisterClick,
  onPersonalCenterClick,
}) => {
  return (
    <nav className="main-navigation">
      {!isLoggedIn ? (
        <>
          <button className="nav-button login-button" onClick={onLoginClick}>
            登录
          </button>
          <button className="nav-button register-button" onClick={onRegisterClick}>
            注册
          </button>
        </>
      ) : (
        <button className="nav-button personal-center-button" onClick={onPersonalCenterClick}>
          个人中心
        </button>
      )}
    </nav>
  );
};

export default MainNavigation;
