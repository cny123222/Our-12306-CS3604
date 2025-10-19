import React, { useState } from 'react'
import './SmsVerificationModal.css'

interface SmsVerificationModalProps {
  onClose: () => void
  onSubmit: (data: { phone: string; code: string }) => void
}

const SmsVerificationModal: React.FC<SmsVerificationModalProps> = ({ onClose, onSubmit }) => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      alert('请输入正确的手机号码')
      return
    }

    setIsLoading(true)
    try {
      // 模拟发送验证码
      console.log('Sending SMS to:', phone)
      
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
    
    if (!phone || !code) {
      alert('请填写完整信息')
      return
    }
    
    onSubmit({ phone, code })
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
            <label>手机号码</label>
            <input
              type="tel"
              placeholder="请输入11位手机号码"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
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