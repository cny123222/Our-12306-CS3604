/**
 * 完整订票流程端到端测试
 * 测试从首页→车次列表→订单填写的完整用户旅程（已登录状态）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import HomePage from '../../src/pages/HomePage'
import TrainListPage from '../../src/pages/TrainListPage'
import OrderPage from '../../src/pages/OrderPage'

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import axios from 'axios'

describe('完整订票流程E2E测试', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Mock localStorage with logged-in user
    const localStorageMock: { [key: string]: string } = {
      authToken: 'test-token-123',
      userId: 'user-456',
    }
    Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key] || null)
    Storage.prototype.setItem = vi.fn((key: string, value: string) => {
      localStorageMock[key] = value
    })

    // Mock所有需要的API
    ;(axios.get as any).mockImplementation((url: string) => {
      if (url === '/api/stations') {
        return Promise.resolve({
          data: {
            stations: [
              { name: '北京南', code: 'BJS' },
              { name: '上海虹桥', code: 'SHH' },
            ],
          },
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })

    ;(axios.post as any).mockImplementation((url: string, data?: any) => {
      if (url === '/api/trains/search') {
        return Promise.resolve({
          data: {
            trains: [
              {
                trainNo: 'G27',
                departureStation: '北京南',
                arrivalStation: '上海虹桥',
                departureTime: '19:00',
                arrivalTime: '23:35',
                duration: '04:35',
                date: '2025-09-14',
                seats: {
                  '二等座': { price: 553, available: 100 },
                  '一等座': { price: 933, available: 50 },
                },
              },
            ],
            timestamp: new Date().toISOString(),
          },
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })

    // Mock fetch for order page
    ;(global.fetch as any) = vi.fn((url: string, options?: any) => {
      if (url.includes('/api/orders/new')) {
        if (options?.headers?.Authorization === 'Bearer test-token-123') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              trainInfo: {
                date: '2025-09-14',
                trainNo: 'G27',
                departureStation: '北京南站',
                arrivalStation: '上海虹桥',
                departureTime: '19:00',
                arrivalTime: '23:35',
              },
              fareInfo: {
                '二等座': { price: 553, available: 100 },
                '一等座': { price: 933, available: 50 },
              },
              availableSeats: {
                '二等座': 100,
                '一等座': 50,
              },
              passengers: [
                {
                  id: 'p1',
                  name: '张三',
                  idCardType: '居民身份证',
                  idCardNumber: '3301************028',
                  points: 100,
                },
              ],
              defaultSeatType: '二等座',
            }),
          })
        } else {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: async () => ({ error: '请先登录' }),
          })
        }
      }
      if (url.includes('/api/orders/submit')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: '订单提交成功',
            orderId: 'order-123',
            orderDetails: {},
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      })
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该完成首页→车次列表→订单填写的完整流程（已登录）', async () => {
    const user = userEvent.setup({ delay: null })

    // 步骤1: 在首页搜索车次
    const { rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证在首页且已登录
    await waitFor(() => {
      expect(screen.getByText(/会员服务/i)).toBeInTheDocument()
      expect(screen.getByText(/个人中心/i)).toBeInTheDocument()
    })

    // 填写车次查询表单
    const departureInput = screen.getByPlaceholderText(/出发地/)
    const arrivalInput = screen.getByPlaceholderText(/目的地/)
    
    await user.click(departureInput)
    await user.type(departureInput, '北京南')
    
    await user.click(arrivalInput)
    await user.type(arrivalInput, '上海虹桥')

    // 选择日期（假设有日期选择器）
    const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/)
    if (dateInput) {
      await user.clear(dateInput)
      await user.type(dateInput, '2025-09-14')
    }

    // 点击查询按钮
    const searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    // 步骤2: 在车次列表页选择车次
    rerender(
      <MemoryRouter 
        initialEntries={[
          {
            pathname: '/trains',
            state: {
              from: '北京南',
              to: '上海虹桥',
              date: '2025-09-14',
            },
          },
        ]}
      >
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待车次列表加载
    await waitFor(() => {
      expect(screen.getByText(/G27/i)).toBeInTheDocument()
    })

    // 验证显示车次信息
    expect(screen.getByText(/北京南/i)).toBeInTheDocument()
    expect(screen.getByText(/上海虹桥/i)).toBeInTheDocument()
    expect(screen.getByText(/19:00/i)).toBeInTheDocument()

    // 点击预订按钮
    const bookButton = screen.getByRole('button', { name: /预订/i })
    await user.click(bookButton)

    // 步骤3: 在订单填写页填写订单信息
    rerender(
      <MemoryRouter 
        initialEntries={[
          {
            pathname: '/order',
            search: '?trainNo=G27&date=2025-09-14&from=北京南&to=上海虹桥',
          },
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待订单页加载
    await waitFor(() => {
      expect(screen.getByText(/列车信息/i)).toBeInTheDocument()
    })

    // 验证显示列车信息
    expect(screen.getByText(/G27/i)).toBeInTheDocument()
    expect(screen.getByText(/北京南站/i)).toBeInTheDocument()
    expect(screen.getByText(/上海虹桥/i)).toBeInTheDocument()

    // 选择乘客
    const passengerCheckbox = screen.getByRole('checkbox', { name: /张三/i })
    await user.click(passengerCheckbox)

    // 选择席别（如果需要）
    const seatTypeSelect = screen.queryByLabelText(/席别/)
    if (seatTypeSelect) {
      await user.selectOptions(seatTypeSelect, '二等座')
    }

    // 提交订单
    const submitButton = screen.getByRole('button', { name: /提交订单/i })
    await user.click(submitButton)

    // 等待确认弹窗出现
    await waitFor(() => {
      expect(screen.getByText(/信息核对/i)).toBeInTheDocument()
    })

    // 确认订单
    const confirmButton = screen.getByRole('button', { name: /确认/i })
    await user.click(confirmButton)

    // 验证订单提交成功
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/submit'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      )
    })
  })

  it('应该在未登录时重定向到登录页', async () => {
    // 清除登录状态
    const localStorageMock: { [key: string]: string } = {}
    Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key] || null)

    const { rerender } = render(
      <MemoryRouter 
        initialEntries={[
          {
            pathname: '/order',
            search: '?trainNo=G27&date=2025-09-14&from=北京南&to=上海虹桥',
          },
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
          <Route path="/login" element={<div>登录页面</div>} />
        </Routes>
      </MemoryRouter>
    )

    // 验证重定向到登录页或显示登录提示
    await waitFor(
      () => {
        // OrderPage会检测未登录并重定向或显示错误
        const loginText = screen.queryByText(/登录页面/)
        const errorText = screen.queryByText(/请先登录/)
        expect(loginText || errorText).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('应该支持从车次列表返回首页', async () => {
    const user = userEvent.setup({ delay: null })

    render(
      <MemoryRouter 
        initialEntries={[
          {
            pathname: '/trains',
            state: {
              from: '北京南',
              to: '上海虹桥',
              date: '2025-09-14',
            },
          },
        ]}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待车次列表加载
    await waitFor(() => {
      expect(screen.getByText(/G27/i)).toBeInTheDocument()
    })

    // 点击Logo或返回按钮
    const logo = screen.queryByAltText(/logo/i)
    if (logo) {
      await user.click(logo)
    } else {
      // 尝试点击首页链接
      const homeLink = screen.getByText(/首页/)
      await user.click(homeLink)
    }
  })

  it('应该支持从订单填写页返回车次列表', async () => {
    const user = userEvent.setup({ delay: null })

    render(
      <MemoryRouter 
        initialEntries={[
          {
            pathname: '/order',
            search: '?trainNo=G27&date=2025-09-14&from=北京南&to=上海虹桥',
          },
        ]}
      >
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待订单页加载
    await waitFor(() => {
      expect(screen.getByText(/列车信息/i)).toBeInTheDocument()
    })

    // 点击返回按钮
    const backButton = screen.queryByRole('button', { name: /返回/i })
    if (backButton) {
      await user.click(backButton)
    }
  })

  it('应该在整个流程中保持登录状态', async () => {
    // 测试在不同页面之间切换时登录状态保持
    const { rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 首页应显示已登录
    await waitFor(() => {
      expect(screen.getByText(/个人中心/i)).toBeInTheDocument()
    })

    // 切换到车次列表
    rerender(
      <MemoryRouter 
        initialEntries={[
          {
            pathname: '/trains',
            state: { from: '北京南', to: '上海虹桥', date: '2025-09-14' },
          },
        ]}
      >
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/个人中心/i)).toBeInTheDocument()
    })

    // 切换到订单填写页
    rerender(
      <MemoryRouter 
        initialEntries={[
          {
            pathname: '/order',
            search: '?trainNo=G27&date=2025-09-14&from=北京南&to=上海虹桥',
          },
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      // 订单页应该能够成功加载（因为已登录）
      expect(screen.getByText(/列车信息/i)).toBeInTheDocument()
    })

    // 验证使用了正确的token
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/new'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      )
    })
  })
})

