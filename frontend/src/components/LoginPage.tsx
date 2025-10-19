import React, { useState } from 'react'
import TopNavigation from './TopNavigation'
import LoginForm from './LoginForm'
import BottomNavigation from './BottomNavigation'
import SmsVerificationModal from './SmsVerificationModal'
import './LoginPage.css'

interface LoginPageProps {
  onLoginSuccess?: (sessionId: string) => void
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSmsModal, setShowSmsModal] = useState(false)

  const handleLogin = async (data: { username: string; password: string }) => {
    setIsLoading(true)
    setError('')
    
    try {
      // 模拟登录API调用
      console.log('Login attempt:', data)
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟登录成功
      const sessionId = 'mock-session-' + Date.now()
      if (onLoginSuccess) {
        onLoginSuccess(sessionId)
      }
    } catch (err) {
      setError('登录失败，请检查用户名和密码')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSmsLogin = () => {
    setShowSmsModal(true)
  }

  const handleQrLogin = () => {
    console.log('QR code login initiated')
    // 实现二维码登录逻辑
  }

  const handleRegister = () => {
    console.log('Navigate to register page')
    // 实现注册页面跳转
  }

  const handleForgotPassword = () => {
    console.log('Navigate to forgot password page')
    // 实现忘记密码页面跳转
  }

  const handleLogoClick = () => {
    console.log('Logo clicked - navigate to home')
    // 实现首页跳转
  }

  const handleQrCodeClick = (type: 'official' | 'wechat' | 'app' | 'service') => {
    console.log('QR code clicked:', type)
    // 实现二维码点击处理
  }

  const handleSmsModalClose = () => {
    setShowSmsModal(false)
  }

  const handleSmsVerificationSubmit = (data: { phone: string; code: string }) => {
    console.log('SMS verification:', data)
    setShowSmsModal(false)
    // 实现短信验证登录逻辑
  }

  return (
    <div className="login-page">
      <TopNavigation onLogoClick={handleLogoClick} />
      
      <div className="login-content">
        <div className="background-container">
          <div className="background-image"></div>
          <div className="content-overlay">
            <div className="left-content">
              <div className="promotion-text">
                <h1>铁路12306 - 中国铁路官方APP</h1>
                <h2>尽享精彩出行服务</h2>
                <div className="features-list">
                  <div className="feature-item">
                    <span className="feature-icon">🎫</span>
                    <span>个人行程规划</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🚄</span>
                    <span>购票及改签</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📱</span>
                    <span>手机购票</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🎯</span>
                    <span>精准推荐</span>
                  </div>
                </div>
              </div>
              <div className="app-download">
                <div className="download-text">
                  <p>扫码下载铁路12306</p>
                  <p>享受更便捷的出行服务</p>
                </div>
                <div className="download-qr">
                  <img src="/images/qr-app-download.png" alt="下载APP" className="download-qr-image" />
                </div>
              </div>
            </div>
            
            <div className="right-content">
              <LoginForm
                onSubmit={handleLogin}
                onSmsLogin={handleSmsLogin}
                onQrLogin={handleQrLogin}
                onRegister={handleRegister}
                onForgotPassword={handleForgotPassword}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </div>
      </div>
      
      <BottomNavigation onQrCodeClick={handleQrCodeClick} />
      
      {showSmsModal && (
        <SmsVerificationModal
          onClose={handleSmsModalClose}
          onSubmit={handleSmsVerificationSubmit}
        />
      )}
    </div>
  )
}

export default LoginPage