import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SmsVerificationModal from '../../src/components/SmsVerificationModal'

describe('SmsVerificationModal - 登录短信验证', () => {
  const mockOnClose = vi.fn()
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该渲染登录短信验证模态框', () => {
    render(<SmsVerificationModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)
    
    expect(screen.getByText('短信验证')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入登录绑定的证件号后4位')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('输入验证码')).toBeInTheDocument()
  })

  it('应该处理证件号后4位输入', async () => {
    render(<SmsVerificationModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)
    
    const idCardInput = screen.getByPlaceholderText('请输入登录绑定的证件号后4位')
    await userEvent.type(idCardInput, '1234')
    
    expect(idCardInput).toHaveValue('1234')
  })

  it('应该处理验证码输入', async () => {
    render(<SmsVerificationModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)
    
    const codeInput = screen.getByPlaceholderText('输入验证码')
    await userEvent.type(codeInput, '123456')
    
    expect(codeInput).toHaveValue('123456')
  })

  it('点击发送验证码按钮应该验证证件号', async () => {
    render(<SmsVerificationModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)
    
    const sendButton = screen.getByText('获取验证码')
    
    // 按钮应该被禁用，因为证件号为空
    expect(sendButton).toBeDisabled()
  })

  it('应该在证件号正确时发送验证码', async () => {
    const consoleSpy = vi.spyOn(console, 'log')
    
    render(<SmsVerificationModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)
    
    const idCardInput = screen.getByPlaceholderText('请输入登录绑定的证件号后4位')
    await userEvent.type(idCardInput, '1234')
    
    const sendButton = screen.getByText('获取验证码')
    await userEvent.click(sendButton)
    
    expect(consoleSpy).toHaveBeenCalledWith('Sending SMS for ID card last 4:', '1234')
    
    consoleSpy.mockRestore()
  })

  it('应该在信息完整时提交表单', async () => {
    render(<SmsVerificationModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)
    
    const idCardInput = screen.getByPlaceholderText('请输入登录绑定的证件号后4位')
    const codeInput = screen.getByPlaceholderText('输入验证码')
    
    await userEvent.type(idCardInput, '1234')
    await userEvent.type(codeInput, '123456')
    
    const submitButton = screen.getByText('确定')
    await userEvent.click(submitButton)
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      idCardLast4: '1234',
      code: '123456'
    })
  })

  it('应该在信息不完整时禁用表单提交', async () => {
    render(<SmsVerificationModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)
    
    // 只填写证件号，不填验证码
    const idCardInput = screen.getByPlaceholderText('请输入登录绑定的证件号后4位')
    await userEvent.type(idCardInput, '1234')
    
    const submitButton = screen.getByText('确定')
    await userEvent.click(submitButton)
    
    // 表单不应提交（因为验证码为空，HTML5表单验证会阻止）
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('点击关闭按钮应该调用onClose', async () => {
    render(<SmsVerificationModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)
    
    const closeButton = screen.getByText('×')
    await userEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('应该显示倒计时按钮文本', async () => {
    render(<SmsVerificationModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)
    
    const idCardInput = screen.getByPlaceholderText('请输入登录绑定的证件号后4位')
    await userEvent.type(idCardInput, '1234')
    
    const sendButton = screen.getByText('获取验证码')
    await userEvent.click(sendButton)
    
    // 验证倒计时开始
    await waitFor(() => {
      expect(screen.getByText(/重新发送\(\d+s\)/)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('应该在倒计时期间禁用发送按钮', async () => {
    render(<SmsVerificationModal onClose={mockOnClose} onSubmit={mockOnSubmit} />)
    
    const idCardInput = screen.getByPlaceholderText('请输入登录绑定的证件号后4位')
    await userEvent.type(idCardInput, '1234')
    
    const sendButton = screen.getByText('获取验证码')
    await userEvent.click(sendButton)
    
    // 验证按钮被禁用
    await waitFor(() => {
      const button = screen.getByText(/重新发送\(\d+s\)/)
      expect(button).toBeDisabled()
    }, { timeout: 1000 })
  })
})
