import React, { useState } from 'react';
import './LoginForm.css';

interface LoginFormProps {
  onSubmit: (loginData: { loginId: string; password: string }) => void;
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
  isLoading?: boolean;
  errorMessage?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  isLoading = false,
  errorMessage = ''
}) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!loginId.trim()) {
      errors.loginId = '请输入用户名/邮箱/手机号';
    }
    
    if (!password.trim()) {
      errors.password = '请输入密码';
    } else if (password.length < 6) {
      errors.password = '密码长度至少6位';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit({ loginId: loginId.trim(), password });
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2 className="login-title">账号登录</h2>
      
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
      
      <div className="form-group">
        <input
          type="text"
          placeholder="用户名/邮箱/手机号"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          className="form-input"
          disabled={isLoading}
        />
        {validationErrors.loginId && (
          <span className="field-error">{validationErrors.loginId}</span>
        )}
      </div>
      
      <div className="form-group">
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          disabled={isLoading}
        />
        {validationErrors.password && (
          <span className="field-error">{validationErrors.password}</span>
        )}
      </div>
      
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isLoading}
      >
        {isLoading ? '登录中...' : '立即登录'}
      </button>
      
      <div className="form-links">
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="link-button"
        >
          注册12306账户
        </button>
        <button
          type="button"
          onClick={onNavigateToForgotPassword}
          className="link-button"
        >
          忘记密码？
        </button>
      </div>
    </form>
  );
};

export default LoginForm;