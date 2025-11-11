import React from 'react'
import './TopNavigation.css'

interface TopNavigationProps {
  onLogoClick?: () => void
}

const TopNavigation: React.FC<TopNavigationProps> = ({ onLogoClick }) => {
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick()
    }
  }

  return (
    <div className="top-navigation">
      <div className="logo-section" onClick={handleLogoClick}>
        <img 
          src="/images/logo.png" 
          alt="中国铁路12306" 
          className="logo-image"
        />
        <div className="logo-text">
          <div className="logo-chinese">中国铁路12306</div>
          <div className="logo-english">12306 CHINA RAILWAY</div>
        </div>
      </div>
      <div className="welcome-section">
        <span className="welcome-text">您好，请</span>
        <a href="/login" className="login-link">登录</a>
        <a href="/register" className="register-link">注册</a>
      </div>
    </div>
  )
}

export default TopNavigation