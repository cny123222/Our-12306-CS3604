// 手机核验页
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainListTopBar from '../components/TrainListTopBar';
import MainNavigation from '../components/MainNavigation';
import SideMenu from '../components/SideMenu';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import BottomNavigation from '../components/BottomNavigation';
import PhoneVerificationPanel from '../components/PhoneVerification/PhoneVerificationPanel';
import PhoneVerificationModal from '../components/PhoneVerification/PhoneVerificationModal';
import './PhoneVerificationPage.css';

const PhoneVerificationPage = () => {
  const navigate = useNavigate();
  const [oldPhone, setOldPhone] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('authToken');
      setIsLoggedIn(!!token);
      if (!token) {
        console.log('未登录，跳转到登录页');
        navigate('/login');
        return false;
      }
      return true;
    };
    
    if (checkLoginStatus()) {
      fetchUserPhone();
    }
    
    // 监听storage事件，当其他标签页登录/登出时同步状态
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, [navigate]);

  const fetchUserPhone = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/info', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOldPhone(data.phone);
      }
    } catch (err) {
      console.error('Error fetching user phone:', err);
    }
  };

  const handleSubmit = async (phone: string, password: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/phone/update-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPhone: phone, password })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setNewPhone(phone);
        setShowVerificationModal(true);
      } else {
        const error = await response.json();
        // 显示具体的错误信息（包括密码错误）
        alert(error.error || '发送验证码失败');
      }
    } catch (err) {
      console.error('Error requesting phone update:', err);
      alert('发送验证码失败');
    }
  };

  const handleVerificationSuccess = () => {
    setShowVerificationModal(false);
    alert('手机号更新成功！');
    navigate('/personal-info');
  };

  const handleMenuClick = (section: string) => {
    switch (section) {
      case 'train-orders':
        navigate('/orders');
        break;
      case 'personal-info':
        navigate('/personal-info');
        break;
      case 'phone-verification':
        // 已在当前页面
        break;
      case 'passengers':
        navigate('/passengers');
        break;
    }
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  const handleNavigateToPersonalCenter = () => {
    if (isLoggedIn) {
      navigate('/personal-info');
    } else {
      navigate('/login');
    }
  };

  // 获取用户名
  const username = isLoggedIn ? (localStorage.getItem('username') || localStorage.getItem('userId') || '用户') : '';

  return (
    <div className="phone-verification-page">
      <TrainListTopBar isLoggedIn={isLoggedIn} username={username} />
      <MainNavigation
        isLoggedIn={isLoggedIn}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToPersonalCenter}
      />
      
      <div className="main-content">
        <SideMenu 
          currentSection="phone-verification" 
          onMenuClick={handleMenuClick}
        />
        
        <div className="content-area">
          <BreadcrumbNavigation 
            path={['个人中心', '个人信息', '账号安全']}
            currentPage="手机核验"
          />
          
          <PhoneVerificationPanel
            oldPhone={oldPhone}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/personal-info')}
          />
        </div>
      </div>
      
      <BottomNavigation />

      <PhoneVerificationModal
        isVisible={showVerificationModal}
        phone={newPhone}
        sessionId={sessionId}
        onSuccess={handleVerificationSuccess}
        onCancel={() => setShowVerificationModal(false)}
      />
    </div>
  );
};

export default PhoneVerificationPage;

