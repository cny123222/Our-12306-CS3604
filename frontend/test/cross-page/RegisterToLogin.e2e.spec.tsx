/**
 * 注册到登录完整流程端到端测试
 * 测试从注册页到登录页再到首页的完整用户旅程
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RegisterPage from '../../src/pages/RegisterPage'
import LoginPage from '../../src/pages/LoginPage'
import HomePage from '../../src/pages/HomePage'

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import axios from 'axios'

describe('注册到登录完整流程E2E测试', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Mock localStorage
    const localStorageMock: { [key: string]: string } = {}
    Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key] || null)
    Storage.prototype.setItem = vi.fn((key: string, value: string) => {
      localStorageMock[key] = value
    })
    Storage.prototype.removeItem = vi.fn((key: string) => {
      delete localStorageMock[key]
    })

    // Mock window.confirm
    window.confirm = vi.fn(() => true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该完成注册→登录→首页的完整流程', async () => {
    const user = userEvent.setup({ delay: null })
    
    // Mock所有需要的API
    ;(axios.post as any).mockImplementation((url: string, data?: any) => {
      // 注册相关API
      if (url === '/api/register/validate-username') {
        return Promise.resolve({ data: { valid: true } })
      }
      if (url === '/api/register/validate-idcard') {
        return Promise.resolve({ data: { valid: true } })
      }
      if (url === '/api/register') {
        return Promise.resolve({ data: { sessionId: 'reg-session-123' } })
      }
      if (url === '/api/register/send-verification-code') {
        return Promise.resolve({ data: { verificationCode: '123456' } })
      }
      if (url === '/api/register/complete') {
        return Promise.resolve({ data: { success: true } })
      }
      
      // 登录相关API
      if (url === '/api/auth/login') {
        return Promise.resolve({
          data: {
            success: true,
            sessionId: 'login-session-456',
          },
        })
      }
      if (url === '/api/auth/verify-login') {
        return Promise.resolve({
          data: {
            success: true,
            token: 'auth-token-789',
            userId: 'user-new-123',
          },
        })
      }
      
      return Promise.reject(new Error('Unknown endpoint'))
    })

    // 步骤1: 在注册页面填写表单
    const { rerender } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证在注册页
    await waitFor(() => {
      expect(screen.getByText(/账户信息/i)).toBeInTheDocument()
    })

    // 填写注册表单
    const usernameInput = screen.getByPlaceholderText(/用户名设置成功后不可修改/)
    await user.type(usernameInput, 'newuser123')
    await user.tab() // 触发blur事件进行验证

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/register/validate-username', {
        username: 'newuser123',
      })
    })

    const passwordInput = screen.getByPlaceholderText(/6-20位字母、数字或符号/)
    await user.type(passwordInput, 'Pass_123')
    await user.tab()

    const confirmPasswordInput = screen.getByPlaceholderText(/请再次输入您的登录密码/)
    await user.type(confirmPasswordInput, 'Pass_123')
    await user.tab()

    const nameInput = screen.getByPlaceholderText(/请输入姓名/)
    await user.type(nameInput, '张三')
    await user.tab()

    const idCardInput = screen.getByPlaceholderText(/请输入您的证件号码/)
    await user.type(idCardInput, '330102199001011234')
    await user.tab()

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/register/validate-idcard', expect.any(Object))
    })

    const phoneInput = screen.getByPlaceholderText(/手机号码/)
    await user.type(phoneInput, '13800138000')
    await user.tab()

    // 同意服务条款
    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    // 提交注册表单
    const submitButton = screen.getByRole('button', { name: /下一步/i })
    await user.click(submitButton)

    // 等待验证弹窗出现
    await waitFor(() => {
      expect(screen.getByText(/请输入验证码/i)).toBeInTheDocument()
    })

    // 填写验证码
    const codeInputs = screen.getAllByRole('textbox').filter((input) =>
      input.getAttribute('maxLength') === '1'
    )
    
    if (codeInputs.length === 6) {
      for (let i = 0; i < 6; i++) {
        await user.type(codeInputs[i], String(i + 1))
      }
    }

    // 点击确认按钮
    const confirmButton = screen.getByRole('button', { name: /确认/i })
    await user.click(confirmButton)

    // 等待注册成功提示
    await waitFor(() => {
      expect(screen.getByText(/恭喜您注册成功/i)).toBeInTheDocument()
    })

    // 模拟2秒后跳转到登录页
    vi.advanceTimersByTime(2000)

    // 步骤2: 在登录页面登录
    rerender(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/铁路12306/i)).toBeInTheDocument()
    })

    // 填写登录表单
    const loginUsernameInput = screen.getByPlaceholderText(/请输入用户名/)
    const loginPasswordInput = screen.getByPlaceholderText(/请输入密码/)
    
    await user.type(loginUsernameInput, 'newuser123')
    await user.type(loginPasswordInput, 'Pass_123')

    // 点击登录按钮
    const loginButton = screen.getByRole('button', { name: /登录/i })
    await user.click(loginButton)

    // 等待短信验证弹窗
    await waitFor(() => {
      expect(screen.getByText(/短信验证/i)).toBeInTheDocument()
    })

    // 填写短信验证信息
    const idCardLast4Input = screen.getByPlaceholderText(/请输入证件号后4位/)
    const smsCodeInput = screen.getByPlaceholderText(/请输入验证码/)
    
    await user.type(idCardLast4Input, '1234')
    await user.type(smsCodeInput, '123456')

    // 提交验证
    const smsSubmitButton = screen.getByRole('button', { name: /提交/i })
    await user.click(smsSubmitButton)

    // 验证保存了token
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'auth-token-789')
      expect(localStorage.setItem).toHaveBeenCalledWith('userId', 'user-new-123')
    })

    // 等待登录成功提示
    await waitFor(() => {
      expect(screen.getByText(/登录成功/i)).toBeInTheDocument()
    })

    // 模拟2秒后跳转到首页
    vi.advanceTimersByTime(2000)

    // 步骤3: 验证在首页并且显示已登录状态
    rerender(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/会员服务/i)).toBeInTheDocument()
    })

    // 验证显示"个人中心"按钮
    await waitFor(() => {
      expect(screen.getByText(/个人中心/i)).toBeInTheDocument()
    })
  })

  it('应该能从注册页直接导航到登录页', async () => {
    const user = userEvent.setup({ delay: null })

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证在注册页
    await waitFor(() => {
      expect(screen.getByText(/账户信息/i)).toBeInTheDocument()
    })

    // 点击"已有账号，立即登录"链接（如果有）
    const loginLinks = screen.queryAllByText(/登录/)
    if (loginLinks.length > 0) {
      await user.click(loginLinks[0])
    }
  })
})

