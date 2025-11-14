/**
 * 用户基本信息页
 * UI-PersonalInfoPage
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PersonalInfoPage.css';
import TopNavigation from '../components/TopNavigation';
import BottomNavigation from '../components/BottomNavigation';
import SideMenu from '../components/PersonalInfo/SideMenu';
import PersonalInfoPanel from '../components/PersonalInfo/PersonalInfoPanel';
import '../components/PersonalInfo/SideMenu.css';

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

const PersonalInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState('view-personal-info');

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    console.log('PersonalInfoPage: Fetching user info...');
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('/api/user/info', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data) {
        setUserInfo(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch user info:', err);
      setError(err.response?.data?.error || '获取用户信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToHome = () => {
    navigate('/');
  };

  const handleMenuClick = (section: string) => {
    setCurrentSection(section);
    
    // 根据不同的菜单项跳转到对应页面
    if (section === 'train-order') {
      navigate('/personal/orders');
    } else if (section === 'phone-verification') {
      navigate('/personal/phone-verification');
    } else if (section === 'passenger-management') {
      navigate('/personal/passengers');
    }
  };

  const handleEditContact = () => {
    navigate('/personal/phone-verification');
  };

  const handleEditAdditionalInfo = () => {
    // TODO: 实现编辑附加信息的逻辑
    console.log('Edit additional info');
  };

  if (isLoading) {
    return (
      <div data-testid="personal-info-page" className="personal-info-page">
        <div data-testid="top-navigation">
          <TopNavigation onLogoClick={handleNavigateToHome} showWelcomeLogin={true} />
        </div>
        <div data-testid="loading">加载中...</div>
        <div data-testid="bottom-navigation">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="personal-info-page" className="personal-info-page">
        <div data-testid="top-navigation">
          <TopNavigation onLogoClick={handleNavigateToHome} showWelcomeLogin={true} />
        </div>
        <div data-testid="error">错误: {error}</div>
        <div data-testid="bottom-navigation">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="personal-info-page" className="personal-info-page">
      <div data-testid="top-navigation">
        <TopNavigation onLogoClick={handleNavigateToHome} showWelcomeLogin={true} />
      </div>

      <div className="breadcrumb">
        <span className="breadcrumb-text">当前位置：个人中心&gt;</span>
        <span className="breadcrumb-current">查看个人信息</span>
      </div>

      <div className="main-content">
        <div data-testid="side-menu">
          <SideMenu currentSection={currentSection} onMenuClick={handleMenuClick} />
        </div>

        <div data-testid="personal-info-panel">
          <PersonalInfoPanel 
            userInfo={userInfo} 
            onEditContact={handleEditContact}
            onEditAdditionalInfo={handleEditAdditionalInfo}
          />
        </div>
      </div>

      <div data-testid="bottom-navigation">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default PersonalInfoPage;


