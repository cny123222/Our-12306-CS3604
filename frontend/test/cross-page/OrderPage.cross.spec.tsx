/**
 * 跨页流程测试：订单填写页跨页导航
 * 
 * 测试场景：
 * 1. 车次列表页 → 订单填写页（点击预订按钮）
 * 2. 订单填写页 → 车次列表页（点击"上一步"按钮）
 * 3. 订单填写页 → 登录页（通过主导航栏登录按钮）
 * 4. 订单填写页 → 注册页（通过主导航栏注册按钮）
 * 5. 订单填写页 → 首页（点击Logo）
 * 6. 未登录访问订单页 → 跳转到登录页
 * 7. 订单填写页接收并显示车次参数
 * 
 * 需求文档参考：
 * - requirements/04-订单填写页/04-订单填写页.md
 * - 5.1 订单填写页布局
 * - 5.5 用户提交订单
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import HomePage from '../../src/pages/HomePage'
import TrainListPage from '../../src/pages/TrainListPage'
import LoginPage from '../../src/pages/LoginPage'
import RegisterPage from '../../src/pages/RegisterPage'
import OrderPage from '../../src/pages/OrderPage'

// Mock fetch API
global.fetch = vi.fn()

describe('跨页流程：订单填写页基本导航', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    vi.clearAllMocks()
    
    // Mock默认的API响应
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
              { id: '1', name: '刘蕊蕊', idCardType: '居民身份证', idCardNumber: '3301************028', points: 1234 },
              { id: '2', name: '王欣', idCardType: '居民身份证', idCardNumber: '4401************123', points: 567 }
            ],
            defaultSeatType: '二等座'
          })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      })
    })
  })

  it('应该能从订单填写页通过主导航栏的"登录"按钮导航到登录页', async () => {
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
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待订单页加载完成
    await waitFor(() => {
      expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 找到并点击登录按钮
    const loginButton = screen.getByRole('button', { name: /登录/i })
    expect(loginButton).toBeInTheDocument()
    await user.click(loginButton)

    // 等待导航完成，验证进入登录页
    await waitFor(() => {
      expect(screen.getByText(/账号登录/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证登录页的关键元素存在
    expect(screen.getByPlaceholderText(/用户名\/邮箱\/手机号/i)).toBeInTheDocument()
  })

  it('应该能从订单填写页通过主导航栏的"注册"按钮导航到注册页', async () => {
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
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待订单页加载完成
    await waitFor(() => {
      expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 找到并点击注册按钮
    const registerButton = screen.getByRole('button', { name: /注册/i })
    expect(registerButton).toBeInTheDocument()
    await user.click(registerButton)

    // 等待导航完成，验证进入注册页
    await waitFor(() => {
      expect(screen.getByText(/账户信息/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证注册页的关键元素存在
    expect(screen.getByPlaceholderText(/用户名设置成功后不可修改/i)).toBeInTheDocument()
  })

  it('应该能从订单填写页点击Logo返回首页', async () => {
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

    // 找到并点击Logo
    const logoElement = screen.getByAltText(/中国铁路12306/i)
    await user.click(logoElement)

    // 等待导航完成，验证返回首页
    await waitFor(() => {
      // 首页会有宣传栏内容
      expect(screen.getByText(/铁路畅行 尊享体验/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('应该能从订单填写页点击"上一步"按钮返回车次列表页', async () => {
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

    // 找到并点击"上一步"按钮
    const backButton = screen.getByRole('button', { name: /上一步/i })
    expect(backButton).toBeInTheDocument()
    await user.click(backButton)

    // 等待导航完成，验证返回车次列表页
    await waitFor(() => {
      // 车次列表页特征：有"您好，请"文字且不是订单页
      expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
      expect(screen.queryByText(/欢迎登录12306/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe('跨页流程：订单填写页参数传递', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
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
  })

  it('通过location.state传递的车次参数应该正确加载订单页数据', async () => {
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
      expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证API被调用并传递了正确的参数
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/new?trainNo=G27&departureStation=北京南站&arrivalStation=上海虹桥&departureDate=2025-09-14'),
        expect.any(Object)
      )
    })
  })

  it('订单填写页应该显示从车次列表页传递来的列车信息', async () => {
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
    }, { timeout: 3000 })

    // 验证车次信息显示
    expect(screen.getByText(/北京南站/i)).toBeInTheDocument()
    expect(screen.getByText(/上海虹桥/i)).toBeInTheDocument()
  })

  it('缺少必要参数时应该显示错误信息', async () => {
    render(
      <MemoryRouter 
        initialEntries={[
          { 
            pathname: '/order', 
            state: {} 
          }
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待错误信息显示
    await waitFor(() => {
      expect(screen.getByText(/缺少必要的车次信息/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe('跨页流程：订单填写页登录状态检查', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('未登录访问订单填写页应该跳转到登录页', async () => {
    // 模拟API返回401未登录错误
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

    // 验证登录页的关键元素存在
    expect(screen.getByPlaceholderText(/用户名\/邮箱\/手机号/i)).toBeInTheDocument()
  })

  it('已登录状态应该成功加载订单填写页', async () => {
    // Mock成功的API响应（假设已登录）
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
            passengers: [
              { id: '1', name: '刘蕊蕊', idCardType: '居民身份证', idCardNumber: '3301************028', points: 1234 }
            ],
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
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 等待页面加载完成
    await waitFor(() => {
      expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证订单页的关键元素存在
    await waitFor(() => {
      expect(screen.getByText(/G27/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证API调用包含认证token
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/orders/new'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token-123'
        })
      })
    )
  })
})

describe('跨页流程：订单填写页UI元素验证', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock成功的API响应
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
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      })
    })
  })

  it('订单填写页应该显示顶部导航栏和底部导航', async () => {
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

    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证顶部导航
    expect(screen.getByAltText(/中国铁路12306/i)).toBeInTheDocument()

    // 验证底部导航
    expect(screen.getByText(/友情链接/i)).toBeInTheDocument()
  })

  it('订单填写页应该显示"上一步"和"提交订单"按钮', async () => {
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
      expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证按钮存在
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /上一步/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /提交订单/i })).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('订单填写页应该显示温馨提示区域', async () => {
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
      expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证温馨提示
    await waitFor(() => {
      expect(screen.getByText(/温馨提示/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

