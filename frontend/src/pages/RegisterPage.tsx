import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import TopNavigation from '../components/TopNavigation'
import MainNavigation from '../components/MainNavigation'
import BottomNavigation from '../components/BottomNavigation'
import RegisterForm from '../components/RegisterForm'
import RegistrationVerificationModal from '../components/RegistrationVerificationModal'
import './RegisterPage.css'

interface RegistrationData {
  username: string;
  password: string;
  confirmPassword: string;
  idCardType: string;
  name: string;
  idCardNumber: string;
  discountType: string;
  email: string;
  phone: string;
  agreedToTerms: boolean;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null)
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false)
  const [verificationError, setVerificationError] = useState('')

  const handleSubmit = async (data: RegistrationData) => {
    console.log('Registration submitted:', data)
    
    try {
      // 步骤1: 提交注册信息到后端，获取sessionId
      const registerResponse = await axios.post('/api/register', data)
      
      const sessionId = registerResponse.data.sessionId
      if (!sessionId) {
        alert('注册失败：未获取到会话ID')
        return
      }
      
      // 保存注册数据和sessionId
      setRegistrationData({ ...data, sessionId } as any)
      
      // 步骤2: 发送验证码
      try {
        const verifyResponse = await axios.post('/api/register/send-verification-code', {
          sessionId,
          phone: data.phone
        })
        
        // 从后端获取真实验证码（开发环境）
        const realCode = verifyResponse.data.verificationCode
        if (realCode) {
          console.log(`\n=================================`)
          console.log(`📱 注册验证码`)
          console.log(`手机号: ${data.phone}`)
          console.log(`验证码: ${realCode}`)
          console.log(`有效期: 5分钟`)
          console.log(`=================================\n`)
        }
        
        // 显示验证弹窗
        setShowVerificationModal(true)
      } catch (verifyError: any) {
        console.error('Send verification code error:', verifyError)
        alert(verifyError.response?.data?.error || '发送验证码失败')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      if (error.response?.data?.error) {
        alert(error.response.data.error)
      } else {
        alert('注册失败，请稍后重试')
      }
    }
  }

  const handleVerificationComplete = async (code: string) => {
    if (!registrationData) {
      setVerificationError('注册信息丢失，请重新注册')
      return
    }

    const sessionId = (registrationData as any).sessionId
    if (!sessionId) {
      setVerificationError('会话信息丢失，请重新注册')
      return
    }

    try {
      // 清除之前的错误信息
      setVerificationError('')
      
      // 调用后端完成注册API
      await axios.post('/api/register/complete', {
        sessionId: sessionId,
        smsCode: code
      })

      // 显示成功状态
      setIsRegistrationSuccess(true)
      
      // 2秒后跳转到登录页
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      console.error('Verification error:', error)
      if (error.response?.data?.error) {
        setVerificationError(error.response.data.error)
      } else {
        setVerificationError('验证失败，请重试')
      }
    }
  }

  const handleVerificationBack = () => {
    setShowVerificationModal(false)
    setIsRegistrationSuccess(false)
    setVerificationError('')
  }

  const handleVerificationClose = () => {
    // 如果已经成功，直接关闭
    if (isRegistrationSuccess) {
      setShowVerificationModal(false)
      setIsRegistrationSuccess(false)
      setRegistrationData(null)
      setVerificationError('')
      return
    }
    
    if (window.confirm('确定要关闭验证弹窗吗？关闭后需要重新提交注册信息。')) {
      setShowVerificationModal(false)
      setRegistrationData(null)
      setVerificationError('')
    }
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
          您现在的位置：<Link to="/">客运首页</Link>
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

      {/* 验证弹窗 */}
      {showVerificationModal && registrationData && (
        <RegistrationVerificationModal
          phoneNumber={registrationData.phone}
          onClose={handleVerificationClose}
          onComplete={handleVerificationComplete}
          onBack={handleVerificationBack}
          isSuccess={isRegistrationSuccess}
          successMessage="恭喜您注册成功！正在跳转登录页..."
          externalError={verificationError}
        />
      )}
    </div>
  )
}

export default RegisterPage

