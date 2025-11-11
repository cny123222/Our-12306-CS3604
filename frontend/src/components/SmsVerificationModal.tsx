import React, { useState } from 'react'
import axios from 'axios'
import './SmsVerificationModal.css'

interface SmsVerificationModalProps {
  sessionId: string
  onClose: () => void
  onSubmit: (data: { idCardLast4: string; code: string }) => void
}

const SmsVerificationModal: React.FC<SmsVerificationModalProps> = ({ sessionId, onClose, onSubmit }) => {
  const [idCardLast4, setIdCardLast4] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendCode = async () => {
    if (!idCardLast4 || idCardLast4.length !== 4) {
      alert('请输入证件号后4位')
      return
    }

    setIsLoading(true)
    try {
      // 调用发送验证码API
      const response = await axios.post('/api/auth/send-verification-code', {
        sessionId,
        idCardLast4
      })
      
      if (response.data.success) {
        // 从后端获取真实验证码（开发环境）
        const realCode = response.data.verificationCode
        if (realCode) {
          console.log(`\n=================================`)
          console.log(`📱 登录验证码`)
          console.log(`验证码: ${realCode}`)
          console.log(`有效期: 5分钟`)
          console.log(`=================================\n`)
        }
        
        // 开始倒计时
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch (error: any) {
      console.error('Failed to send SMS:', error)
      const errorMsg = error.response?.data?.error || '发送验证码失败，请重试'
      alert(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!idCardLast4 || !code) {
      alert('请填写完整信息')
      return
    }
    
    onSubmit({ idCardLast4, code })
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="sms-modal-backdrop" onClick={handleBackdropClick}>
      <div className="sms-modal">
        <div className="sms-modal-header">
          <h3>短信验证登录</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <form className="sms-modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>证件号后4位</label>
            <input
              type="text"
              placeholder="请输入登录绑定的证件号后4位"
              value={idCardLast4}
              onChange={(e) => setIdCardLast4(e.target.value)}
              maxLength={4}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label>验证码</label>
            <div className="code-input-group">
              <input
                type="text"
                placeholder="请输入验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="form-input code-input"
                required
              />
              <button
                type="button"
                className="send-code-button"
                onClick={handleSendCode}
                disabled={countdown > 0 || isLoading}
              >
                {countdown > 0 ? `${countdown}s` : isLoading ? '发送中...' : '获取验证码'}
              </button>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="submit-button">
              登录
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SmsVerificationModal