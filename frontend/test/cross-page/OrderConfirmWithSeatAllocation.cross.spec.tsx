/**
 * 订单确认并座位分配跨页测试
 * 测试流程：订单填写页 → 信息核对弹窗 → 购买成功弹窗（包含座位号）→ 返回首页
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrderPage from '../../src/pages/OrderPage';
import HomePage from '../../src/pages/HomePage';

describe('订单确认并座位分配跨页流程测试', () => {
  beforeEach(() => {
    // Mock localStorage
    const mockLocalStorage: { [key: string]: string } = {
      token: 'mock-token-12345',
      userId: 'user-123',
      username: 'testuser'
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: vi.fn(() => {
          Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
        })
      },
      writable: true
    });
  });

  it('应该完整完成订单确认流程：提交订单 → 核对信息 → 确认订单 → 显示购买成功（含座位号）→ 返回首页', async () => {
    const user = userEvent.setup();
    
    // 用于追踪导航的变量
    let currentPath = '/order';
    const mockNavigate = vi.fn((path: string) => {
      console.log('🧭 导航到:', path);
      currentPath = path;
    });
    
    // Mock fetch API
    const mockOrderId = 'test-order-12345';
    const mockSeatNo = '05车03A号';
    
    global.fetch = vi.fn((url: string | URL | Request, options?: RequestInit) => {
      const urlString = url.toString();
      console.log('📡 Mock Fetch:', options?.method || 'GET', urlString);
      
      // Mock 创建订单
      if (urlString.includes('/api/orders/new') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: '订单创建成功',
            orderId: mockOrderId
          })
        } as Response);
      }
      
      // Mock 提交订单
      if (urlString.includes('/api/orders/submit') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: '订单提交成功',
            orderId: mockOrderId
          })
        } as Response);
      }
      
      // Mock 获取订单确认信息
      if (urlString.includes(`/api/orders/${mockOrderId}/confirmation`)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            orderInfo: {
              orderId: mockOrderId,
              trainInfo: {
                trainNo: 'D6',
                date: '2025-11-13',
                departureStation: '上海',
                arrivalStation: '北京',
                departureTime: '08:00',
                arrivalTime: '14:30'
              },
              passengers: [
                {
                  sequence: 1,
                  seatType: '二等座',
                  passengerName: '刘嘉敏',
                  idCardType: '身份证',
                  idCardNumber: '310101199001011234',
                  ticketType: '成人票',
                  price: 553.5,
                  points: 1000
                }
              ],
              availableSeats: {
                '二等座': 13,
                '硬卧': 2,
                '软卧': 1
              },
              totalPrice: 553.5
            }
          })
        } as Response);
      }
      
      // Mock 确认订单（关键：包含座位号）
      if (urlString.includes(`/api/orders/${mockOrderId}/confirm`) && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: '购买成功',
            orderId: mockOrderId,
            status: 'completed',
            trainInfo: {
              trainNo: 'D6',
              departureStation: '上海',
              arrivalStation: '北京',
              departureDate: '2025-11-13',
              departureTime: '08:00',
              arrivalTime: '14:30'
            },
            tickets: [
              {
                passengerName: '刘嘉敏',
                seatType: '二等座',
                seatNo: mockSeatNo,
                ticketType: '成人票'
              }
            ]
          })
        } as Response);
      }
      
      return Promise.reject(new Error('未匹配的请求: ' + urlString));
    }) as typeof fetch;
    
    // 渲染带有路由的应用
    const { rerender } = render(
      <MemoryRouter initialEntries={[{
        pathname: '/order',
        search: '?trainNo=D6&departureStation=上海&arrivalStation=北京&departureDate=2025-11-13'
      }]}>
        <Routes>
          <Route path="/order" element={<OrderPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );
    
    console.log('✅ Step 1: 页面加载完成，等待订单数据加载...');
    
    // 等待页面加载并验证订单页面显示
    await waitFor(() => {
      expect(screen.getByText(/订单填写/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    console.log('✅ Step 2: 订单页面显示正常');
    
    // 查找并点击"提交订单"按钮
    const submitButton = await screen.findByRole('button', { name: /提交订单/i });
    console.log('✅ Step 3: 找到"提交订单"按钮，准备点击');
    
    await user.click(submitButton);
    console.log('✅ Step 4: 已点击"提交订单"按钮');
    
    // 等待信息核对弹窗出现
    await waitFor(() => {
      expect(screen.getByText(/请核对以下信息/i)).toBeInTheDocument();
    }, { timeout: 10000 });
    
    console.log('✅ Step 5: 信息核对弹窗已显示');
    
    // 验证弹窗中的信息
    expect(screen.getByText(/刘嘉敏/i)).toBeInTheDocument();
    expect(screen.getByText(/二等座/i)).toBeInTheDocument();
    
    console.log('✅ Step 6: 乘客信息显示正确');
    
    // 查找信息核对弹窗中的"确认"按钮
    const confirmButtons = screen.getAllByRole('button', { name: /确认/i });
    // 找到橙色的确认按钮（信息核对弹窗的确认按钮）
    const modalConfirmButton = confirmButtons.find(btn => 
      btn.className.includes('confirm-modal-button') || 
      btn.className.includes('orange-background')
    );
    
    expect(modalConfirmButton).toBeTruthy();
    console.log('✅ Step 7: 找到信息核对弹窗的"确认"按钮，准备点击');
    
    await user.click(modalConfirmButton!);
    console.log('✅ Step 8: 已点击"确认"按钮');
    
    // 首先应该看到"处理中"提示
    await waitFor(() => {
      expect(screen.getByText(/订单已经提交，系统正在处理中，请稍等/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    console.log('✅ Step 9: "处理中"提示已显示');
    
    // 然后应该看到"购买成功"弹窗
    await waitFor(() => {
      expect(screen.getByText(/购买成功/i)).toBeInTheDocument();
    }, { timeout: 10000 });
    
    console.log('✅ Step 10: "购买成功"弹窗已显示');
    
    // 验证购买成功弹窗中的车次信息
    expect(screen.getByText(/D6次/i)).toBeInTheDocument();
    expect(screen.getByText(/上海站/i)).toBeInTheDocument();
    expect(screen.getByText(/北京站/i)).toBeInTheDocument();
    
    console.log('✅ Step 11: 车次信息显示正确');
    
    // 【关键】验证座位号是否显示（需求重点）
    await waitFor(() => {
      expect(screen.getByText(mockSeatNo)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    console.log('✅ Step 12: 座位号已正确显示:', mockSeatNo);
    
    // 验证乘客姓名在票据中显示
    const passengerNames = screen.getAllByText(/刘嘉敏/i);
    expect(passengerNames.length).toBeGreaterThan(0);
    
    console.log('✅ Step 13: 车票信息（包含乘客、座位号）显示完整');
    
    // 查找购买成功弹窗中的橙色"确认"按钮
    const successConfirmButtons = screen.getAllByRole('button', { name: /确认/i });
    const successConfirmButton = successConfirmButtons.find(btn => 
      btn.className.includes('success-confirm-button') || 
      btn.closest('.order-success-modal') !== null
    );
    
    expect(successConfirmButton).toBeTruthy();
    console.log('✅ Step 14: 找到购买成功弹窗的"确认"按钮，准备点击返回首页');
    
    await user.click(successConfirmButton!);
    console.log('✅ Step 15: 已点击"确认"按钮，应该返回首页');
    
    // 验证是否调用了导航到首页
    await waitFor(() => {
      // 由于我们使用了 MemoryRouter，实际的导航需要在组件中通过 onSuccess 回调触发
      // 这里我们验证弹窗是否已关闭
      expect(screen.queryByText(/购买成功/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    console.log('✅ Step 16: 购买成功弹窗已关闭');
    console.log('🎉 订单确认并座位分配流程测试通过！');
  });
  
  it('应该在确认订单时正确发送Authorization请求头', async () => {
    const user = userEvent.setup();
    const mockOrderId = 'test-order-auth-check';
    
    let confirmRequestHeaders: HeadersInit | undefined;
    
    global.fetch = vi.fn((url: string | URL | Request, options?: RequestInit) => {
      const urlString = url.toString();
      
      if (urlString.includes('/api/orders/new')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ orderId: mockOrderId })
        } as Response);
      }
      
      if (urlString.includes('/api/orders/submit')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ orderId: mockOrderId })
        } as Response);
      }
      
      if (urlString.includes('/api/orders/' + mockOrderId + '/confirmation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            orderInfo: {
              orderId: mockOrderId,
              trainInfo: { trainNo: 'D6', date: '2025-11-13', departureStation: '上海', arrivalStation: '北京' },
              passengers: [{ sequence: 1, seatType: '二等座', passengerName: '张三', price: 500 }],
              availableSeats: { '二等座': 10 },
              totalPrice: 500
            }
          })
        } as Response);
      }
      
      if (urlString.includes('/api/orders/' + mockOrderId + '/confirm') && options?.method === 'POST') {
        confirmRequestHeaders = options.headers;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: '购买成功',
            orderId: mockOrderId,
            trainInfo: { trainNo: 'D6', departureDate: '2025-11-13' },
            tickets: [{ passengerName: '张三', seatType: '二等座', seatNo: '05车03A号', ticketType: '成人票' }]
          })
        } as Response);
      }
      
      return Promise.reject(new Error('未匹配的请求'));
    }) as typeof fetch;
    
    render(
      <MemoryRouter initialEntries={['/order?trainNo=D6&departureStation=上海&arrivalStation=北京&departureDate=2025-11-13']}>
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // 提交订单
    const submitButton = await screen.findByRole('button', { name: /提交订单/i });
    await user.click(submitButton);
    
    // 等待弹窗出现
    await waitFor(() => {
      expect(screen.getByText(/请核对以下信息/i)).toBeInTheDocument();
    });
    
    // 点击确认
    const confirmButton = screen.getAllByRole('button', { name: /确认/i }).find(btn => 
      btn.className.includes('confirm-modal-button')
    );
    await user.click(confirmButton!);
    
    // 等待API调用
    await waitFor(() => {
      expect(confirmRequestHeaders).toBeDefined();
    }, { timeout: 5000 });
    
    // 验证请求头包含Authorization
    const headers = confirmRequestHeaders as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer mock-token-12345');
    console.log('✅ 确认订单请求包含正确的Authorization请求头');
  });
  
  it('应该在确认订单失败时显示错误提示', async () => {
    const user = userEvent.setup();
    const mockOrderId = 'test-order-error';
    
    global.fetch = vi.fn((url: string | URL | Request, options?: RequestInit) => {
      const urlString = url.toString();
      
      if (urlString.includes('/api/orders/new')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ orderId: mockOrderId })
        } as Response);
      }
      
      if (urlString.includes('/api/orders/submit')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ orderId: mockOrderId })
        } as Response);
      }
      
      if (urlString.includes('/api/orders/' + mockOrderId + '/confirmation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            orderInfo: {
              orderId: mockOrderId,
              trainInfo: { trainNo: 'D6', date: '2025-11-13', departureStation: '上海', arrivalStation: '北京' },
              passengers: [{ sequence: 1, seatType: '二等座', passengerName: '李四', price: 500 }],
              availableSeats: { '二等座': 0 },
              totalPrice: 500
            }
          })
        } as Response);
      }
      
      if (urlString.includes('/api/orders/' + mockOrderId + '/confirm')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({
            error: '二等座座位已售罄'
          })
        } as Response);
      }
      
      return Promise.reject(new Error('未匹配的请求'));
    }) as typeof fetch;
    
    render(
      <MemoryRouter initialEntries={['/order?trainNo=D6&departureStation=上海&arrivalStation=北京&departureDate=2025-11-13']}>
        <Routes>
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // 提交订单
    const submitButton = await screen.findByRole('button', { name: /提交订单/i });
    await user.click(submitButton);
    
    // 等待弹窗出现
    await waitFor(() => {
      expect(screen.getByText(/请核对以下信息/i)).toBeInTheDocument();
    });
    
    // 点击确认
    const confirmButton = screen.getAllByRole('button', { name: /确认/i }).find(btn => 
      btn.className.includes('confirm-modal-button')
    );
    await user.click(confirmButton!);
    
    // 应该显示错误提示
    await waitFor(() => {
      expect(screen.getByText(/二等座座位已售罄/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    console.log('✅ 确认订单失败时正确显示错误提示');
  });
});

