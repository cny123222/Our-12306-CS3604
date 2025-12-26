import React, { useState } from 'react';
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const isHomePage = location.pathname === '/';
  // 车票相关的页面：车次列表、订单填写、历史订单、个人信息、手机核验、乘客管理
  const isTrainsPage = location.pathname === '/trains' 
    || location.pathname === '/order' 
    || location.pathname === '/orders' 
    || location.pathname === '/personal-info' 
    || location.pathname === '/phone-verification' 
    || location.pathname === '/passengers';

  const handleMouseEnter = (dropdownName: string) => {
    setActiveDropdown(dropdownName);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  const handleTicketsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 切换下拉框显示状态
    setActiveDropdown(activeDropdown === 'tickets' ? null : 'tickets');
  };

  const handleDropdownClick = (e: React.MouseEvent, dropdownName: string) => {
    e.preventDefault();
    e.stopPropagation();
    // 切换下拉框显示状态
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <Link to="/" className={`nav-item ${isHomePage ? 'active' : ''}`}>首页</Link>
        
        {/* 车票菜单项带下拉 */}
        <div 
          className={`nav-item-wrapper ${isTrainsPage ? 'active' : ''}`}
          onMouseEnter={() => handleMouseEnter('tickets')}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className={`nav-item ${isTrainsPage ? 'active' : ''}`}
            onClick={handleTicketsClick}
            style={{ cursor: 'pointer' }}
          >
            车票
            <svg 
              className={`nav-arrow-icon ${activeDropdown === 'tickets' ? 'rotated' : ''}`}
              width="10" 
              height="10" 
              viewBox="0 0 10 10"
            >
              <polyline 
                points="2,3 5,6 8,3" 
                fill="none" 
                stroke="white" 
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        
        {/* 下拉菜单放在nav-container级别 */}
        {activeDropdown === 'tickets' && (
          <div className="main-nav-dropdown main-nav-dropdown-table" onMouseEnter={() => handleMouseEnter('tickets')} onMouseLeave={handleMouseLeave}>
            <table>
              <tbody>
                {/* 标题行 */}
                <tr>
                  <th colSpan={2}>购买</th>
                  <th colSpan={2}>变更</th>
                  <th colSpan={2}>更多</th>
                </tr>
                {/* 第一行内容 */}
                <tr>
                  <td><Link to="/trains" style={{color: 'inherit', textDecoration: 'none'}}>单程</Link></td>
                  <td>往返</td>
                  <td>退票</td>
                  <td>改签</td>
                  <td>申铁银通卡</td>
                  <td>国际列车</td>
                </tr>
                {/* 第二行内容 */}
                <tr>
                  <td>中转换乘</td>
                  <td>计次·定期票</td>
                  <td>变更到站</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )
        }

        {/* 团购服务下拉菜单 */}
        {activeDropdown === 'group' && (
          <div className="main-nav-dropdown main-nav-dropdown-table" onMouseEnter={() => handleMouseEnter('group')} onMouseLeave={handleMouseLeave}>
            <table>
              <tbody>
                <tr>
                  <td>务工人员</td>
                  <td>学生团体</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 会员服务下拉菜单 */}
        {activeDropdown === 'member' && (
          <div className="main-nav-dropdown main-nav-dropdown-table" onMouseEnter={() => handleMouseEnter('member')} onMouseLeave={handleMouseLeave}>
            <table>
              <tbody>
                <tr>
                  <td>会员管理</td>
                  <td>积分账户</td>
                  <td>积分兑换</td>
                  <td>会员专享</td>
                  <td>会员中心</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 站车服务下拉菜单 */}
        {activeDropdown === 'station' && (
          <div className="main-nav-dropdown main-nav-dropdown-table" onMouseEnter={() => handleMouseEnter('station')} onMouseLeave={handleMouseLeave}>
            <table>
              <tbody>
                <tr>
                  <td>特殊重点旅客</td>
                  <td>便民托运</td>
                  <td>约车服务</td>
                  <td>车站引导</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>遗失物品查找</td>
                  <td>动车组介绍</td>
                  <td>站车风采</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 商旅服务下拉菜单 */}
        {activeDropdown === 'business' && (
          <div className="main-nav-dropdown main-nav-dropdown-table" onMouseEnter={() => handleMouseEnter('business')} onMouseLeave={handleMouseLeave}>
            <table>
              <tbody>
                <tr>
                  <td>餐饮·特产</td>
                  <td>保险</td>
                  <td>雪具快运</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 出行指南下拉菜单 */}
        {activeDropdown === 'guide' && (
          <div className="main-nav-dropdown main-nav-dropdown-table" onMouseEnter={() => handleMouseEnter('guide')} onMouseLeave={handleMouseLeave}>
            <table>
              <tbody>
                <tr>
                  <th colSpan={2}>常见问题</th>
                  <th colSpan={2}>旅客须知</th>
                  <th colSpan={2}>相关章程</th>
                </tr>
                <tr>
                  <td>车票</td>
                  <td>购票</td>
                  <td>身份核验</td>
                  <td className="main-nav-more-link">更多&gt;&gt;</td>
                  <td>铁路旅客运输规程</td>
                  <td>广深港高速铁路跨境旅客运输</td>
                </tr>
                <tr>
                  <td>改签</td>
                  <td>退票</td>
                  <td></td>
                  <td></td>
                  <td>铁路旅客禁止、限制携带...</td>
                  <td className="main-nav-more-link">更多&gt;&gt;</td>
                </tr>
                <tr>
                  <td className="main-nav-more-link">更多&gt;&gt;</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 信息查询下拉菜单 */}
        {activeDropdown === 'info' && (
          <div className="main-nav-dropdown main-nav-dropdown-table" onMouseEnter={() => handleMouseEnter('info')} onMouseLeave={handleMouseLeave}>
            <table>
              <tbody>
                <tr>
                  <th colSpan={6}>常用查询</th>
                </tr>
                <tr>
                  <td>正晚点</td>
                  <td>时刻表</td>
                  <td>公布票价</td>
                  <td>检票口</td>
                  <td>起售时间</td>
                  <td>最新发布</td>
                </tr>
                <tr>
                  <td>天气</td>
                  <td>交通查询</td>
                  <td>代售点</td>
                  <td>客服电话</td>
                  <td>列车状态</td>
                  <td>信用信息</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 团购服务 */}
        <div 
          className="nav-item-wrapper"
          onMouseEnter={() => handleMouseEnter('group')}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="nav-item"
            onClick={(e) => handleDropdownClick(e, 'group')}
            style={{ cursor: 'pointer' }}
          >
            团购服务
            <svg className={`nav-arrow-icon ${activeDropdown === 'group' ? 'rotated' : ''}`} width="10" height="10" viewBox="0 0 10 10">
              <polyline points="2,3 5,6 8,3" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* 会员服务 */}
        <div 
          className="nav-item-wrapper"
          onMouseEnter={() => handleMouseEnter('member')}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="nav-item"
            onClick={(e) => handleDropdownClick(e, 'member')}
            style={{ cursor: 'pointer' }}
          >
            会员服务
            <svg className={`nav-arrow-icon ${activeDropdown === 'member' ? 'rotated' : ''}`} width="10" height="10" viewBox="0 0 10 10">
              <polyline points="2,3 5,6 8,3" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* 站车服务 */}
        <div 
          className="nav-item-wrapper"
          onMouseEnter={() => handleMouseEnter('station')}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="nav-item"
            onClick={(e) => handleDropdownClick(e, 'station')}
            style={{ cursor: 'pointer' }}
          >
            站车服务
            <svg className={`nav-arrow-icon ${activeDropdown === 'station' ? 'rotated' : ''}`} width="10" height="10" viewBox="0 0 10 10">
              <polyline points="2,3 5,6 8,3" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* 商旅服务 */}
        <div 
          className="nav-item-wrapper"
          onMouseEnter={() => handleMouseEnter('business')}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="nav-item"
            onClick={(e) => handleDropdownClick(e, 'business')}
            style={{ cursor: 'pointer' }}
          >
            商旅服务
            <svg className={`nav-arrow-icon ${activeDropdown === 'business' ? 'rotated' : ''}`} width="10" height="10" viewBox="0 0 10 10">
              <polyline points="2,3 5,6 8,3" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* 出行指南 */}
        <div 
          className="nav-item-wrapper"
          onMouseEnter={() => handleMouseEnter('guide')}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="nav-item"
            onClick={(e) => handleDropdownClick(e, 'guide')}
            style={{ cursor: 'pointer' }}
          >
            出行指南
            <svg className={`nav-arrow-icon ${activeDropdown === 'guide' ? 'rotated' : ''}`} width="10" height="10" viewBox="0 0 10 10">
              <polyline points="2,3 5,6 8,3" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* 信息查询 */}
        <div 
          className="nav-item-wrapper"
          onMouseEnter={() => handleMouseEnter('info')}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="nav-item"
            onClick={(e) => handleDropdownClick(e, 'info')}
            style={{ cursor: 'pointer' }}
          >
            信息查询
            <svg className={`nav-arrow-icon ${activeDropdown === 'info' ? 'rotated' : ''}`} width="10" height="10" viewBox="0 0 10 10">
              <polyline points="2,3 5,6 8,3" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
