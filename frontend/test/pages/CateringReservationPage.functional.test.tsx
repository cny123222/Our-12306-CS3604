import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import CateringReservationPage from '../../src/pages/CateringReservationPage'

const mockNavigate = vi.fn()
const mockLocation: any = {
  pathname: '/catering',
  state: { date: '2025-12-01' },
  search: '',
  hash: '',
  key: 'default'
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  }
})

vi.mock('../../src/services/trainService', () => ({
  getTrainDetails: vi.fn().mockResolvedValue({
    success: true,
    train: {
      route: {
        origin: '北京南',
        destination: '上海虹桥',
        departureTime: '06:20',
        arrivalTime: '11:58'
      }
    }
  })
}))

const renderWithRouter = (component: React.ReactElement) => render(<BrowserRouter>{component}</BrowserRouter>)

describe('餐饮预订页 - 车次输入与到达时间展示', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('输入车次不应触发数据更新，点击查询后才更新', async () => {
    const { getTrainDetails } = await import('../../src/services/trainService')
    renderWithRouter(<CateringReservationPage />)

    const trainInput = screen.getByPlaceholderText('G10') as HTMLInputElement
    fireEvent.change(trainInput, { target: { value: 'G103' } })
    expect(vi.mocked(getTrainDetails)).not.toHaveBeenCalled()

    const queryBtn = screen.getByRole('button', { name: '查询' })
    fireEvent.click(queryBtn)

    await waitFor(() => {
      const title = screen.getByText('上海虹桥（开车日期：2025-12-01 开车时间：11:58）')
      expect(title).toBeInTheDocument()
    })

    expect(vi.mocked(getTrainDetails)).toHaveBeenCalledWith('G103', '2025-12-01')
  })

  it('到达站标题应显示到达时间而非发车时间', async () => {
    const { getTrainDetails } = await import('../../src/services/trainService')
    vi.mocked(getTrainDetails).mockResolvedValueOnce({
      success: true,
      train: { route: { origin: '北京南', destination: '上海虹桥', departureTime: '06:20', arrivalTime: '12:34' } }
    } as any)

    renderWithRouter(<CateringReservationPage />)
    const trainInput = screen.getByPlaceholderText('G10')
    fireEvent.change(trainInput, { target: { value: 'G888' } })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      const title = screen.getByText('上海虹桥（开车日期：2025-12-01 开车时间：12:34）')
      expect(title).toBeInTheDocument()
    })
  })

  it('无效车次长度不触发查询，标题不出现', async () => {
    const { getTrainDetails } = await import('../../src/services/trainService')
    renderWithRouter(<CateringReservationPage />)
    const trainInput = screen.getByPlaceholderText('G10')
    fireEvent.change(trainInput, { target: { value: 'G' } })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      const title = screen.queryByText(/开车日期：2025-12-01 开车时间：/)
      expect(title).not.toBeInTheDocument()
    })

    expect(vi.mocked(getTrainDetails)).not.toHaveBeenCalled()
  })

  it('后端返回空详情时不更新站点与时间', async () => {
    const { getTrainDetails } = await import('../../src/services/trainService')
    vi.mocked(getTrainDetails).mockResolvedValueOnce({ success: false } as any)
    renderWithRouter(<CateringReservationPage />)
    const trainInput = screen.getByPlaceholderText('G10')
    fireEvent.change(trainInput, { target: { value: 'G103' } })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      const title = screen.queryByText(/开车日期：2025-12-01 开车时间：/)
      expect(title).not.toBeInTheDocument()
    })
  })

  it('切换仅显示可预订商家后仅显示开放商家', async () => {
    const { getTrainDetails } = await import('../../src/services/trainService')
    renderWithRouter(<CateringReservationPage />)
    const trainInput = screen.getByPlaceholderText('G10')
    fireEvent.change(trainInput, { target: { value: 'G103' } })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(screen.getByText('永和大王（北京南站店）')).toBeInTheDocument()
      expect(screen.getByText('老娘舅（北京南站店）')).toBeInTheDocument()
      expect(screen.getByText('康师傅（上海虹桥站店）')).toBeInTheDocument()
      expect(screen.getByText('德克士（上海虹桥站店）')).toBeInTheDocument()
    })

    const onlyOpen = screen.getByLabelText('显示可预订商家') as HTMLInputElement
    fireEvent.click(onlyOpen)

    await waitFor(() => {
      expect(screen.getByText('永和大王（北京南站店）')).toBeInTheDocument()
      expect(screen.queryByText('老娘舅（北京南站店）')).not.toBeInTheDocument()
      expect(screen.getByText('康师傅（上海虹桥站店）')).toBeInTheDocument()
      expect(screen.queryByText('德克士（上海虹桥站店）')).not.toBeInTheDocument()
    })
  })

  it('更换日期后在已有车次场景下刷新到发时间', async () => {
    const { getTrainDetails } = await import('../../src/services/trainService')
    vi.mocked(getTrainDetails).mockResolvedValueOnce({
      success: true,
      train: { route: { origin: '北京南', destination: '上海虹桥', departureTime: '06:20', arrivalTime: '11:58' } }
    } as any)

    const { container } = renderWithRouter(<CateringReservationPage />)
    fireEvent.change(screen.getByPlaceholderText('G10'), { target: { value: 'G103' } })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(screen.getByText('上海虹桥（开车日期：2025-12-01 开车时间：11:58）')).toBeInTheDocument()
      expect(screen.getByText('北京南（开车日期：2025-12-01 开车时间：06:20）')).toBeInTheDocument()
    })

    vi.mocked(getTrainDetails).mockResolvedValueOnce({
      success: true,
      train: { route: { origin: '北京南', destination: '上海虹桥', departureTime: '06:30', arrivalTime: '12:00' } }
    } as any)

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2025-12-02' } })

    await waitFor(() => {
      expect(screen.getByText('上海虹桥（开车日期：2025-12-02 开车时间：12:00）')).toBeInTheDocument()
      expect(screen.getByText('北京南（开车日期：2025-12-02 开车时间：06:30）')).toBeInTheDocument()
    })
  })

  it('重复点击查询同一车次与日期不应重复拉取', async () => {
    const { getTrainDetails } = await import('../../src/services/trainService')
    renderWithRouter(<CateringReservationPage />)
    const input = screen.getByPlaceholderText('G10')
    fireEvent.change(input, { target: { value: 'G103' } })
    const btn = screen.getByRole('button', { name: '查询' })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(vi.mocked(getTrainDetails)).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(btn)
    await waitFor(() => {
      expect(vi.mocked(getTrainDetails)).toHaveBeenCalledTimes(1)
    })
  })

  it('StationInput交互：手动输入乘车站与到达站后展示对应商家', async () => {
    renderWithRouter(<CateringReservationPage />)
    const dep = screen.getByPlaceholderText('乘车站')
    const arr = screen.getByPlaceholderText('到达站')
    fireEvent.change(dep, { target: { value: '天津' } })
    fireEvent.change(arr, { target: { value: '杭州' } })

    await waitFor(() => {
      expect(screen.getByText('天津（开车日期：2025-12-01 开车时间：--:--）')).toBeInTheDocument()
      expect(screen.getByText('杭州（开车日期：2025-12-01 开车时间：--:--）')).toBeInTheDocument()
      expect(screen.getByText('永和大王（天津站店）')).toBeInTheDocument()
      expect(screen.getByText('康师傅（杭州站店）')).toBeInTheDocument()
    })
  })

  it('查询后展示的出发站与到达站应与服务返回一致', async () => {
    const { getTrainDetails } = await import('../../src/services/trainService')
    vi.mocked(getTrainDetails).mockResolvedValueOnce({
      success: true,
      train: { route: { origin: '北京南', destination: '上海虹桥', departureTime: '06:20', arrivalTime: '11:58' } }
    } as any)
    renderWithRouter(<CateringReservationPage />)
    fireEvent.change(screen.getByPlaceholderText('G10'), { target: { value: 'G103' } })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(screen.getByText('北京南（开车日期：2025-12-01 开车时间：06:20）')).toBeInTheDocument()
      expect(screen.getByText('上海虹桥（开车日期：2025-12-01 开车时间：11:58）')).toBeInTheDocument()
    })
  })

  it('点击商家触发页面跳转并展示自营商品列表', async () => {
    const { getTrainDetails } = await import('../../src/services/trainService')
    renderWithRouter(<CateringReservationPage />)
    fireEvent.change(screen.getByPlaceholderText('G10'), { target: { value: 'G103' } })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(screen.getByText('15元冷链餐')).toBeInTheDocument()
      expect(screen.getByText('30元冷链餐')).toBeInTheDocument()
      expect(screen.getByText('40元冷链餐')).toBeInTheDocument()
    })

    const vendorName = screen.getByText('康师傅（上海虹桥站店）')
    fireEvent.click(vendorName)

    await waitFor(() => {
      const calls = mockNavigate.mock.calls
      const navigateArgs = calls[calls.length - 1]
      expect(navigateArgs[0]).toBe('/catering/vendor')
      const state = navigateArgs[1]?.state
      expect(state?.name).toBe('康师傅（上海虹桥站店）')
      expect(state?.station).toBe('上海虹桥')
      expect(state?.date).toBe('2025-12-01')
      expect(state?.departTime).toBe('06:20')
    })
  })
})
