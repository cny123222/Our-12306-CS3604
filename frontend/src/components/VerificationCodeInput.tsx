import React, { useState } from 'react';
import './VerificationCodeInput.css';

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onGetCode: () => void;
  canGetCode: boolean;
  countdown: number;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value,
  onChange,
  onGetCode,
  canGetCode,
  countdown
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 6);
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleGetCodeClick = () => {
    // TODO: 实现获取验证码逻辑
    // 验收标准：
    // - 输入框应限制6位数字输入
    // - 获取验证码按钮应有三种状态：禁用、可用、倒计时
    // - 倒计时状态应显示剩余秒数，从60秒开始
    // - 按钮状态应根据证件号输入情况自动切换
    onGetCode();
  };

  const getButtonText = () => {
    if (countdown > 0) {
      return `${countdown}秒后重新获取`;
    }
    return '获取验证码';
  };

  return (
    <div className="verification-code-input">
      <div className="input-group">
        <input
          type="text"
          placeholder="请输入验证码"
          value={inputValue}
          onChange={handleInputChange}
          className="verification-input"
          maxLength={6}
        />
        <button
          type="button"
          onClick={handleGetCodeClick}
          disabled={!canGetCode || countdown > 0}
          className="get-code-btn"
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
};

export default VerificationCodeInput;