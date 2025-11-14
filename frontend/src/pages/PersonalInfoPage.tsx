// 用户基本信息页
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavigation from '../components/TopNavigation';
import SideMenu from '../components/SideMenu';
import PersonalInfoPanel from '../components/PersonalInfo/PersonalInfoPanel';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import BottomNavigation from '../components/BottomNavigation';
import './PersonalInfoPage.css';

/**
 * UI-PersonalInfoPage: 用户基本信息页主容器组件
 * 整体页面背景为白色，分为上中下三大部分
 */
const PersonalInfoPage = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('未登录，跳转到登录页');
      navigate('/login');
      return;
    }
    
    // 页面加载时自动获取用户信息
    fetchUserInfo();
  }, [navigate]);

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // 从localStorage获取token
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/user/info', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token失效，跳转到登录页
          navigate('/login');
          return;
        }
        throw new Error('获取用户信息失败');
      }
      
      const data = await response.json();
      setUserInfo(data);
    } catch (err) {
      setError('获取用户信息失败');
      console.error('Error fetching user info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToHome = () => {
    navigate('/');
  };

  const handleMenuClick = (section: string) => {
    switch (section) {
      case 'train-orders':
        navigate('/orders');
        break;
      case 'personal-info':
        // 已在当前页面
        break;
      case 'phone-verification':
        navigate('/phone-verification');
        break;
      case 'passengers':
        navigate('/passengers');
        break;
      default:
        break;
    }
  };

  const handleNavigateToPhoneVerification = () => {
    navigate('/phone-verification');
  };

  const handleSaveEmail = async (email: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/user/email', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error('更新邮箱失败');
      }
      
      // 保存成功后重新获取用户信息（刷新页面数据）
      await fetchUserInfo();
      alert('邮箱更新成功！');
    } catch (err) {
      console.error('Error updating email:', err);
      alert('更新邮箱失败');
    }
  };

  if (isLoading) {
    return (
      <div className="personal-info-page">
        <TopNavigation onLogoClick={handleNavigateToHome} />
        <div className="loading-container">加载中...</div>
        <BottomNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="personal-info-page">
        <TopNavigation onLogoClick={handleNavigateToHome} />
        <div className="error-container">错误: {error}</div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="personal-info-page">
      <TopNavigation onLogoClick={handleNavigateToHome} />
      
      <div className="main-content">
        <SideMenu 
          currentSection="personal-info" 
          onMenuClick={handleMenuClick}
        />
        
        <div className="content-area">
          <BreadcrumbNavigation 
            path={['个人中心', '个人信息']}
            currentPage="查看个人信息"
          />
          
          {userInfo && (
            <PersonalInfoPanel
              userInfo={userInfo}
              onNavigateToPhoneVerification={handleNavigateToPhoneVerification}
              onSaveEmail={handleSaveEmail}
            />
          )}
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default PersonalInfoPage;

