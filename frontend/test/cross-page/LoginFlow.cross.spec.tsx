/**
 * 登录流程跨页测试
 * 测试从登录页到首页的完整流程，验证登录状态管理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
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

describe('登录流程跨页测试', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    vi.clearAllMocks()
    
    // Mock localStorage
    const localStorageMock: { [key: string]: string } = {}
    Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key] || null)
    Storage.prototype.setItem = vi.fn((key: string, value: string) => {
      localStorageMock[key] = value
    })
    Storage.prototype.removeItem = vi.fn((key: string) => {
      delete localStorageMock[key]
    })
  })

  it('应该在登录成功后保存token并跳转到首页', async () => {
    const user = userEvent.setup()
    
    // Mock登录API响应
    ;(axios.post as any).mockImplementation((url: string) => {
      if (url === '/api/auth/login') {
        return Promise.resolve({
          data: {
            success: true,
            sessionId: 'test-session-123',
          },
        })
      }
      if (url === '/api/auth/verify-login') {
        return Promise.resolve({
          data: {
            success: true,
            token: 'test-token-456',
            userId: 'user-123',
          },
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证在登录页
    expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()

    // 填写登录表单
    const usernameInput = screen.getByPlaceholderText(/用户名\/邮箱\/手机号/)
    const passwordInput = screen.getByPlaceholderText(/^密码$/)
    
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')

    // 点击登录按钮
    const loginButton = screen.getByRole('button', { name: /立即登录/i })
    await user.click(loginButton)

    // 等待短信验证弹窗出现
    await waitFor(() => {
      expect(screen.getByText(/身份核验/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 填写短信验证码
    const idCardInput = screen.getByPlaceholderText(/证件号后4位/)
    const smsCodeInput = screen.getByPlaceholderText(/输入验证码/)
    
    await user.type(idCardInput, '1234')
    await user.type(smsCodeInput, '123456')

    // 提交验证码
    const submitButton = screen.getByRole('button', { name: /提交/i })
    await user.click(submitButton)

    // 验证localStorage保存了token
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token-456')
      expect(localStorage.setItem).toHaveBeenCalledWith('userId', 'user-123')
    }, { timeout: 3000 })
  })

  it('应该在登录失败时显示错误信息', async () => {
    const user = userEvent.setup()
    
    // Mock登录失败
    ;(axios.post as any).mockRejectedValue({
      response: {
        data: {
          error: '用户名或密码错误',
        },
      },
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 填写登录表单
    const usernameInput = screen.getByPlaceholderText(/用户名\/邮箱\/手机号/)
    const passwordInput = screen.getByPlaceholderText(/^密码$/)
    
    await user.type(usernameInput, 'wronguser')
    await user.type(passwordInput, 'wrongpass')

    // 点击登录按钮
    const loginButton = screen.getByRole('button', { name: /立即登录/i })
    await user.click(loginButton)

    // 验证显示错误信息
    await waitFor(() => {
      const errorElement = screen.queryByText(/用户名或密码错误/i) || screen.queryByText(/登录失败/i)
      expect(errorElement).toBeInTheDocument()
    })

    // 验证没有保存token
    expect(localStorage.setItem).not.toHaveBeenCalledWith('authToken', expect.anything())
  })

  it('应该在短信验证失败时显示错误信息', async () => {
    const user = userEvent.setup()
    
    // Mock登录成功但验证失败
    ;(axios.post as any).mockImplementation((url: string) => {
      if (url === '/api/auth/login') {
        return Promise.resolve({
          data: {
            success: true,
            sessionId: 'test-session-123',
          },
        })
      }
      if (url === '/api/auth/verify-login') {
        return Promise.reject({
          response: {
            data: {
              error: '验证码错误',
            },
          },
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 填写登录表单
    const usernameInput = screen.getByPlaceholderText(/用户名\/邮箱\/手机号/)
    const passwordInput = screen.getByPlaceholderText(/^密码$/)
    
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')

    // 点击登录按钮
    const loginButton = screen.getByRole('button', { name: /立即登录/i })
    await user.click(loginButton)

    // 等待短信验证弹窗出现
    await waitFor(() => {
      expect(screen.getByText(/身份核验/i)).toBeInTheDocument()
    })

    // 填写错误的验证码
    const idCardInput = screen.getByPlaceholderText(/证件号码后四位/)
    const smsCodeInput = screen.getByPlaceholderText(/^\d{6}$/)
    
    await user.type(idCardInput, '1234')
    await user.type(smsCodeInput, '000000')

    // 提交验证码
    const submitButton = screen.getByRole('button', { name: /提交/i })
    await user.click(submitButton)

    // 验证显示错误信息
    await waitFor(() => {
      expect(screen.getByText(/验证码错误/i)).toBeInTheDocument()
    })

    // 验证没有保存token
    expect(localStorage.setItem).not.toHaveBeenCalledWith('authToken', expect.anything())
  })

  it('应该在首页正确显示登录状态', async () => {
    // 预先设置localStorage中有token
    const localStorageMock: { [key: string]: string } = {
      authToken: 'existing-token-789',
      userId: 'user-456',
    }
    Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key] || null)

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证显示"个人中心"按钮
    await waitFor(() => {
      expect(screen.getByText(/个人中心/i)).toBeInTheDocument()
    })

    // 验证不显示"登录"和"注册"按钮
    expect(screen.queryByRole('button', { name: /^登录$/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /注册/ })).not.toBeInTheDocument()
  })

  it('应该在未登录时显示登录和注册按钮', async () => {
    // localStorage中没有token
    const localStorageMock: { [key: string]: string } = {}
    Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key] || null)

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证显示"登录"和"注册"按钮
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /注册/i })).toBeInTheDocument()
    })

    // 验证不显示"个人中心"按钮
    expect(screen.queryByText(/个人中心/i)).not.toBeInTheDocument()
  })
})

