import React, { useState, useEffect } from 'react';
import './PhoneVerificationPage.css';
import TopNavigation from '../components/TopNavigation';
import LeftSidebar from '../components/LeftSidebar';
import PhoneVerificationPanel from '../components/PhoneVerificationPanel';
import BottomNavigation from '../components/BottomNavigation';

interface PhoneVerificationPageProps {
  onNavigateToHome?: () => void;
  onVerificationSuccess?: () => void;
}

const PhoneVerificationPage: React.FC<PhoneVerificationPageProps> = ({
  onNavigateToHome,
  onVerificationSuccess
}) => {
  const [originalPhone, setOriginalPhone] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    // TODO: 加载用户原手机号
    loadUserPhone();
  }, []);

  const loadUserPhone = async () => {
    try {
      // TODO: 调用 API-GET-UserProfile 获取原手机号
      setOriginalPhone('15812349968');
    } catch (err) {
      setError('获取用户信息失败');
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');
      // TODO: 调用 API-POST-VerifyPhoneChange
      setShowVerificationModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // TODO: 返回个人信息页
    if (onNavigateToHome) {
      onNavigateToHome();
    }
  };

  const handleMenuItemClick = (item: string) => {
    console.log('Menu item clicked:', item);
  };

  return (
    <div className="phone-verification-page">
      <TopNavigation onLogoClick={onNavigateToHome} />
      
      <div className="breadcrumb">
        <span className="breadcrumb-path">当前位置：个人中心&gt;个人信息&gt;账号安全&gt;</span>
        <span className="breadcrumb-current">手机核验</span>
      </div>

      <div className="main-content">
        <LeftSidebar 
          activeItem="手机核验"
          onMenuItemClick={handleMenuItemClick}
        />
        
        <PhoneVerificationPanel
          originalPhone={originalPhone}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PhoneVerificationPage;

