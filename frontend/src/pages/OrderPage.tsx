import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopNavigation from '../components/TopNavigation';
import MainNavigation from '../components/MainNavigation';
import BottomNavigation from '../components/BottomNavigation';

/**
 * 订单填写页 - 占位符实现
 * TODO: 实现完整的订单填写功能（根据 04-订单填写页.md）
 */
const OrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { trainNo, departureStation, arrivalStation, departureDate } = location.state || {};

  const handleNavigateToHome = () => {
    navigate('/');
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopNavigation onLogoClick={handleNavigateToHome} />
      <MainNavigation
        isLoggedIn={false}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToLogin}
      />
      
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px 20px',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
            订单填写页
          </h1>
          
          {trainNo ? (
            <div style={{ textAlign: 'left', lineHeight: '2' }}>
              <p><strong>车次号：</strong>{trainNo}</p>
              <p><strong>出发站：</strong>{departureStation}</p>
              <p><strong>到达站：</strong>{arrivalStation}</p>
              <p><strong>出发日期：</strong>{departureDate}</p>
              
              <div style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#fffbe6',
                borderRadius: '4px',
                border: '1px solid #ffe58f'
              }}>
                <p style={{ margin: 0, color: '#ad6800' }}>
                  💡 <strong>开发提示：</strong>订单填写页功能尚未实现
                </p>
                <p style={{ margin: '10px 0 0 0', color: '#ad6800', fontSize: '14px' }}>
                  此页面需要根据需求文档 <code>04-订单填写页.md</code> 进行完整实现
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: '#999' }}>
              缺少必要的订单信息，请从车次列表页点击"预订"按钮进入
            </p>
          )}
          
          <button
            onClick={() => navigate('/trains')}
            style={{
              marginTop: '30px',
              padding: '12px 40px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            返回车次列表
          </button>
        </div>
      </main>
      
      <BottomNavigation onFriendLinkClick={() => {}} />
    </div>
  );
};

export default OrderPage;

