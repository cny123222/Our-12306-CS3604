import React, { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './MainNavigation.css';

interface MainNavigationProps {
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onPersonalCenterClick: () => void;
}

/**
 * 主导航栏组件
 * 12306 蓝色导航栏，包含主要功能入口
 */
const MainNavigation: React.FC<MainNavigationProps> = ({
  isLoggedIn: _isLoggedIn,
  onLoginClick: _onLoginClick,
  onRegisterClick: _onRegisterClick,
  onPersonalCenterClick: _onPersonalCenterClick,
}) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isTrainsPage = location.pathname === '/trains'
    || location.pathname === '/order'
    || location.pathname === '/orders'
    || location.pathname === '/personal-info'
    || location.pathname === '/phone-verification'
    || location.pathname === '/passengers';
  const isBusinessPage = location.pathname.startsWith('/catering');

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const hideTimerRef = useRef<number | undefined>(undefined);

  const openBusinessDropdown = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = undefined;
    }
    setOpenDropdown('business');
  };

  const scheduleCloseDropdown = () => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setOpenDropdown(null);
      hideTimerRef.current = undefined;
    }, 200);
  };

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <Link to="/" className={`nav-item ${isHomePage ? 'active' : ''}`}>首页</Link>
        <Link to="/trains" className={`nav-item ${isTrainsPage ? 'active' : ''}`}>车票 <span className="nav-arrow">▼</span></Link>
        <a href="#" className="nav-item">团购服务 <span className="nav-arrow">▼</span></a>
        <a href="#" className="nav-item">会员服务 <span className="nav-arrow">▼</span></a>
        <a href="#" className="nav-item">站车服务 <span className="nav-arrow">▼</span></a>
        <div
          className={`nav-item has-dropdown ${isBusinessPage ? 'active' : ''}`}
          onMouseEnter={openBusinessDropdown}
          onMouseLeave={scheduleCloseDropdown}
        >
          商旅服务 <span className="nav-arrow">▼</span>
        </div>
        <a href="#" className="nav-item">出行指南 <span className="nav-arrow">▼</span></a>
        <a href="#" className="nav-item">信息查询 <span className="nav-arrow">▼</span></a>
      </div>
      {openDropdown === 'business' && (
        <div
          className="nav-dropdown-panel"
          onMouseEnter={openBusinessDropdown}
          onMouseLeave={scheduleCloseDropdown}
        >
          <Link to="/catering" className="nav-dropdown-item">餐饮·特产</Link>
          <a href="#" className="nav-dropdown-item">保险</a>
          <a href="#" className="nav-dropdown-item">雪具快运</a>
        </div>
      )}
    </nav>
  );
};

export default MainNavigation;
