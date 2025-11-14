import React, { useState } from 'react';
import './PhoneVerificationPanel.css';

interface PhoneVerificationPanelProps {
  originalPhone: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}

const PhoneVerificationPanel: React.FC<PhoneVerificationPanelProps> = ({
  originalPhone,
  onSubmit,
  onCancel
}) => {
  const [newPhone, setNewPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 脱敏手机号
  const maskPhone = (phone: string) => {
    if (phone && phone.length === 11) {
      return `(+86)${phone.slice(0, 3)}****${phone.slice(7)}`;
    }
    return phone;
  };

  // 验证手机号格式
  const validatePhone = (phone: string): string => {
    if (!phone) {
      return '请输入手机号';
    }
    if (phone.length < 11) {
      return '您输入的手机号码不是有效的格式！';
    }
    if (phone.length > 11) {
      return '您输入的手机号码不是有效的格式！';
    }
    if (!/^\d+$/.test(phone)) {
      return '您输入的手机号码不是有效的格式！';
    }
    return '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 限制只能输入11位
    if (value.length <= 11) {
      setNewPhone(value);
      const error = validatePhone(value);
      setErrors({ ...errors, phone: error });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = () => {
    const phoneError = validatePhone(newPhone);
    if (phoneError) {
      setErrors({ ...errors, phone: phoneError });
      return;
    }
    if (!password) {
      setErrors({ ...errors, password: '输入登录密码！' });
      return;
    }
    if (onSubmit) {
      onSubmit();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="phone-verification-panel">
      {/* 手机核验模块 */}
      <div className="info-section">
        <h3 className="section-title">手机核验</h3>
        <div className="info-row">
          <span className="info-label">原手机号：</span>
          <span className="info-value">{maskPhone(originalPhone)}</span>
          <span className="phone-verified">已通过核验</span>
        </div>
        <div className="info-row">
          <span className="info-label">新手机号：</span>
          <input
            type="text"
            className="phone-input"
            value={newPhone}
            onChange={handlePhoneChange}
            placeholder="请输入新手机号"
            maxLength={11}
          />
        </div>
        {errors.phone && <div className="error-message">{errors.phone}</div>}
      </div>

      {/* 登录密码模块 */}
      <div className="info-section">
        <h3 className="section-title">登录密码</h3>
        <div className="info-row">
          <span className="info-label">登录密码：</span>
          <input
            type="password"
            className="password-input"
            value={password}
            onChange={handlePasswordChange}
            placeholder="请输入登录密码"
          />
          <span className="password-hint">正确输入密码才能修改密保</span>
        </div>
        {errors.password && <div className="error-message">{errors.password}</div>}
      </div>

      {/* 按钮组件 */}
      <div className="button-group">
        <button className="cancel-btn" onClick={handleCancel}>取消</button>
        <button className="confirm-btn" onClick={handleSubmit}>确认</button>
      </div>
    </div>
  );
};

export default PhoneVerificationPanel;

