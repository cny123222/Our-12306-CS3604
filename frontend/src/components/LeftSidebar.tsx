import React from 'react';
import './LeftSidebar.css';

interface LeftSidebarProps {
  activeItem?: string;
  onMenuItemClick?: (item: string) => void;
}

interface MenuItem {
  title: string;
  items: string[];
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ activeItem = '', onMenuItemClick }) => {
  const menuItems: MenuItem[] = [
    {
      title: '订单中心',
      items: ['火车票订单']
    },
    {
      title: '个人信息',
      items: ['查看个人信息', '手机核验']
    },
    {
      title: '常用信息管理',
      items: ['乘车人']
    }
  ];

  const handleItemClick = (item: string) => {
    if (onMenuItemClick) {
      onMenuItemClick(item);
    }
  };

  return (
    <div className="left-sidebar">
      {menuItems.map((section, sectionIndex) => (
        <div key={sectionIndex} className="menu-section">
          <div className="section-title">{section.title}</div>
          <ul className="menu-items">
            {section.items.map((item, itemIndex) => (
              <li
                key={itemIndex}
                className={`menu-item ${activeItem === item ? 'active' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default LeftSidebar;

