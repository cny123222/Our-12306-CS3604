import React, { useState, useEffect } from 'react';
import './UserProfilePage.css';
import TopNavigation from '../components/TopNavigation';
import LeftSidebar from '../components/LeftSidebar';
import UserInfoPanel from '../components/UserInfoPanel';
import BottomNavigation from '../components/BottomNavigation';

interface UserProfilePageProps {
  onNavigateToHome?: () => void;
}

interface UserInfo {
  username: string;
  name: string;
  country: string;
  idCardType: string;
  idCardNumber: string;
  verificationStatus: string;
  phone: string;
  email: string;
  discountType: string;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ onNavigateToHome }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // TODO: 实现获取用户信息的API调用
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError('');
      // TODO: 调用 API-GET-UserProfile
      throw new Error('功能尚未实现');
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuItemClick = (item: string) => {
    // TODO: 实现菜单项点击导航
    console.log('Menu item clicked:', item);
  };

  const handleEditContact = () => {
    // TODO: 实现编辑联系方式功能
    console.log('Edit contact clicked');
  };

  const handleEditAdditional = () => {
    // TODO: 实现编辑附加信息功能
    console.log('Edit additional info clicked');
  };

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="user-profile-page">
      <TopNavigation onLogoClick={onNavigateToHome} />
      
      <div className="breadcrumb">
        <span className="breadcrumb-path">当前位置：个人中心&gt;</span>
        <span className="breadcrumb-current">查看个人信息</span>
      </div>

      <div className="main-content">
        <LeftSidebar 
          activeItem="查看个人信息"
          onMenuItemClick={handleMenuItemClick}
        />
        
        <UserInfoPanel
          userInfo={userInfo}
          onEditContact={handleEditContact}
          onEditAdditional={handleEditAdditional}
        />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default UserProfilePage;

