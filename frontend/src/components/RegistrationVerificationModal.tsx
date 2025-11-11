/**
 * RegistrationVerificationModal组件
 * 用于注册流程的手机验证弹窗
 */

import React, { useState } from 'react';
import './RegistrationVerificationModal.css';

interface RegistrationVerificationModalProps {
  phoneNumber: string;
  onClose: () => void;
  onComplete: (code: string) => void;
  onBack: () => void;
}

const RegistrationVerificationModal: React.FC<RegistrationVerificationModalProps> = ({
  phoneNumber,
  onClose,
  onComplete,
  onBack
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode) {
      setError('请输入验证码');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('验证码应为6位数字');
      return;
    }

    onComplete(verificationCode);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="reg-verification-modal-backdrop" onClick={handleBackdropClick}>
      <div className="reg-verification-modal">
        {/* 标题栏 */}
        <div className="reg-verification-modal-header">
          <h3>手机双向验证</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {/* 内容区域 */}
        <div className="reg-verification-modal-content">
          {/* 信息提示框 */}
          <div className="info-box">
            <div className="info-icon">
              <img src="/images/user-icon.png" alt="用户" />
            </div>
            <div className="info-text">
              <p className="info-title">
                为了保护您的信息安全，便于今后为您服务，请按以下程序进行手机双向核验：
              </p>
              <p className="info-step">
                <span className="step-label">第一步：</span>
                请您用手机+86-{phoneNumber}发送短信"999"至12306，以便确认您的手机可以联络。
              </p>
              <p className="info-step">
                <span className="step-label">第二步：</span>
                12306接到您的短信后将给您的手机回复六位数字短信，请您在十分钟内将六位数字短信填写在下方空白框中，并点击"完成注册"按钮。
              </p>
              <p className="info-note">
                现在先请您发送"999"短信，并稍候我们的回复。
              </p>
            </div>
          </div>

          {/* 验证码输入表单 */}
          <form className="verification-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="form-label">验证码：</label>
              <input
                type="text"
                className="form-input"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // 只允许数字
                  setVerificationCode(value.slice(0, 6));
                  setError('');
                }}
                maxLength={6}
                placeholder="请输入6位验证码"
              />
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            {/* 按钮区域 */}
            <div className="button-group">
              <button 
                type="submit" 
                className="complete-button"
              >
                完成注册
              </button>
              <button 
                type="button" 
                className="back-button"
                onClick={onBack}
              >
                返回修改
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationVerificationModal;

