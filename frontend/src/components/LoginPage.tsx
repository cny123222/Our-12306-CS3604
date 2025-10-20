import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SmsVerificationModal from './SmsVerificationModal';
import TopNavigation from './TopNavigation';
import BottomNavigation from './BottomNavigation';

interface LoginPageProps {
  onLoginSuccess?: (userInfo: any, accessToken: string) => void;
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
  onNavigateToHome?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onNavigateToHome
}) => {
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (loginData: { loginId: string; password: string }) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginType: 'password',
          username: loginData.loginId,
          password: loginData.password
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 登录成功，显示短信验证弹窗
        setSessionToken(result.sessionToken);
        setShowSmsModal(true);
      } else {
        setErrorMessage(result.message || '登录失败，请检查用户名和密码');
      }
    } catch (error) {
      console.error('登录请求失败:', error);
      setErrorMessage('网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmsVerificationSuccess = (userInfo: any, accessToken: string) => {
    // TODO: 实现短信验证成功处理逻辑
    setShowSmsModal(false);
    onLoginSuccess?.(userInfo, accessToken);
  };

  return (
    <div className="login-page">
      <TopNavigation onLogoClick={onNavigateToHome} />
      
      <main className="login-main">
        <div className="login-container">
          <LoginForm
            onSubmit={handleLoginSubmit}
            onNavigateToRegister={onNavigateToRegister}
            onNavigateToForgotPassword={onNavigateToForgotPassword}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>
      </main>

      <BottomNavigation onLinkClick={() => {}} />

      <SmsVerificationModal
        isVisible={showSmsModal}
        sessionToken={sessionToken}
        onClose={() => setShowSmsModal(false)}
        onVerificationSuccess={handleSmsVerificationSuccess}
      />
    </div>
  );
};

export default LoginPage;