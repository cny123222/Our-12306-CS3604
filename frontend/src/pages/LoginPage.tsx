import React, { useState } from 'react'
import TopNavigation from '../components/TopNavigation'
import LoginForm from '../components/LoginForm'
import BottomNavigation from '../components/BottomNavigation'
import SmsVerificationModal from '../components/SmsVerificationModal'
import '../components/LoginPage.css'

const LoginPage: React.FC = () => {
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLoginSuccess = (data: { username: string; password: string }) => {
    // TODO: 实现登录成功后的逻辑
    console.log('Login data:', data)
    setShowSmsModal(true)
  }

  const handleNavigateToRegister = () => {
    // TODO: 实现跳转到注册页面
    console.log('Navigate to register')
  }

  const handleNavigateToForgotPassword = () => {
    // TODO: 实现跳转到忘记密码页面
    console.log('Navigate to forgot password')
  }

  const handleSmsVerificationSuccess = () => {
    // TODO: 实现短信验证成功后的逻辑
    console.log('SMS verification success')
    setShowSmsModal(false)
  }

  const handleCloseSmsModal = () => {
    setShowSmsModal(false)
  }

  return (
    <div className="login-page">
      <TopNavigation onLogoClick={() => console.log('Logo clicked')} />
      
      <div className="login-content">
        <div className="login-promotion">
          <h1 className="promotion-title">
            铁路12306 - 中国铁路官方APP
          </h1>
          <h2 className="promotion-subtitle">
            尽享精彩出行服务
          </h2>
          
          <ul className="promotion-features">
            <li>个人行程提醒</li>
            <li>积分兑换</li>
            <li>餐饮·特产</li>
            <li>车站大屏</li>
          </ul>
          
          <div className="app-download">
            <div className="qr-code-section">
              <img src="/images/铁路12306二维码.png" alt="铁路12306二维码" />
              <div className="qr-code-text">
                扫描左侧二维码<br />
                安装 铁路12306
              </div>
            </div>
          </div>
        </div>
        
        <div className="login-form-container">
          <LoginForm
            onSubmit={handleLoginSuccess}
            onQrLogin={() => console.log('QR login')}
            onRegister={handleNavigateToRegister}
            onForgotPassword={handleNavigateToForgotPassword}
            error={error}
            isLoading={isLoading}
          />
        </div>
      </div>
      
      <BottomNavigation />
      
      {showSmsModal && (
        <SmsVerificationModal
          onClose={handleCloseSmsModal}
          onSubmit={(data) => {
            console.log('SMS verification data:', data)
            handleSmsVerificationSuccess()
          }}
        />
      )}
    </div>
  )
}

export default LoginPage