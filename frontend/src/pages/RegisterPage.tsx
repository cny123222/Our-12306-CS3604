import React from 'react'
import { useNavigate } from 'react-router-dom'
import TopNavigation from '../components/TopNavigation'
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
      <main className="register-main">
        <div className="register-container">
          <RegisterForm 
            onSubmit={handleSubmit}
            onNavigateToLogin={handleNavigateToLogin}
          />
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}

export default RegisterPage

