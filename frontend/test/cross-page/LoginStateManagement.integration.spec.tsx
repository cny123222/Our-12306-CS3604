/**
 * 登录状态管理集成测试
 * 验证登录状态在所有页面中的正确传递和显示
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import HomePage from '../../src/pages/HomePage'
import TrainListPage from '../../src/pages/TrainListPage'
import OrderPage from '../../src/pages/OrderPage'

// Mock trainService
vi.mock('../../src/services/trainService', () => ({
  searchTrains: vi.fn(() =>
    Promise.resolve({
      success: true,
      trains: [
        {
          trainNo: 'G27',
          departureStation: '上海',
          arrivalStation: '北京',
          departureTime: '19:00',
          arrivalTime: '23:35',
          duration: 275,
          departureDate: '2025-09-14',
          availableSeats: {
            '二等座': 100,
            '一等座': 50,
          },
        },
      ],
    })
  ),
}))

describe('登录状态管理集成测试', () => {
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    window.history.pushState({}, '', '/')
    vi.clearAllMocks()

    // Mock localStorage
    localStorageMock = {}
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageMock[key]
        }),
        clear: vi.fn(() => {
          localStorageMock = {}
        }),
      },
      writable: true,
    })

    // Mock fetch for order page
    ;(global.fetch as any) = vi.fn((url: string, options?: any) => {
      if (url.includes('/api/orders/new')) {
        if (options?.headers?.Authorization) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              trainInfo: {
                date: '2025-09-14',
                trainNo: 'G27',
                departureStation: '上海',
                arrivalStation: '北京',
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
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      })
    })
  })

  it('应该在未登录状态下在所有页面显示"登录"和"注册"按钮', async () => {
    // 首页
    const { rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /注册/i })).toBeInTheDocument()
      expect(screen.queryByText(/个人中心/i)).not.toBeInTheDocument()
    })

    // 车次列表页
    rerender(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/trains',
            state: {
              departureStation: '上海',
              arrivalStation: '北京',
              departureDate: '2025-09-14',
            },
          },
        ]}
      >
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /注册/i })).toBeInTheDocument()
      expect(screen.queryByText(/个人中心/i)).not.toBeInTheDocument()
    })
  })

  it('应该在已登录状态下在所有页面显示"个人中心"按钮', async () => {
    // 模拟已登录状态
    localStorageMock['authToken'] = 'test-token-123'
    localStorageMock['userId'] = 'user-456'

    // 首页
    const { rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/个人中心/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^登录$/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /注册/i })).not.toBeInTheDocument()
    })

    // 车次列表页
    rerender(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/trains',
            state: {
              departureStation: '上海',
              arrivalStation: '北京',
              departureDate: '2025-09-14',
            },
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
      expect(screen.queryByRole('button', { name: /^登录$/i })).not.toBeInTheDocument()
    })

    // 订单填写页
    rerender(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/order',
            state: {
              trainNo: 'G27',
              departureStation: '上海',
              arrivalStation: '北京',
              departureDate: '2025-09-14',
            },
          },
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/个人中心/i)).toBeInTheDocument()
    })
  })

  it('应该在已登录状态下允许点击预订按钮进入订单页', async () => {
    const user = userEvent.setup()

    // 模拟已登录状态
    localStorageMock['authToken'] = 'test-token-123'
    localStorageMock['userId'] = 'user-456'

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/trains',
            state: {
              departureStation: '上海',
              arrivalStation: '北京',
              departureDate: '2025-09-14',
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

    // 验证显示"个人中心"按钮（已登录状态）
    expect(screen.getByText(/个人中心/i)).toBeInTheDocument()

    // 点击预订按钮
    const reserveButton = screen.getByRole('button', { name: /预订/i })
    await user.click(reserveButton)

    // 应该不会显示"请先登录"的提示，而是直接进入订单页
    await waitFor(() => {
      expect(screen.queryByText(/请先登录/i)).not.toBeInTheDocument()
    })
  })

  it('应该在未登录状态下点击预订按钮显示登录提示', async () => {
    const user = userEvent.setup()

    // 未登录状态（localStorage为空，已经在beforeEach中清空）

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/trains',
            state: {
              departureStation: '上海',
              arrivalStation: '北京',
              departureDate: '2025-09-14',
            },
          },
        ]}
      >
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
          <Route path="/login" element={<div>登录页面</div>} />
        </Routes>
      </MemoryRouter>
    )

    // 等待车次列表加载
    await waitFor(() => {
      expect(screen.getByText(/G27/i)).toBeInTheDocument()
    })

    // 验证显示"登录"按钮（未登录状态）
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()

    // 点击预订按钮
    const reserveButton = screen.getByRole('button', { name: /预订/i })
    await user.click(reserveButton)

    // 应该显示"请先登录"的提示
    await waitFor(() => {
      expect(screen.getByText(/请先登录/i)).toBeInTheDocument()
    })
  })
})

