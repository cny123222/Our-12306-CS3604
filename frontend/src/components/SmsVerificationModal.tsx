import React, { useState, useEffect } from 'react';
import VerificationCodeInput from './VerificationCodeInput';
import './SmsVerificationModal.css';

interface SmsVerificationModalProps {
  isVisible: boolean;
  sessionToken: string;
  onClose: () => void;
  onVerificationSuccess: (userInfo: any, accessToken: string) => void;
}

const SmsVerificationModal: React.FC<SmsVerificationModalProps> = ({
  isVisible,
  sessionToken,
  onClose,
  onVerificationSuccess
}) => {
  const [idCardLast4, setIdCardLast4] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGetCode = async () => {
    if (idCardLast4.length !== 4) {
      setErrorMessage('请输入证件号后4位');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken,
          idCardLast4
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsCodeSent(true);
        setCountdown(60);
        // 开始倒计时
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrorMessage(result.message || '获取验证码失败');
      }
    } catch (error) {
      console.error('获取验证码失败:', error);
      setErrorMessage('网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrorMessage('请输入6位验证码');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken,
          verificationCode
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onVerificationSuccess(result.user, result.token);
      } else {
        setErrorMessage(result.message || '验证码验证失败');
      }
    } catch (error) {
      console.error('验证码验证失败:', error);
      setErrorMessage('网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="sms-modal">
        <div className="modal-header">
          <h3>选择验证方式</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <div className="modal-body">
          <h4 className="verification-title">短信验证</h4>
          
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
          
          <div className="form-group">
            <input
              type="text"
              placeholder="请输入证件号后4位"
              value={idCardLast4}
              onChange={(e) => setIdCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="form-input"
              maxLength={4}
            />
          </div>
          
          <VerificationCodeInput
            value={verificationCode}
            onChange={setVerificationCode}
            onGetCode={handleGetCode}
            canGetCode={idCardLast4.length === 4 && countdown === 0}
            countdown={countdown}
          />
          
          <button
            onClick={handleVerify}
            className="btn btn-primary"
            disabled={isLoading || !verificationCode || verificationCode.length !== 6}
          >
            {isLoading ? '验证中...' : '确定'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmsVerificationModal;