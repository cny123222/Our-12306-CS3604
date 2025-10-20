import React, { useState } from 'react'
import './SmsVerificationModal.css'

interface SmsVerificationModalProps {
  onClose: () => void
  onSubmit: (data: { idCardLast4: string; code: string }) => void
}

const SmsVerificationModal: React.FC<SmsVerificationModalProps> = ({ onClose, onSubmit }) => {
  const [idCardLast4, setIdCardLast4] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendCode = async () => {
    if (!idCardLast4 || idCardLast4.length !== 4) {
      alert('请输入正确的证件号后4位')
      return
    }

    setIsLoading(true)
    try {
      // 模拟发送验证码
      console.log('Sending SMS for ID card last 4:', idCardLast4)
      
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
      
    } catch (error) {
      console.error('Failed to send SMS:', error)
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
          <h3>选择验证方式</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="sms-modal-content">
          <div className="verification-type">短信验证</div>
          
          <form className="sms-modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
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
              <div className="code-input-group">
                <input
                  type="text"
                  placeholder="输入验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  className="form-input code-input"
                  required
                />
                <button
                  type="button"
                  className={`send-code-button ${idCardLast4.length === 4 && countdown === 0 ? 'enabled' : 'disabled'}`}
                  onClick={handleSendCode}
                  disabled={idCardLast4.length !== 4 || countdown > 0 || isLoading}
                >
                  {countdown > 0 ? `重新发送(${countdown}s)` : isLoading ? '发送中...' : '获取验证码'}
                </button>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="confirm-button">
                确定
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SmsVerificationModal