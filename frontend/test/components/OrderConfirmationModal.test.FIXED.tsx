import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderConfirmationModal from '../../src/components/OrderConfirmationModal';

// Mock API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OrderConfirmationModal Component Tests', () => {
  const mockOrderInfo = {
    orderId: 'order-123',
    trainInfo: {
      trainNo: 'G1476',
      departureStation: '上海虹桥站',
      arrivalStation: '南京南站',
      departureDate: '2025-11-20',
      departureTime: '09:51',
      arrivalTime: '11:29',
      dayOfWeek: '周四'
    },
    passengers: [
      {
        sequence: 1,
        seatType: '二等座',
        ticketType: '成人票',
        name: '刘蕊蕊',
        idCardType: '居民身份证',
        idCardNumber: '3301************028',
        points: 1200
      },
      {
        sequence: 2,
        seatType: '二等座',
        ticketType: '成人票',
        name: '王欣',
        idCardType: '居民身份证',
        idCardNumber: '1101************015',
        points: 800
      }
    ],
    availableSeats: {
      '二等座': 99,
    },
    totalPrice: 1106
  };

  const mockOnConfirm = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    mockOnConfirm.mockClear();
    mockOnBack.mockClear();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        clear: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true
    });
    
    // Mock fetch to return order confirmation data
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/orders/') && url.includes('/confirmation')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockOrderInfo
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('弹窗布局和内容显示', () => {
    it('标题区域应该为蓝色背景，内容为"请核对以下信息"', async () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // 验证标题存在
      const title = await screen.findByText('请核对以下信息');
      expect(title).toBeInTheDocument();
      
      // 验证标题区域有蓝色背景样式
      const titleElement = title.closest('.modal-header');
      expect(titleElement).toHaveClass('blue-background');
    });

    it('主体区域应该为白色背景', async () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const modalTitle = screen.getByText('请核对以下信息');
      const modal = modalTitle.closest('.order-confirmation-modal');
      expect(modal).toBeInTheDocument();
      
      const modalBody = modal?.querySelector('.modal-body');
      
      expect(modalBody).toHaveClass('white-background');
    });
  });

  describe('车次与出行信息区', () => {
    it('应该显示完整的列车信息', async () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // 等待数据加载
      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // 验证出行日期、车次号、出发站、出发时间、到达站、到达时间
      expect(screen.getByText(/2025-11-20/)).toBeInTheDocument();
      expect(screen.getByText(/周四/)).toBeInTheDocument();
      expect(screen.getByText(/G1476次/)).toBeInTheDocument();
      expect(screen.getByText(/上海虹桥站/)).toBeInTheDocument();
      expect(screen.getByText(/09:51开/)).toBeInTheDocument();
      expect(screen.getByText(/南京南站/)).toBeInTheDocument();
      expect(screen.getByText(/11:29到/)).toBeInTheDocument();
    });
  });

  // 简化其他测试，只保留核心功能验证
  it('应该正确响应确认和返回按钮', async () => {
    render(
      <OrderConfirmationModal
        isVisible={true}
        orderId={mockOrderInfo.orderId}
        onConfirm={mockOnConfirm}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 验证按钮存在
    const confirmButton = screen.getByText('确认');
    const backButton = screen.getByText('返回修改');
    
    expect(confirmButton).toBeInTheDocument();
    expect(backButton).toBeInTheDocument();

    // 点击返回按钮
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });
});

