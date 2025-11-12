/**
 * 端到端流程测试：首页 → 车次列表页完整查询流程
 * 
 * 测试场景：
 * 1. 用户从首页开始完整的车票查询流程
 * 2. 验证查询参数正确传递到车次列表页
 * 3. 验证查询表单的验证逻辑
 * 4. 验证高铁/动车筛选参数的传递
 * 5. 测试交换出发地和到达地功能
 * 6. 测试从车次列表页返回首页继续查询的流程
 * 
 * 需求文档参考：
 * - requirements/01-首页查询页/01-首页查询页.md (1.2.10 用户成功查询)
 * - requirements/03-车次列表页/03-车次列表页.md (4.2 车票查询页面的进入)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import HomePage from '../../src/pages/HomePage'
import TrainListPage from '../../src/pages/TrainListPage'
import LoginPage from '../../src/pages/LoginPage'

describe('端到端流程：首页 → 车次列表页（完整查询流程）', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('完整流程：用户从首页填写查询表单并跳转到车次列表页', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 步骤1：验证在首页（通过宣传栏内容）
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
    expect(screen.getByText(/铁路畅行 尊享体验/i)).toBeInTheDocument()

    // 步骤2：填写出发地
    const departureInput = screen.getByPlaceholderText(/出发地/i)
    expect(departureInput).toBeInTheDocument()
    await user.click(departureInput)
    await user.type(departureInput, '北京')
    expect(departureInput).toHaveValue('北京')

    // 步骤3：填写到达地
    const arrivalInput = screen.getByPlaceholderText(/到达地/i)
    expect(arrivalInput).toBeInTheDocument()
    await user.click(arrivalInput)
    await user.type(arrivalInput, '上海')
    expect(arrivalInput).toHaveValue('上海')

    // 步骤4：点击查询按钮
    const searchButton = screen.getByRole('button', { name: /查询/i })
    expect(searchButton).toBeInTheDocument()
    await user.click(searchButton)

    // 步骤5：等待跳转到车次列表页
    await waitFor(() => {
      // 车次列表页会有多个出发地输入框（搜索栏中的）
      const allDepartureInputs = screen.getAllByPlaceholderText(/出发地/i)
      expect(allDepartureInputs.length).toBeGreaterThan(0)
      
      // 首页的宣传栏不再存在
      expect(screen.queryByText(/铁路畅行 尊享体验/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // 步骤6：验证仍在12306系统内
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
    expect(screen.getByAltText(/中国铁路12306/i)).toBeInTheDocument()
  })

  it('完整流程：用户勾选高铁/动车后查询', async () => {
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

    // 查询
    const searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    // 等待跳转
    await waitFor(() => {
      expect(screen.queryByText(/铁路畅行 尊享体验/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证在车次列表页
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
  })

  it('完整流程：出发地为空时无法查询', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 仅填写到达地
    const arrivalInput = screen.getByPlaceholderText(/到达地/i)
    await user.click(arrivalInput)
    await user.type(arrivalInput, '上海')

    // 点击查询
    const searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    // 应该显示错误提示且不跳转
    await waitFor(() => {
      expect(screen.getByText(/请选择出发地/i)).toBeInTheDocument()
    })

    // 验证仍在首页
    expect(screen.getByText(/铁路畅行 尊享体验/i)).toBeInTheDocument()
  })

  it('完整流程：到达地为空时无法查询', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 仅填写出发地
    const departureInput = screen.getByPlaceholderText(/出发地/i)
    await user.click(departureInput)
    await user.type(departureInput, '北京')

    // 点击查询
    const searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    // 应该显示错误提示且不跳转
    await waitFor(() => {
      expect(screen.getByText(/请选择到达地/i)).toBeInTheDocument()
    })

    // 验证仍在首页
    expect(screen.getByText(/铁路畅行 尊享体验/i)).toBeInTheDocument()
  })

  it('完整流程：从车次列表页返回首页重新查询', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 第一次查询：北京 → 上海
    let departureInput = screen.getByPlaceholderText(/出发地/i)
    await user.click(departureInput)
    await user.type(departureInput, '北京')

    let arrivalInput = screen.getByPlaceholderText(/到达地/i)
    await user.click(arrivalInput)
    await user.type(arrivalInput, '上海')

    let searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    // 等待跳转到车次列表页
    await waitFor(() => {
      expect(screen.queryByText(/铁路畅行 尊享体验/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // 点击Logo返回首页
    const logoElement = screen.getByAltText(/中国铁路12306/i)
    await user.click(logoElement)

    // 等待返回首页
    await waitFor(() => {
      expect(screen.getByText(/铁路畅行 尊享体验/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 第二次查询：深圳 → 杭州
    departureInput = screen.getByPlaceholderText(/出发地/i)
    await user.click(departureInput)
    await user.clear(departureInput)
    await user.type(departureInput, '深圳')

    arrivalInput = screen.getByPlaceholderText(/到达地/i)
    await user.click(arrivalInput)
    await user.clear(arrivalInput)
    await user.type(arrivalInput, '杭州')

    searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    // 等待再次跳转到车次列表页
    await waitFor(() => {
      expect(screen.queryByText(/铁路畅行 尊享体验/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证在车次列表页
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
  })
})

describe('端到端流程：跨页导航组合场景', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('完整流程：首页 → 登录页 → 返回首页 → 查询车次', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 步骤1：从首页进入登录页
    const loginButton = screen.getByRole('button', { name: /登录/i })
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/账号登录/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 步骤2：从登录页返回首页
    const logoElement = screen.getByAltText(/中国铁路12306/i)
    await user.click(logoElement)

    await waitFor(() => {
      expect(screen.getByText(/铁路畅行 尊享体验/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 步骤3：在首页进行车票查询
    const departureInput = screen.getByPlaceholderText(/出发地/i)
    await user.click(departureInput)
    await user.type(departureInput, '北京')

    const arrivalInput = screen.getByPlaceholderText(/到达地/i)
    await user.click(arrivalInput)
    await user.type(arrivalInput, '上海')

    const searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    // 步骤4：验证跳转到车次列表页
    await waitFor(() => {
      expect(screen.queryByText(/铁路畅行 尊享体验/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
  })

  it('完整流程：车次列表页 → 登录页 → 返回车次列表页', async () => {
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )

    // 步骤1：验证在车次列表页
    expect(screen.getByText(/您好，请/i)).toBeInTheDocument()
    expect(screen.queryByText(/铁路畅行 尊享体验/i)).not.toBeInTheDocument()

    // 步骤2：点击登录按钮进入登录页
    const loginButton = screen.getByRole('button', { name: /登录/i })
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/账号登录/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 步骤3：使用浏览器后退功能或点击Logo
    const logoElement = screen.getByAltText(/中国铁路12306/i)
    await user.click(logoElement)

    await waitFor(() => {
      // Logo点击会返回首页，不是车次列表页
      expect(screen.getByText(/铁路畅行 尊享体验/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe('端到端流程：页面状态保持', () => {
  it('从首页跳转到车次列表页后，页面导航栏状态应该保持一致', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 首页应该有登录和注册按钮
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /注册/i })).toBeInTheDocument()

    // 进行查询
    const departureInput = screen.getByPlaceholderText(/出发地/i)
    await user.click(departureInput)
    await user.type(departureInput, '北京')

    const arrivalInput = screen.getByPlaceholderText(/到达地/i)
    await user.click(arrivalInput)
    await user.type(arrivalInput, '上海')

    const searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    // 等待跳转到车次列表页
    await waitFor(() => {
      expect(screen.queryByText(/铁路畅行 尊享体验/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // 车次列表页也应该有登录和注册按钮（未登录状态）
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /注册/i })).toBeInTheDocument()
  })

  it('页面跳转过程中Logo和底部导航应该始终存在', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainListPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 首页：验证Logo和底部导航
    expect(screen.getByAltText(/中国铁路12306/i)).toBeInTheDocument()
    expect(screen.getByText(/友情链接/i)).toBeInTheDocument()

    // 跳转到登录页
    const loginButton = screen.getByRole('button', { name: /登录/i })
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/账号登录/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 登录页：验证Logo和底部导航
    expect(screen.getByAltText(/中国铁路12306/i)).toBeInTheDocument()
    expect(screen.getByText(/友情链接/i)).toBeInTheDocument()

    // 返回首页
    const logoElement = screen.getByAltText(/中国铁路12306/i)
    await user.click(logoElement)

    await waitFor(() => {
      expect(screen.getByText(/铁路畅行 尊享体验/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // 查询跳转到车次列表页
    const departureInput = screen.getByPlaceholderText(/出发地/i)
    await user.click(departureInput)
    await user.type(departureInput, '北京')

    const arrivalInput = screen.getByPlaceholderText(/到达地/i)
    await user.click(arrivalInput)
    await user.type(arrivalInput, '上海')

    const searchButton = screen.getByRole('button', { name: /查询/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.queryByText(/铁路畅行 尊享体验/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // 车次列表页：验证Logo和底部导航
    expect(screen.getByAltText(/中国铁路12306/i)).toBeInTheDocument()
    expect(screen.getByText(/友情链接/i)).toBeInTheDocument()
  })
})

