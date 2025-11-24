
import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPasswordModule.css';

const ForgotPasswordModule = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      setError('请输入手机号或邮箱');
      return;
    }
    setIsSending(true);
    setError('');
    setMessage('');
    try {
      // 假设: 后端API /api/auth/forgot-password/send-code 接收邮箱或手机号
      const response = await axios.post('/api/auth/forgot-password/send-code', { email });
      if (response.data.success) {
        setMessage('验证码已发送，请注意查收。');
        setStep(2);
      } else {
        setError(response.data.error || '发送验证码失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '发送验证码失败，请稍后重试');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetPassword = async () => {
    if (password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setError('');
    setMessage('');
    try {
      // 假设: 后端API /api/auth/forgot-password/reset 接收邮箱、验证码和新密码
      const response = await axios.post('/api/auth/forgot-password/reset', { email, code, password });
      if (response.data.success) {
        setMessage('密码重置成功');
        setStep(3);
      } else {
        setError(response.data.error || '密码重置失败');
      } 
    } catch (err: any) {
      setError(err.response?.data?.error || '密码重置失败，请检查您的输入');
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h2>找回密码</h2>
        {message && <div className="message success">{message}</div>}
        {error && <div className="message error">{error}</div>}

        {step === 1 && (
          <div className="step-container">
            <div className="input-group">
              <label htmlFor="email">手机号或邮箱</label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入注册时使用的手机号或邮箱"
              />
            </div>
            <button onClick={handleSendCode} disabled={isSending}>
              {isSending ? '发送中...' : '发送验证码'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-container">
            <div className="input-group">
              <label htmlFor="code">验证码</label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入您收到的验证码"
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">新密码</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入新密码（不少于6位）"
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirmPassword">确认密码</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
            </div>
            <button onClick={handleResetPassword}>重置密码</button>
          </div>
        )}

        {step === 3 && (
          <div className="step-container">
            <p>您的密码已成功重置。</p>
            {/* 可以添加一个链接返回登录页 */}
            <a href="/login">返回登录</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModule;
