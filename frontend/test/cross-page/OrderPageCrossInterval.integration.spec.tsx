/**
 * 订单页面跨区间票价计算集成测试
 * 
 * 测试场景：
 * 1. 从车次列表页点击"预定"跳转到订单页
 * 2. 订单页正确计算跨区间票价（如：上海→北京 = 上海→无锡 + 无锡→南京 + 南京→天津西 + 天津西→北京）
 * 3. 显示正确的车次信息和票价
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import OrderPage from '../../src/pages/OrderPage'
import React from 'react'

describe('订单页面跨区间票价计算集成测试', () => {
  let localStorageMock: Record<string, string>
  let fetchMock: any

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {
      'authToken': 'test-token-123',
      'userId': 'user-123'
    }
    
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

    // Mock fetch for API calls
    fetchMock = vi.fn()
    ;(global as any).fetch = fetchMock
  })

  it('应该正确计算上海到北京的跨区间票价', async () => {
    // Mock API response for cross-interval fare calculation
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        trainInfo: {
          trainNo: 'D6',
          departureStation: '上海',
          arrivalStation: '北京',
          departureDate: '2025-11-13'
        },
        fareInfo: {
          '二等座': {
            price: 517, // 跨区间累加: 39 + 39 + 400 + 39 = 517
            available: 50
          },
          '一等座': {
            price: 850,
            available: 30
          },
          '商务座': {
            price: 1200,
            available: 10
          }
        },
        availableSeats: {
          '二等座': 50,
          '一等座': 30,
          '商务座': 10
        },
        passengers: [
          {
            id: 'p1',
            name: '张三',
            idCardType: '身份证',
            idCardNumber: '123456789012345678'
          }
        ],
        defaultSeatType: '二等座'
      })
    })

    // Render OrderPage with route state
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/order',
            state: {
              trainNo: 'D6',
              departureStation: '上海',
              arrivalStation: '北京',
              departureDate: '2025-11-13'
            }
          }
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for API call
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/new'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123'
          })
        })
      )
    })

    // Verify fare is correctly displayed
    await waitFor(() => {
      // 二等座价格应该是 517 元（跨区间累加）
      expect(screen.getByText(/517/)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Verify train info is displayed
    expect(screen.getByText(/D6/)).toBeInTheDocument()
    expect(screen.getByText(/上海/)).toBeInTheDocument()
    expect(screen.getByText(/北京/)).toBeInTheDocument()
  })

  it('应该正确计算相邻区间的票价（上海→无锡）', async () => {
    // Mock API response for adjacent stations
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        trainInfo: {
          trainNo: 'D6',
          departureStation: '上海',
          arrivalStation: '无锡',
          departureDate: '2025-11-13'
        },
        fareInfo: {
          '二等座': {
            price: 39, // 单区间价格
            available: 50
          }
        },
        availableSeats: {
          '二等座': 50
        },
        passengers: [],
        defaultSeatType: '二等座'
      })
    })

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/order',
            state: {
              trainNo: 'D6',
              departureStation: '上海',
              arrivalStation: '无锡',
              departureDate: '2025-11-13'
            }
          }
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for API call
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    // Verify adjacent station fare
    await waitFor(() => {
      expect(screen.getByText(/39/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('当票价信息不存在时应该显示错误信息', async () => {
    // Mock API error response
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: '未找到该区间的票价信息'
      })
    })

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/order',
            state: {
              trainNo: 'D999',
              departureStation: '不存在站',
              arrivalStation: '不存在站2',
              departureDate: '2025-11-13'
            }
          }
        ]}
      >
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/未找到该区间的票价信息|缺少必要的车次信息/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

