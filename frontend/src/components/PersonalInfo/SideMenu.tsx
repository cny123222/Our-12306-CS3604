/**
 * 左侧功能菜单栏组件
 * UI-SideMenu
 * 
 * 注意：这是代码骨架，仅用于测试，实际逻辑待实现
 */

import React from 'react';

interface SideMenuProps {
  currentSection?: string;
  onMenuClick?: (section: string) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ currentSection, onMenuClick }) => {
  const handleClick = (section: string) => {
    // TODO: 实现菜单点击逻辑
    console.log('Menu clicked:', section);
    onMenuClick?.(section);
  };

  return (
    <div data-testid="side-menu" className="side-menu">
      {/* 订单中心 */}
      <div data-testid="order-center-section" className="menu-section">
        <div className="section-title">订单中心</div>
        <div
          data-testid="train-order-item"
          className={`menu-item ${currentSection === 'train-order' ? 'active' : ''}`}
          onClick={() => handleClick('train-order')}
        >
          火车票订单
        </div>
      </div>

      {/* 个人信息 */}
      <div data-testid="personal-info-section" className="menu-section">
        <div className="section-title">个人信息</div>
        <div
          data-testid="view-personal-info-item"
          className={`menu-item ${currentSection === 'view-personal-info' ? 'active' : ''}`}
          onClick={() => handleClick('view-personal-info')}
        >
          查看个人信息
        </div>
        <div
          data-testid="phone-verification-item"
          className={`menu-item ${currentSection === 'phone-verification' ? 'active' : ''}`}
          onClick={() => handleClick('phone-verification')}
        >
          手机核验
        </div>
      </div>

      {/* 常用信息管理 */}
      <div data-testid="common-info-section" className="menu-section">
        <div className="section-title">常用信息管理</div>
        <div
          data-testid="passenger-management-item"
          className={`menu-item ${currentSection === 'passenger-management' ? 'active' : ''}`}
          onClick={() => handleClick('passenger-management')}
        >
          乘车人
        </div>
      </div>
    </div>
  );
};

export default SideMenu;





