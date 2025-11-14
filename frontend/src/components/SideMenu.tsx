// 左侧功能菜单栏组件 - 代码骨架
import { useState } from 'react';
import './SideMenu.css';

interface SideMenuProps {
  currentSection: string;
  onMenuClick: (section: string) => void;
}

/**
 * UI-SideMenu: 左侧功能菜单栏组件
 * 采用垂直列表形式展示功能分区
 */
const SideMenu = ({ currentSection, onMenuClick }: SideMenuProps) => {
  const [selectedItem, setSelectedItem] = useState(currentSection);

  const handleClick = (section: string) => {
    setSelectedItem(section);
    onMenuClick(section);
  };

  return (
    <div className="side-menu">
      {/* TODO: 实现功能菜单栏 */}
      
      {/* 订单中心 */}
      <div className="menu-section">
        <div className="menu-title">订单中心</div>
        <div
          className={`menu-item ${selectedItem === 'train-orders' ? 'selected' : ''}`}
          onClick={() => handleClick('train-orders')}
        >
          火车票订单
        </div>
      </div>

      {/* 个人信息 */}
      <div className="menu-section">
        <div className="menu-title">个人信息</div>
        <div
          className={`menu-item ${selectedItem === 'personal-info' ? 'selected' : ''}`}
          onClick={() => handleClick('personal-info')}
        >
          查看个人信息
        </div>
        <div
          className={`menu-item ${selectedItem === 'phone-verification' ? 'selected' : ''}`}
          onClick={() => handleClick('phone-verification')}
        >
          手机核验
        </div>
      </div>

      {/* 常用信息管理 */}
      <div className="menu-section">
        <div className="menu-title">常用信息管理</div>
        <div
          className={`menu-item ${selectedItem === 'passengers' ? 'selected' : ''}`}
          onClick={() => handleClick('passengers')}
        >
          乘车人
        </div>
      </div>
    </div>
  );
};

export default SideMenu;

