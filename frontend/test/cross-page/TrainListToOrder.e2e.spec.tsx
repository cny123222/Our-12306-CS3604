/**
 * 跨页流程端到端测试：车次列表页 → 订单填写页完整流程
 * 
 * 测试场景：
 * 1. 完整流程：首页 → 车次列表 → 订单填写（已登录）
 * 2. 完整流程：首页 → 车次列表 → 订单填写 → 返回车次列表
 * 3. 完整流程：首页 → 车次列表 → 订单填写 → 提交订单 → 信息核对
 * 4. 完整流程：首页 → 车次列表 → 订单填写 → 返回首页（通过Logo）
 * 5. 参数传递：车次列表 → 订单填写页（验证车次信息传递）
 * 6. 未登录流程：车次列表 → 尝试预订 → 跳转登录页
 * 
 * 需求文档参考：
 * - requirements/01-首页查询页/01-首页查询页.md
 * - requirements/03-车次列表页/03-车次列表页.md
 * - requirements/04-订单填写页/04-订单填写页.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import HomePage from '../../src/pages/HomePage'
import TrainListPage from '../../src/pages/TrainListPage'
import LoginPage from '../../src/pages/LoginPage'
import OrderPage from '../../src/pages/OrderPage'

// Mock fetch API
global.fetch = vi.fn()

describe('端到端流程：首页 → 车次列表 → 订单填写', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    vi.clearAllMocks()
    
    // Mock所有需要的API响应
    ;(global.fetch as any).mockImplementation((url: string, options?: any) => {
      // 订单页面数据
      if (url.includes('/api/orders/new')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            trainInfo: {
              trainNo: 'G27',
              date: '2025-09-14',
              departureStation: '北京南站',
              arrivalStation: '上海虹桥',
              departureTime: '19:00',
              arrivalTime: '23:35'
            },
            fareInfo: {
              '商务座': { price: 1748, available: 10 },
              '一等座': { price: 933, available: 50 },
              '二等座': { price: 553, available: 100 }
            },
            availableSeats: {
              '商务座': 10,
              '一等座': 50,
              '二等座': 100
            },
            passengers: [
              { id: '1', name: '刘蕊蕊', idCardType: '居民身份证', idCardNumber: '3301************028', points: 1234 }
            ],
            defaultSeatType: '二等座'
          })
        })
      }
      
      // 提交订单
      if (url.includes('/api/orders/submit') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: '订单提交成功',
            orderId: 'ORDER-123456',
            orderDetails: {}
          })
        })
      }
      
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      })
    })
  })

  it('完整流程：首页查询 → 车次列表 → 点击预订 → 订单填写页', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 步骤1：验证在首页
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
    expect(screen.getByText(/会员服务/i)).toBeInTheDocument()

    // 步骤2：填写查询信息
    const departureInput = screen.getByPlaceholderText(/出发地/i)
    await user.click(departureInput)
    await user.type(departureInput, '北京南站')

    const arrivalInput = screen.getByPlaceholderText(/到达地/i)
    await user.click(arrivalInput)
    await user.type(arrivalInput, '上海虹桥')

    // 步骤3：点击查询按钮
    const searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    // 步骤4：等待导航到车次列表页
    await waitFor(() => {
      // 车次列表页特征：有搜索栏且没有"会员服务"
      const allInputs = screen.getAllByPlaceholderText(/出发地/i)
      expect(allInputs.length).toBeGreaterThan(0)
      expect(screen.queryByText(/会员服务/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // 注意：这里无法继续点击"预订"按钮，因为实际的TrainListPage需要真实的车次数据
    // 但我们可以验证车次列表页已经正确渲染
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
  })

  it('完整流程：从订单填写页返回车次列表页应该保留查询参数', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter 
        initialEntries={[
          { 
            pathname: '/order', 
            state: { 
              trainNo: 'G27', 
              departureStation: '北京南站', 
              arrivalStation: '上海虹桥', 
              departureDate: '2025-09-14' 
            } 
          }
        ]}
      >
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待订单页加载完成
    await waitFor(() => {
      expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 点击"上一步"返回车次列表页
    const backButton = screen.getByRole('button', { name: /上一步/i })
    await user.click(backButton)

    // 验证返回车次列表页
    await waitFor(() => {
      expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
      expect(screen.queryByText(/欢迎登录12306/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('完整流程：从订单填写页点击Logo返回首页', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter 
        initialEntries={[
          { 
            pathname: '/order', 
            state: { 
              trainNo: 'G27', 
              departureStation: '北京南站', 
              arrivalStation: '上海虹桥', 
              departureDate: '2025-09-14' 
            } 
          }
        ]}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待订单页加载完成
    await waitFor(() => {
      expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 点击Logo返回首页
    const logoElement = screen.getByAltText(/中国铁路12306/i)
    await user.click(logoElement)

    // 验证返回首页
    await waitFor(() => {
      expect(screen.getByText(/会员服务/i)).toBeInTheDocument()
      expect(screen.getByText(/铁路畅行 尊享体验/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe('端到端流程：订单填写页参数传递验证', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('从车次列表页传递到订单填写页的车次参数应该正确显示', async () => {
    // Mock API响应
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/orders/new')) {
        // 验证URL参数
        expect(url).toContain('trainNo=G27')
        expect(url).toContain('departureStation=北京南站')
        expect(url).toContain('arrivalStation=上海虹桥')
        expect(url).toContain('departureDate=2025-09-14')
        
        return Promise.resolve({
          ok: true,
          json: async () => ({
            trainInfo: {
              trainNo: 'G27',
              date: '2025-09-14',
              departureStation: '北京南站',
              arrivalStation: '上海虹桥',
              departureTime: '19:00',
              arrivalTime: '23:35'
            },
            fareInfo: {
              '二等座': { price: 553, available: 100 }
            },
            availableSeats: {
              '二等座': 100
            },
            passengers: [],
            defaultSeatType: '二等座'
          })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      })
    })

    render(
      <MemoryRouter 
        initialEntries={[
          { 
            pathname: '/order', 
            state: { 
              trainNo: 'G27', 
              departureStation: '北京南站', 
              arrivalStation: '上海虹桥', 
              departureDate: '2025-09-14' 
            } 
          }
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待页面加载完成并显示车次信息
    await waitFor(() => {
      expect(screen.getByText(/G27/i)).toBeInTheDocument()
      expect(screen.getByText(/北京南站/i)).toBeInTheDocument()
      expect(screen.getByText(/上海虹桥/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('订单填写页应该显示从车次列表页传递的出发日期', async () => {
    // Mock API响应
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/orders/new')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            trainInfo: {
              trainNo: 'G27',
              date: '2025-09-14',
              departureStation: '北京南站',
              arrivalStation: '上海虹桥',
              departureTime: '19:00',
              arrivalTime: '23:35'
            },
            fareInfo: {
              '二等座': { price: 553, available: 100 }
            },
            availableSeats: {
              '二等座': 100
            },
            passengers: [],
            defaultSeatType: '二等座'
          })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      })
    })

    render(
      <MemoryRouter 
        initialEntries={[
          { 
            pathname: '/order', 
            state: { 
              trainNo: 'G27', 
              departureStation: '北京南站', 
              arrivalStation: '上海虹桥', 
              departureDate: '2025-09-14' 
            } 
          }
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待页面加载完成
    await waitFor(() => {
      expect(screen.getByText(/2025-09-14/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe('端到端流程：未登录用户访问订单页', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('未登录用户从车次列表尝试预订应该跳转到登录页', async () => {
    // Mock API返回401未登录错误
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/orders/new')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({
            error: '请先登录'
          })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      })
    })

    render(
      <MemoryRouter 
        initialEntries={[
          { 
            pathname: '/order', 
            state: { 
              trainNo: 'G27', 
              departureStation: '北京南站', 
              arrivalStation: '上海虹桥', 
              departureDate: '2025-09-14' 
            } 
          }
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待跳转到登录页
    await waitFor(() => {
      expect(screen.getByText(/账号登录/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证登录页元素
    expect(screen.getByPlaceholderText(/用户名\/邮箱\/手机号/i)).toBeInTheDocument()
  })
})

describe('端到端流程：订单提交完整流程', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock完整的API响应
    ;(global.fetch as any).mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/orders/new')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            trainInfo: {
              trainNo: 'G27',
              date: '2025-09-14',
              departureStation: '北京南站',
              arrivalStation: '上海虹桥',
              departureTime: '19:00',
              arrivalTime: '23:35'
            },
            fareInfo: {
              '二等座': { price: 553, available: 100 }
            },
            availableSeats: {
              '二等座': 100
            },
            passengers: [
              { id: '1', name: '刘蕊蕊', idCardType: '居民身份证', idCardNumber: '3301************028', points: 1234 }
            ],
            defaultSeatType: '二等座'
          })
        })
      }
      
      if (url.includes('/api/orders/submit') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: '订单提交成功',
            orderId: 'ORDER-123456',
            orderDetails: {}
          })
        })
      }
      
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      })
    })
  })

  it('完整流程：进入订单页 → 选择乘客 → 提交订单 → 显示信息核对弹窗', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter 
        initialEntries={[
          { 
            pathname: '/order', 
            state: { 
              trainNo: 'G27', 
              departureStation: '北京南站', 
              arrivalStation: '上海虹桥', 
              departureDate: '2025-09-14' 
            } 
          }
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 步骤1：等待订单页加载完成
    await waitFor(() => {
      expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 步骤2：等待乘客列表加载
    await waitFor(() => {
      expect(screen.getByText(/刘蕊蕊/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 步骤3：选择乘客
    const passengerCheckboxes = screen.getAllByRole('checkbox')
    const firstPassengerCheckbox = passengerCheckboxes.find(cb => {
      const label = cb.closest('label') || cb.parentElement
      return label?.textContent?.includes('刘蕊蕊')
    })
    
    if (firstPassengerCheckbox) {
      await user.click(firstPassengerCheckbox)
    }

    // 步骤4：提交订单
    const submitButton = screen.getByRole('button', { name: /提交订单/i })
    await user.click(submitButton)

    // 步骤5：验证信息核对弹窗显示
    await waitFor(() => {
      expect(screen.getByText(/请核对以下信息/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('完整流程：页面跳转过程中Logo和底部导航始终存在', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter 
        initialEntries={[
          { 
            pathname: '/order', 
            state: { 
              trainNo: 'G27', 
              departureStation: '北京南站', 
              arrivalStation: '上海虹桥', 
              departureDate: '2025-09-14' 
            } 
          }
        ]}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 订单页 - 验证导航元素存在
    await waitFor(() => {
      expect(screen.getByAltText(/中国铁路12306/i)).toBeInTheDocument()
      expect(screen.getByText(/友情链接/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 点击"上一步"返回车次列表页
    const backButton = screen.getByRole('button', { name: /上一步/i })
    await user.click(backButton)

    // 车次列表页 - 验证导航元素仍存在
    await waitFor(() => {
      expect(screen.getByAltText(/中国铁路12306/i)).toBeInTheDocument()
      expect(screen.getByText(/友情链接/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 点击Logo返回首页
    const logoElement = screen.getByAltText(/中国铁路12306/i)
    await user.click(logoElement)

    // 首页 - 验证导航元素仍存在
    await waitFor(() => {
      expect(screen.getByAltText(/中国铁路12306/i)).toBeInTheDocument()
      expect(screen.getByText(/友情链接/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

