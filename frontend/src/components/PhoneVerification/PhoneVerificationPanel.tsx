// 手机核验信息展示面板组件
import React, { useState } from 'react';
import './PhoneVerificationPanel.css';

interface PhoneVerificationPanelProps {
  oldPhone: string;
  onSubmit: (newPhone: string, password: string) => void;
  onCancel: () => void;
}

const PhoneVerificationPanel: React.FC<PhoneVerificationPanelProps> = ({
  oldPhone,
  onSubmit,
  onCancel
}) => {
  const [newPhone, setNewPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ newPhone?: string; password?: string }>({});

  const validateNewPhone = (phone: string) => {
    if (!phone) {
      return '手机号不能为空';
    }
    if (phone.length !== 11) {
      return '您输入的手机号码不是有效的格式！';
    }
    if (!/^\d{11}$/.test(phone)) {
      return '您输入的手机号码不是有效的格式！';
    }
    return '';
  };

  const handleNewPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPhone(value);
    const error = validateNewPhone(value);
    setErrors({ ...errors, newPhone: error });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (!value) {
      setErrors({ ...errors, password: '输入登录密码！' });
    } else {
      setErrors({ ...errors, password: '' });
    }
  };

  const handleSubmit = () => {
    const newPhoneError = validateNewPhone(newPhone);
    const passwordError = password ? '' : '输入登录密码！';

    if (newPhoneError || passwordError) {
      setErrors({ newPhone: newPhoneError, password: passwordError });
      return;
    }

    onSubmit(newPhone, password);
  };

  return (
    <div className="phone-verification-panel">
      <div className="verification-section">
        <h3 className="section-title">手机核验</h3>
        <div className="form-content">
          <div className="form-row">
            <label className="form-label">
              <span className="required">*</span> 原手机号：
            </label>
            <div className="form-value">{oldPhone} <span className="verified-link">已通过核验</span></div>
          </div>
          <div className="form-row">
            <label className="form-label">
              <span className="required">*</span> 新手机号：
            </label>
            <div className="form-input-group">
              <select className="country-code">
                <option>+86</option>
              </select>
              <input
                type="text"
                className="form-input"
                value={newPhone}
                onChange={handleNewPhoneChange}
                placeholder="请填写手机号码"
                maxLength={11}
              />
            </div>
            {errors.newPhone && <div className="phone-panel-error-message">{errors.newPhone}</div>}
          </div>
        </div>
      </div>

      <div className="password-section">
        <h3 className="section-title">登录密码</h3>
        <div className="form-content">
          <div className="form-row">
            <label className="form-label">
              <span className="required">*</span> 登录密码：
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={handlePasswordChange}
              placeholder="正确输入密码才能修改密码"
            />
            {errors.password && <div className="phone-panel-error-message">{errors.password}</div>}
          </div>
        </div>
      </div>

      <div className="button-group">
        <button className="cancel-button" onClick={onCancel}>取消</button>
        <button className="confirm-button" onClick={handleSubmit}>确认</button>
      </div>
    </div>
  );
};

export default PhoneVerificationPanel;

