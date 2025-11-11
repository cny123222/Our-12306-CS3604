import React from 'react'
import { useNavigate } from 'react-router-dom'
import TopNavigation from '../components/TopNavigation'
import MainNavigation from '../components/MainNavigation'
import BottomNavigation from '../components/BottomNavigation'
import RegisterForm from '../components/RegisterForm'
import './RegisterPage.css'

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()

  const handleSubmit = (data: any) => {
    console.log('Registration submitted:', data)
    // 注册成功后的处理逻辑
  }

  const handleNavigateToLogin = () => {
    navigate('/login')
  }

  return (
    <div className="register-page">
      <TopNavigation />
      <MainNavigation />
      <main className="register-main">
        {/* 面包屑导航 */}
        <div className="breadcrumb">
          您现在的位置：<a href="/">客运首页</a>
          <span className="breadcrumb-separator">&gt;</span>
          <span>注册</span>
        </div>

        {/* 注册表单容器 */}
        <div className="register-container">
          {/* 页面标题 */}
          <div className="register-header">账户信息</div>
          
          {/* 表单内容 */}
          <div className="register-content">
            <RegisterForm 
              onSubmit={handleSubmit}
              onNavigateToLogin={handleNavigateToLogin}
            />
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}

export default RegisterPage

