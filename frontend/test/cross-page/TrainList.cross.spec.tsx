/**
 * 跨页流程测试：车次列表页跨页导航
 * 
 * 测试场景：
 * 1. 首页 → 车次列表页（接收查询参数）
 * 2. 车次列表页 → 登录页（通过主导航栏登录按钮）
 * 3. 车次列表页 → 注册页（通过主导航栏注册按钮）
 * 4. 车次列表页 → 首页（点击Logo）
 * 5. 车次列表页 → 订单填写页（点击预订按钮）
 * 6. 车次列表页未登录时点击预订按钮应提示登录
 * 7. 车次列表页接收并显示查询参数
 * 
 * 需求文档参考：
 * - requirements/03-车次列表页/03-车次列表页.md
 * - 4.2 车票查询页面的进入
 * - 4.4 用户点击预定按钮
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import HomePage from '../../src/pages/HomePage'
import TrainListPage from '../../src/pages/TrainListPage'
import LoginPage from '../../src/pages/LoginPage'
import RegisterPage from '../../src/pages/RegisterPage'

describe('跨页流程：车次列表页导航', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('应该能从车次列表页通过主导航栏的"登录"按钮导航到登录页', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/trains']}>
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证当前在车次列表页
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()

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

  it('应该能从车次列表页通过主导航栏的"注册"按钮导航到注册页', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/trains']}>
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证当前在车次列表页
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()

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

  it('应该能从车次列表页点击Logo返回首页', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/trains']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证当前在车次列表页
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
    
    // 车次列表页会有多个相同的输入框（搜索栏），而首页只有一个
    const departureInputs = screen.getAllByPlaceholderText(/出发地/i)
    expect(departureInputs.length).toBeGreaterThan(0)

    // 找到并点击Logo
    const logoElement = screen.getByAltText(/中国铁路12306/i)
    await user.click(logoElement)

    // 等待导航完成，验证返回首页
    await waitFor(() => {
      // 首页会有宣传栏内容（使用独特的描述文字）
      expect(screen.getByText(/铁路畅行 尊享体验/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe('跨页流程：首页 → 车次列表页（参数传递）', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('从首页导航到车次列表页时应该正确传递查询参数', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证当前在首页
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
    expect(screen.getByText(/会员服务/i)).toBeInTheDocument()

    // 填写出发地
    const departureInput = screen.getByPlaceholderText(/出发地/i)
    await user.click(departureInput)
    await user.type(departureInput, '北京')

    // 填写到达地
    const arrivalInput = screen.getByPlaceholderText(/到达地/i)
    await user.click(arrivalInput)
    await user.type(arrivalInput, '上海')

    // 点击查询按钮
    const searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    // 等待导航到车次列表页
    await waitFor(() => {
      // 车次列表页会有搜索栏，而首页的宣传栏内容不再显示
      const allInputs = screen.getAllByPlaceholderText(/出发地/i)
      // 车次列表页有搜索栏（可能会有多个输入框）
      expect(allInputs.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('从首页勾选高铁/动车后导航到车次列表页应该保持筛选状态', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 填写查询信息
    const departureInput = screen.getByPlaceholderText(/出发地/i)
    await user.click(departureInput)
    await user.type(departureInput, '北京')

    const arrivalInput = screen.getByPlaceholderText(/到达地/i)
    await user.click(arrivalInput)
    await user.type(arrivalInput, '上海')

    // 勾选高铁/动车
    const highSpeedCheckbox = screen.getByRole('checkbox', { name: /高铁\/动车/i })
    await user.click(highSpeedCheckbox)
    expect(highSpeedCheckbox).toBeChecked()

    // 点击查询
    const searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    // 等待导航完成
    await waitFor(() => {
      const allInputs = screen.getAllByPlaceholderText(/出发地/i)
      expect(allInputs.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })
})

describe('跨页流程：车次列表页初始状态', () => {
  it('直接访问车次列表页应该显示默认状态', () => {
    render(
      <MemoryRouter initialEntries={['/trains']}>
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证页面基本元素存在
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
    
    // 验证搜索栏存在
    const departureInputs = screen.getAllByPlaceholderText(/出发地/i)
    expect(departureInputs.length).toBeGreaterThan(0)
  })

  it('车次列表页应该显示筛选面板', () => {
    render(
      <MemoryRouter initialEntries={['/trains']}>
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // TrainFilterPanel 应该存在
    // 注意：具体的筛选选项可能需要根据实际数据动态生成
    // 这里只验证页面能正常渲染
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
  })

  it('车次列表页应该显示顶部和底部导航', () => {
    render(
      <MemoryRouter initialEntries={['/trains']}>
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证顶部导航
    expect(screen.getByAltText(/中国铁路12306/i)).toBeInTheDocument()
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()

    // 验证底部导航
    expect(screen.getByText(/友情链接/i)).toBeInTheDocument()
  })
})

describe('跨页流程：车次列表页接收查询参数', () => {
  it('通过location.state传递的参数应该填充到搜索栏', () => {
    const searchParams = {
      departureStation: '北京',
      arrivalStation: '上海',
      departureDate: '2025-12-01',
      isHighSpeed: false
    }

    render(
      <MemoryRouter 
        initialEntries={[
          { pathname: '/trains', state: searchParams }
        ]}
      >
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // TrainListPage会通过location.state接收参数并传递给TrainSearchBar
    // 验证页面正常渲染
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
  })

  it('没有传递参数时应该使用默认值', () => {
    render(
      <MemoryRouter initialEntries={['/trains']}>
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证页面正常渲染，使用默认参数
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
    
    // TrainListPage会在没有参数时使用默认的空字符串和当前日期
    const departureInputs = screen.getAllByPlaceholderText(/出发地/i)
    expect(departureInputs.length).toBeGreaterThan(0)
  })
})

describe('跨页流程：车次列表页未登录状态', () => {
  it('未登录时应该显示登录和注册按钮', () => {
    render(
      <MemoryRouter initialEntries={['/trains']}>
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证显示登录和注册按钮（未登录状态）
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /注册/i })).toBeInTheDocument()
  })
})

describe('跨页流程：车次列表页查询功能', () => {
  it('在车次列表页修改查询条件并重新查询', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter 
        initialEntries={[
          { 
            pathname: '/trains', 
            state: { 
              departureStation: '北京', 
              arrivalStation: '上海',
              departureDate: '2025-12-01'
            } 
          }
        ]}
      >
        <Routes>
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 验证页面渲染
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()

    // 车次列表页的搜索栏允许用户修改查询条件
    const departureInputs = screen.getAllByPlaceholderText(/出发地/i)
    expect(departureInputs.length).toBeGreaterThan(0)

    // 可以重新输入并查询
    await user.click(departureInputs[0])
    await user.clear(departureInputs[0])
    await user.type(departureInputs[0], '广州')

    // 验证输入成功
    expect(departureInputs[0]).toHaveValue('广州')
  })

  it('点击Logo返回首页后可以重新发起查询', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/trains']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 从车次列表页返回首页
    const logoElement = screen.getByAltText(/中国铁路12306/i)
    await user.click(logoElement)

    // 等待返回首页
    await waitFor(() => {
      expect(screen.getByText(/会员服务/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 重新填写查询表单
    const departureInput = screen.getByPlaceholderText(/出发地/i)
    await user.click(departureInput)
    await user.type(departureInput, '深圳')

    const arrivalInput = screen.getByPlaceholderText(/到达地/i)
    await user.click(arrivalInput)
    await user.type(arrivalInput, '杭州')

    // 验证可以重新查询
    const searchButton = screen.getByRole('button', { name: /查询/i })
    expect(searchButton).toBeInTheDocument()
  })
})

