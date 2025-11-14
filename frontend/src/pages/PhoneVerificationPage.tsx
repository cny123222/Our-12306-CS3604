/**
 * 手机核验页
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PhoneVerificationPage.css';
import TopNavigation from '../components/TopNavigation';
import BottomNavigation from '../components/BottomNavigation';
import SideMenu from '../components/PersonalInfo/SideMenu';

interface UserInfo {
  phone: string;
}

const PhoneVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [newPhone, setNewPhone] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+86');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
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
        setUserInfo({ phone: response.data.phone });
      }
    } catch (err: any) {
      console.error('Failed to fetch user info:', err);
    }
  };

  const handleNavigateToHome = () => {
    navigate('/');
  };

  const handleMenuClick = (section: string) => {
    if (section === 'train-order') {
      navigate('/personal/orders');
    } else if (section === 'view-personal-info') {
      navigate('/personal/info');
    } else if (section === 'passenger-management') {
      navigate('/personal/passengers');
    }
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone || phone.length !== 11) {
      setError('您输入的手机号码不是有效的格式！');
      return false;
    }
    if (!/^\d{11}$/.test(phone)) {
      setError('您输入的手机号码不是有效的格式！');
      return false;
    }
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 限制只能输入数字，最多11位
    if (value.length <= 11 && /^\d*$/.test(value)) {
      setNewPhone(value);
      setError('');
    }
  };

  const handleCancel = () => {
    navigate('/personal/info');
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证密码
    if (!password || password.trim() === '') {
      setError('输入登录密码！');
      return;
    }

    // 验证手机号
    if (!validatePhone(newPhone)) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // 发送修改手机号请求
      const response = await axios.post(
        '/api/user/phone/update-request',
        {
          newPhone,
          password
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        // 显示验证码信息
        console.log('\n=================================');
        console.log('📱 手机修改验证码');
        console.log(`手机号: ${newPhone}`);
        console.log(`验证码: ${response.data.verificationCode || '已发送'}`);
        console.log(`SessionID: ${response.data.sessionId}`);
        console.log('=================================\n');
        
        alert('验证码已发送，请查看控制台');
        // TODO: 实现验证码确认流程
      }
    } catch (err: any) {
      console.error('Failed to update phone:', err);
      setError(err.response?.data?.error || '修改手机号失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="phone-verification-page">
      <TopNavigation onLogoClick={handleNavigateToHome} showWelcomeLogin={true} />

      <div className="breadcrumb">
        <span className="breadcrumb-text">当前位置：个人中心&gt;个人信息&gt;账号安全&gt;</span>
        <span className="breadcrumb-current">手机核验</span>
      </div>

      <div className="main-content">
        <SideMenu currentSection="phone-verification" onMenuClick={handleMenuClick} />

        <div className="phone-verification-panel">
          <form onSubmit={handleConfirm}>
            {/* 手机核验模块 */}
            <div className="info-section">
              <h3 className="section-title">手机核验</h3>
              <div className="info-content">
                <div className="info-row">
                  <span className="info-label">原手机号：</span>
                  <span className="info-value">{userInfo?.phone || '加载中...'}</span>
                  <span className="info-link">已通过核验</span>
                </div>
                <div className="info-row">
                  <span className="info-label">新手机号：</span>
                  <select className="country-code-select" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                    <option value="+86">+86</option>
                  </select>
                  <input
                    type="text"
                    className="phone-input"
                    value={newPhone}
                    onChange={handlePhoneChange}
                    placeholder="请输入新手机号"
                    maxLength={11}
                  />
                </div>
              </div>
            </div>

            {/* 登录密码模块 */}
            <div className="info-section">
              <h3 className="section-title">登录密码</h3>
              <div className="info-content">
                <div className="info-row">
                  <span className="info-label">登录密码：</span>
                  <input
                    type="password"
                    className="password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入登录密码"
                  />
                  <span className="info-hint">正确输入密码才能修改密保</span>
                </div>
              </div>
            </div>

            {/* 错误信息 */}
            {error && <div className="error-message">{error}</div>}

            {/* 按钮组 */}
            <div className="button-group">
              <button type="button" className="cancel-button" onClick={handleCancel}>
                取消
              </button>
              <button type="submit" className="confirm-button" disabled={isLoading}>
                {isLoading ? '提交中...' : '确认'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PhoneVerificationPage;



