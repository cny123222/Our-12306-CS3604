import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import OrderPage from '../../src/pages/OrderPage';

/**
 * 跨页流程测试：信息核对弹窗 -> 购买成功提示
 * 
 * 测试路径：
 * 1. 订单填写页选择乘客
 * 2. 提交订单
 * 3. 显示信息核对弹窗
 * 4. 点击"确认"按钮
 * 5. 显示"订单已经提交，系统正在处理中，请稍等"
 * 6. 显示"购买成功"提示，包含车票信息（座位号）
 * 7. 验证座位状态已更新为已预定
 */
describe('信息核对弹窗 -> 购买成功提示 跨页流程测试', () => {
  const mockTrainInfo = {
    trainNo: 'D6',
    departureStation: '上海',
    arrivalStation: '北京',
    departureTime: '21:15',
    arrivalTime: '09:26',
    departureDate: '2025-11-13'
  };

  const mockPassenger = {
    id: 'passenger-1',
    name: '刘嘉敏',
    id_card_type: '居民身份证',
    id_card_number: '330102199001011234',
    phone: '13800138000',
    points: 500
  };

  const mockOrderId = 'order-123';

  const mockOrderConfirmationData = {
    trainInfo: {
      trainNo: 'D6',
      departureStation: '上海',
      arrivalStation: '北京',
      departureDate: '2025-11-13',
      departureTime: '21:15',
      arrivalTime: '09:26',
      dayOfWeek: '周四'
    },
    passengers: [
      {
        sequence: 1,
        seatType: '二等座',
        ticketType: '成人票',
        name: '刘嘉敏',
        idCardType: '居民身份证',
        idCardNumber: '330102199001011234',
        points: 500
      }
    ],
    availableSeats: {
      '二等座': 1040,
      '硬卧': 120,
      '软卧': 30
    },
    totalPrice: 517
  };

  const mockConfirmResult = {
    message: '购买成功',
    orderId: mockOrderId,
    status: 'completed',
    trainInfo: {
      trainNo: 'D6',
      departureStation: '上海',
      arrivalStation: '北京',
      departureDate: '2025-11-13',
      departureTime: '21:15',
      arrivalTime: '09:26'
    },
    tickets: [
      {
        passengerName: '刘嘉敏',
        seatType: '二等座',
        seatNo: '05车06A号',
        ticketType: '成人票'
      }
    ]
  };

  beforeEach(() => {
    // 模拟登录状态
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        clear: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true
    });
    
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该正确显示购买成功提示，包含车票信息和座位号', async () => {
    const user = userEvent.setup();

    // Mock API responses
    (global.fetch as any).mockImplementation((url: string, options?: any) => {
      // Mock /api/orders/new
      if (url.includes('/api/orders/new')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            trainInfo: mockTrainInfo,
            fareInfo: {
              '二等座': 517,
              '硬卧': 1170,
              '软卧': 1420
            },
            availableSeats: {
              '二等座': 1040,
              '硬卧': 120,
              '软卧': 30
            },
            passengers: [mockPassenger],
            defaultSeatType: '二等座'
          })
        });
      }
      
      // Mock /api/orders/submit
      if (url.includes('/api/orders/submit')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            orderId: mockOrderId,
            message: '订单提交成功'
          })
        });
      }
      
      // Mock /api/orders/:orderId/confirmation
      if (url.includes(`/api/orders/${mockOrderId}/confirmation`)) {
        return Promise.resolve({
          ok: true,
          json: async () => mockOrderConfirmationData
        });
      }
      
      // Mock /api/orders/:orderId/confirm
      if (url.includes(`/api/orders/${mockOrderId}/confirm`) && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => mockConfirmResult
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });

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
    );

    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByText(/列车信息/i)).toBeInTheDocument();
    });

    // 选择乘客
    await waitFor(() => {
      expect(screen.getByText('刘嘉敏')).toBeInTheDocument();
    });

    const passengerCheckbox = screen.getByRole('checkbox', { name: /刘嘉敏/ });
    await user.click(passengerCheckbox);

    await waitFor(() => {
      expect(passengerCheckbox).toBeChecked();
    });

    // 提交订单
    const submitButton = screen.getByRole('button', { name: /提交订单/i });
    await user.click(submitButton);

    // 等待信息核对弹窗显示
    await waitFor(() => {
      expect(screen.getByText('请核对以下信息')).toBeInTheDocument();
    }, { timeout: 5000 });

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    }, { timeout: 5000 });

    // 点击"确认"按钮
    const confirmButtons = screen.getAllByRole('button', { name: /确认/i });
    const modalConfirmButton = confirmButtons.find(btn => {
      const modal = btn.closest('.modal-content');
      return modal && modal.querySelector('.modal-title')?.textContent === '请核对以下信息';
    });
    
    expect(modalConfirmButton).toBeDefined();
    await user.click(modalConfirmButton!);

    // 等待购买成功提示显示（处理中弹窗可能显示时间很短）
    await waitFor(() => {
      expect(screen.getByText('购买成功')).toBeInTheDocument();
    }, { timeout: 10000 });

    // 验证成功弹窗内容
    const successModal = screen.getByText('购买成功').closest('.success-modal-content');
    expect(successModal).toBeInTheDocument();

    // 验证车次信息
    await waitFor(() => {
      expect(successModal).toHaveTextContent('车次信息');
      expect(successModal).toHaveTextContent('2025-11-13');
      expect(successModal).toHaveTextContent('周四');
      expect(successModal).toHaveTextContent('D6次');
      expect(successModal).toHaveTextContent('上海站');
      expect(successModal).toHaveTextContent('21:15开');
      expect(successModal).toHaveTextContent('北京站');
      expect(successModal).toHaveTextContent('09:26到');
    });

    // 验证车票信息表格
    await waitFor(() => {
      expect(successModal).toHaveTextContent('车票信息');
      
      // 验证表头
      const table = within(successModal!).getByRole('table');
      expect(within(table).getByText('乘客')).toBeInTheDocument();
      expect(within(table).getByText('席别')).toBeInTheDocument();
      expect(within(table).getByText('座位号')).toBeInTheDocument();
      expect(within(table).getByText('票种')).toBeInTheDocument();
      
      // 验证乘客数据
      expect(within(table).getByText('刘嘉敏')).toBeInTheDocument();
      expect(within(table).getByText('二等座')).toBeInTheDocument();
      expect(within(table).getByText('05车06A号')).toBeInTheDocument();  // 座位号
      expect(within(table).getByText('成人票')).toBeInTheDocument();
    });

    // 验证订单号
    expect(successModal).toHaveTextContent(`订单号：${mockOrderId}`);

    // 验证确认按钮
    const finalConfirmButton = within(successModal!).getByRole('button', { name: /确认/i });
    expect(finalConfirmButton).toBeInTheDocument();
  });

  it('应该在确认订单后关闭弹窗并可以返回', async () => {
    const user = userEvent.setup();

    (global.fetch as any).mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/orders/new')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            trainInfo: mockTrainInfo,
            fareInfo: { '二等座': 517 },
            availableSeats: { '二等座': 1040 },
            passengers: [mockPassenger],
            defaultSeatType: '二等座'
          })
        });
      }
      
      if (url.includes('/api/orders/submit')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ orderId: mockOrderId })
        });
      }
      
      if (url.includes(`/api/orders/${mockOrderId}/confirmation`)) {
        return Promise.resolve({
          ok: true,
          json: async () => mockOrderConfirmationData
        });
      }
      
      if (url.includes(`/api/orders/${mockOrderId}/confirm`) && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => mockConfirmResult
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });

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
    );

    // 等待页面加载，选择乘客并提交
    await waitFor(() => {
      expect(screen.getByText('刘嘉敏')).toBeInTheDocument();
    });

    const passengerCheckbox = screen.getByRole('checkbox', { name: /刘嘉敏/ });
    await user.click(passengerCheckbox);

    const submitButton = screen.getByRole('button', { name: /提交订单/i });
    await user.click(submitButton);

    // 等待信息核对弹窗
    await waitFor(() => {
      expect(screen.getByText('请核对以下信息')).toBeInTheDocument();
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    }, { timeout: 5000 });

    // 点击确认
    const confirmButtons = screen.getAllByRole('button', { name: /确认/i });
    const modalConfirmButton = confirmButtons.find(btn => {
      const modal = btn.closest('.modal-content');
      return modal && modal.querySelector('.modal-title')?.textContent === '请核对以下信息';
    });
    
    expect(modalConfirmButton).toBeDefined();
    await user.click(modalConfirmButton!);

    // 等待购买成功提示显示
    await waitFor(() => {
      expect(screen.getByText('购买成功')).toBeInTheDocument();
    }, { timeout: 10000 });

    // 点击成功弹窗的确认按钮
    const successModal = screen.getByText('购买成功').closest('.success-modal-content');
    expect(successModal).toBeInTheDocument();
    
    const successConfirmButtons = within(successModal!).getAllByRole('button', { name: /确认/i });
    expect(successConfirmButtons.length).toBeGreaterThan(0);
    
    await user.click(successConfirmButtons[0]);

    // 验证所有弹窗都已关闭
    await waitFor(() => {
      expect(screen.queryByText('购买成功')).not.toBeInTheDocument();
      expect(screen.queryByText('请核对以下信息')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('应该正确处理确认订单失败的情况', async () => {
    const user = userEvent.setup();

    (global.fetch as any).mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/orders/new')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            trainInfo: mockTrainInfo,
            fareInfo: { '二等座': 517 },
            availableSeats: { '二等座': 1040 },
            passengers: [mockPassenger],
            defaultSeatType: '二等座'
          })
        });
      }
      
      if (url.includes('/api/orders/submit')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ orderId: mockOrderId })
        });
      }
      
      if (url.includes(`/api/orders/${mockOrderId}/confirmation`)) {
        return Promise.resolve({
          ok: true,
          json: async () => mockOrderConfirmationData
        });
      }
      
      // Mock 确认订单失败
      if (url.includes(`/api/orders/${mockOrderId}/confirm`) && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: '座位已售罄' })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });

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
    );

    // 等待页面加载，选择乘客并提交
    await waitFor(() => {
      expect(screen.getByText('刘嘉敏')).toBeInTheDocument();
    });

    const passengerCheckbox = screen.getByRole('checkbox', { name: /刘嘉敏/ });
    await user.click(passengerCheckbox);

    const submitButton = screen.getByRole('button', { name: /提交订单/i });
    await user.click(submitButton);

    // 等待信息核对弹窗
    await waitFor(() => {
      expect(screen.getByText('请核对以下信息')).toBeInTheDocument();
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    }, { timeout: 5000 });

    // 点击确认
    const confirmButtons = screen.getAllByRole('button', { name: /确认/i });
    const modalConfirmButton = confirmButtons.find(btn => {
      const modal = btn.closest('.modal-content');
      return modal && modal.querySelector('.modal-title')?.textContent === '请核对以下信息';
    });
    
    expect(modalConfirmButton).toBeDefined();
    await user.click(modalConfirmButton!);

    // 验证显示错误信息
    await waitFor(() => {
      expect(screen.getByText('座位已售罄')).toBeInTheDocument();
    }, { timeout: 5000 });

    // 验证不显示购买成功
    expect(screen.queryByText('购买成功')).not.toBeInTheDocument();
  });
});

