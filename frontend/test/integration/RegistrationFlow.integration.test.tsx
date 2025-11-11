/**
 * 注册流程集成测试
 * 测试文件：frontend/test/integration/RegistrationFlow.integration.test.tsx
 * 
 * 测试完整的用户注册流程：
 * 1. 填写注册表单
 * 2. 提交并显示验证弹窗
 * 3. 输入验证码
 * 4. 完成注册并跳转
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import RegisterPage from '../../src/pages/RegisterPage'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock导航
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock alert
global.alert = vi.fn()

// Mock confirm
global.confirm = vi.fn(() => true)

describe('注册流程集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  // ==================== 完整注册流程测试 ====================
  describe('完整注册流程', () => {
    it('应该完成完整的注册流程：填表 → 验证 → 成功', async () => {
      // Given: Mock后端API
      mockedAxios.post.mockImplementation((url) => {
        if (url === '/api/auth/validate-username') {
          return Promise.resolve({ data: { valid: true } })
        }
        if (url === '/api/auth/validate-idcard') {
          return Promise.resolve({ data: { valid: true } })
        }
        if (url === '/api/auth/register') {
          return Promise.resolve({
            data: { sessionId: 'test-session-123' }
          })
        }
        if (url === '/api/auth/send-registration-verification-code') {
          return Promise.resolve({ data: { message: '验证码发送成功' } })
        }
        if (url === '/api/auth/complete-registration') {
          return Promise.resolve({
            data: { message: '恭喜您注册成功，请到登录页面进行登录！' }
          })
        }
        return Promise.reject(new Error('Unknown API'))
      })

      // When: 渲染注册页面
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      )

      // Step 1: 填写注册表单
      const usernameInput = screen.getByPlaceholderText(/用户名设置成功后不可修改/)
      await userEvent.type(usernameInput, 'testuser123')
      fireEvent.blur(usernameInput)

      const passwordInput = screen.getByPlaceholderText(/6-20位字母、数字或号/)
      await userEvent.type(passwordInput, 'Test123_')

      const confirmPasswordInputs = screen.getAllByPlaceholderText(/6-20位字母、数字或号/)
      await userEvent.type(confirmPasswordInputs[1], 'Test123_')

      const nameInput = screen.getByPlaceholderText(/^请输入姓名$/)
      await userEvent.type(nameInput, '测试用户')

      const idCardInput = screen.getByPlaceholderText(/请输入您的证件号码/)
      await userEvent.type(idCardInput, '110101199001011234')
      fireEvent.blur(idCardInput)

      const phoneInput = screen.getByPlaceholderText(/手机号码/)
      await userEvent.type(phoneInput, '13800138000')

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      // Step 2: 提交表单
      const submitButton = screen.getByRole('button', { name: /下一步/ })
      fireEvent.click(submitButton)

      // Then: 应该调用注册API
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/auth/register',
          expect.objectContaining({
            username: 'testuser123',
            phone: '13800138000'
          })
        )
      })

      // Then: 应该调用发送验证码API
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/auth/send-registration-verification-code',
          expect.objectContaining({
            sessionId: 'test-session-123',
            phone: '13800138000'
          })
        )
      })

      // Then: 应该显示验证弹窗
      await waitFor(() => {
        expect(screen.getByText('手机双向验证')).toBeInTheDocument()
      })

      // Step 3: 输入验证码
      const codeInput = screen.getByPlaceholderText('请输入6位验证码')
      await userEvent.type(codeInput, '123456')

      // Step 4: 点击完成注册
      const completeButton = screen.getByRole('button', { name: /完成注册/ })
      fireEvent.click(completeButton)

      // Then: 应该调用完成注册API
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/auth/complete-registration',
          expect.objectContaining({
            sessionId: 'test-session-123',
            smsCode: '123456'
          })
        )
      })

      // Then: 应该显示成功提示
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          '恭喜您注册成功，请到登录页面进行登录！'
        )
      })

      // Step 5: 2秒后应该跳转到登录页
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })
  })

  // ==================== 验证码错误处理测试 ====================
  describe('验证码错误处理', () => {
    it('输入错误的验证码应该显示错误提示', async () => {
      // Given: Mock后端API，验证码错误
      mockedAxios.post.mockImplementation((url) => {
        if (url === '/api/auth/register') {
          return Promise.resolve({ data: { sessionId: 'test-session-123' } })
        }
        if (url === '/api/auth/send-registration-verification-code') {
          return Promise.resolve({ data: { message: '验证码发送成功' } })
        }
        if (url === '/api/auth/complete-registration') {
          return Promise.reject({
            response: { data: { error: '验证码错误或已过期' } }
          })
        }
        return Promise.resolve({ data: { valid: true } })
      })

      // When: 完成注册流程直到验证码输入
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      )

      // 快速填写表单
      await userEvent.type(screen.getByPlaceholderText(/用户名设置成功后不可修改/), 'testuser')
      await userEvent.type(screen.getByPlaceholderText(/6-20位字母、数字或号/), 'Test123_')
      const confirmInputs = screen.getAllByPlaceholderText(/6-20位字母、数字或号/)
      await userEvent.type(confirmInputs[1], 'Test123_')
      await userEvent.type(screen.getByPlaceholderText(/^请输入姓名$/), '测试')
      await userEvent.type(screen.getByPlaceholderText(/请输入您的证件号码/), '110101199001011234')
      await userEvent.type(screen.getByPlaceholderText(/手机号码/), '13800138000')
      fireEvent.click(screen.getByRole('checkbox'))
      fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

      // 等待验证弹窗出现
      await waitFor(() => {
        expect(screen.getByText('手机双向验证')).toBeInTheDocument()
      })

      // When: 输入错误的验证码
      const codeInput = screen.getByPlaceholderText('请输入6位验证码')
      await userEvent.type(codeInput, '999999')
      const completeButton = screen.getByRole('button', { name: /完成注册/ })
      fireEvent.click(completeButton)

      // Then: 应该显示错误提示
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('验证码错误或已过期')
      })

      // Then: 不应该跳转
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  // ==================== 返回修改功能测试 ====================
  describe('返回修改功能', () => {
    it('点击"返回修改"应该关闭验证弹窗', async () => {
      // Given: Mock后端API
      mockedAxios.post.mockImplementation((url) => {
        if (url === '/api/auth/register') {
          return Promise.resolve({ data: { sessionId: 'test-session-123' } })
        }
        if (url === '/api/auth/send-registration-verification-code') {
          return Promise.resolve({ data: { message: '验证码发送成功' } })
        }
        return Promise.resolve({ data: { valid: true } })
      })

      // When: 完成注册流程直到验证码输入
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      )

      // 填写并提交表单
      await userEvent.type(screen.getByPlaceholderText(/用户名设置成功后不可修改/), 'testuser')
      await userEvent.type(screen.getByPlaceholderText(/6-20位字母、数字或号/), 'Test123_')
      const confirmInputs = screen.getAllByPlaceholderText(/6-20位字母、数字或号/)
      await userEvent.type(confirmInputs[1], 'Test123_')
      await userEvent.type(screen.getByPlaceholderText(/^请输入姓名$/), '测试')
      await userEvent.type(screen.getByPlaceholderText(/请输入您的证件号码/), '110101199001011234')
      await userEvent.type(screen.getByPlaceholderText(/手机号码/), '13800138000')
      fireEvent.click(screen.getByRole('checkbox'))
      fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

      // 等待验证弹窗出现
      await waitFor(() => {
        expect(screen.getByText('手机双向验证')).toBeInTheDocument()
      })

      // When: 点击返回修改
      const backButton = screen.getByRole('button', { name: /返回修改/ })
      fireEvent.click(backButton)

      // Then: 验证弹窗应该关闭
      await waitFor(() => {
        expect(screen.queryByText('手机双向验证')).not.toBeInTheDocument()
      })

      // Then: 表单数据应该保留
      expect(screen.getByPlaceholderText(/用户名设置成功后不可修改/)).toHaveValue('testuser')
    })
  })

  // ==================== API错误处理测试 ====================
  describe('API错误处理', () => {
    it('注册API失败应该显示错误提示', async () => {
      // Given: Mock注册API失败
      mockedAxios.post.mockImplementation((url) => {
        if (url === '/api/auth/register') {
          return Promise.reject({
            response: { data: { error: '该用户名已经被占用' } }
          })
        }
        return Promise.resolve({ data: { valid: true } })
      })

      // When: 填写并提交表单
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      )

      await userEvent.type(screen.getByPlaceholderText(/用户名设置成功后不可修改/), 'testuser')
      await userEvent.type(screen.getByPlaceholderText(/6-20位字母、数字或号/), 'Test123_')
      const confirmInputs = screen.getAllByPlaceholderText(/6-20位字母、数字或号/)
      await userEvent.type(confirmInputs[1], 'Test123_')
      await userEvent.type(screen.getByPlaceholderText(/^请输入姓名$/), '测试')
      await userEvent.type(screen.getByPlaceholderText(/请输入您的证件号码/), '110101199001011234')
      await userEvent.type(screen.getByPlaceholderText(/手机号码/), '13800138000')
      fireEvent.click(screen.getByRole('checkbox'))
      fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

      // Then: 应该显示错误提示
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('该用户名已经被占用')
      })

      // Then: 不应该显示验证弹窗
      expect(screen.queryByText('手机双向验证')).not.toBeInTheDocument()
    })

    it('发送验证码API失败应该显示错误提示', async () => {
      // Given: Mock发送验证码API失败
      mockedAxios.post.mockImplementation((url) => {
        if (url === '/api/auth/register') {
          return Promise.resolve({ data: { sessionId: 'test-session-123' } })
        }
        if (url === '/api/auth/send-registration-verification-code') {
          return Promise.reject({
            response: { data: { error: '发送验证码失败' } }
          })
        }
        return Promise.resolve({ data: { valid: true } })
      })

      // When: 填写并提交表单
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      )

      await userEvent.type(screen.getByPlaceholderText(/用户名设置成功后不可修改/), 'testuser')
      await userEvent.type(screen.getByPlaceholderText(/6-20位字母、数字或号/), 'Test123_')
      const confirmInputs = screen.getAllByPlaceholderText(/6-20位字母、数字或号/)
      await userEvent.type(confirmInputs[1], 'Test123_')
      await userEvent.type(screen.getByPlaceholderText(/^请输入姓名$/), '测试')
      await userEvent.type(screen.getByPlaceholderText(/请输入您的证件号码/), '110101199001011234')
      await userEvent.type(screen.getByPlaceholderText(/手机号码/), '13800138000')
      fireEvent.click(screen.getByRole('checkbox'))
      fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

      // Then: 应该显示错误提示
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('发送验证码失败')
      })

      // Then: 不应该显示验证弹窗
      await waitFor(() => {
        expect(screen.queryByText('手机双向验证')).not.toBeInTheDocument()
      })
    })
  })

  // ==================== 控制台验证码输出测试 ====================
  describe('控制台验证码输出', () => {
    it('发送验证码后应该在控制台输出验证码信息', async () => {
      // Given: Mock console.log
      const consoleSpy = vi.spyOn(console, 'log')

      // Given: Mock后端API
      mockedAxios.post.mockImplementation((url) => {
        if (url === '/api/auth/register') {
          return Promise.resolve({ data: { sessionId: 'test-session-123' } })
        }
        if (url === '/api/auth/send-registration-verification-code') {
          return Promise.resolve({ data: { message: '验证码发送成功' } })
        }
        return Promise.resolve({ data: { valid: true } })
      })

      // When: 填写并提交表单
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      )

      await userEvent.type(screen.getByPlaceholderText(/用户名设置成功后不可修改/), 'testuser')
      await userEvent.type(screen.getByPlaceholderText(/6-20位字母、数字或号/), 'Test123_')
      const confirmInputs = screen.getAllByPlaceholderText(/6-20位字母、数字或号/)
      await userEvent.type(confirmInputs[1], 'Test123_')
      await userEvent.type(screen.getByPlaceholderText(/^请输入姓名$/), '测试')
      await userEvent.type(screen.getByPlaceholderText(/请输入您的证件号码/), '110101199001011234')
      await userEvent.type(screen.getByPlaceholderText(/手机号码/), '13800138000')
      fireEvent.click(screen.getByRole('checkbox'))
      fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

      // Then: 应该在控制台输出验证码
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringMatching(/向手机号 13800138000 发送验证码: \d{6}/)
        )
      })

      consoleSpy.mockRestore()
    })
  })
})

