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
      '无座': 50
    },
    totalPrice: 1106
  };

  const mockOnConfirm = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    mockOnConfirm.mockClear();
    mockOnBack.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('弹窗布局和内容显示', () => {
    it('标题区域应该为蓝色背景，内容为"请核对以下信息"', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // 验证标题存在
      const title = screen.getByText('请核对以下信息');
      expect(title).toBeInTheDocument();
      
      // 验证标题区域有蓝色背景样式
      const titleElement = title.closest('.modal-header');
      expect(titleElement).toHaveClass('blue-background');
    });

    it('主体区域应该为白色背景', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const modalBody = screen.getByText('请核对以下信息')
        .closest('.modal')
        .querySelector('.modal-body');
      
      expect(modalBody).toHaveClass('white-background');
    });
  });

  describe('车次与出行信息区', () => {
    it('应该显示完整的列车信息', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // 验证出行日期、车次号、出发站、出发时间、到达站、到达时间
      expect(screen.getByText(/2025-11-20/)).toBeInTheDocument();
      expect(screen.getByText(/周四/)).toBeInTheDocument();
      expect(screen.getByText(/G1476次/)).toBeInTheDocument();
      expect(screen.getByText(/上海虹桥站/)).toBeInTheDocument();
      expect(screen.getByText(/09:51开/)).toBeInTheDocument();
      expect(screen.getByText(/南京南站/)).toBeInTheDocument();
      expect(screen.getByText(/11:29到/)).toBeInTheDocument();
    });

    it('日期、车次号、出发时间应该使用黑色粗体', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const trainInfoSection = screen.getByText(/G1476次/).closest('.train-info');
      const boldElements = trainInfoSection?.querySelectorAll('.bold');
      
      expect(boldElements).toBeDefined();
      expect(boldElements!.length).toBeGreaterThan(0);
    });
  });

  describe('乘客信息区', () => {
    it('应该以表格形式展示所有乘客信息', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // 验证表格列标题
      expect(screen.getByText('序号')).toBeInTheDocument();
      expect(screen.getByText('席别')).toBeInTheDocument();
      expect(screen.getByText('票种')).toBeInTheDocument();
      expect(screen.getByText('姓名')).toBeInTheDocument();
      expect(screen.getByText('证件类型')).toBeInTheDocument();
      expect(screen.getByText('证件号码')).toBeInTheDocument();

      // 验证所有乘客信息都显示
      expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      expect(screen.getByText('王欣')).toBeInTheDocument();
      expect(screen.getByText('3301************028')).toBeInTheDocument();
      expect(screen.getByText('1101************015')).toBeInTheDocument();
    });

    it('乘客姓名右侧应该显示绿色背景的"积分*n"标签', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // 验证积分标签存在
      expect(screen.getByText('积分*1200')).toBeInTheDocument();
      expect(screen.getByText('积分*800')).toBeInTheDocument();

      // 验证积分标签有绿色背景
      const pointsLabel = screen.getByText('积分*1200');
      expect(pointsLabel).toHaveClass('points-label');
      expect(pointsLabel).toHaveClass('green-background');
    });

    it('表格下方应该显示提示："系统将随机为您申请席位，暂不支持自选席位"', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('系统将随机为您申请席位，暂不支持自选席位')).toBeInTheDocument();
    });
  });

  describe('余票信息与操作按钮区', () => {
    it('应该以灰色字体显示余票状态', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // 验证余票信息显示格式
      const seatInfo = screen.getByText(/本次列车，二等座余票.*99.*张，无座余票.*50.*张/);
      expect(seatInfo).toBeInTheDocument();
      expect(seatInfo).toHaveClass('gray-text');
    });

    it('余票数量应该用红色字体高亮显示', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      // 验证余票数量有红色高亮
      const seatNumbers = screen.getAllByText(/99|50/);
      seatNumbers.forEach(number => {
        expect(number).toHaveClass('red-text');
      });
    });

    it('应该有"返回修改"和"确认"按钮', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const backButton = screen.getByText('返回修改');
      const confirmButton = screen.getByText('确认');

      expect(backButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();
    });

    it('"返回修改"按钮应该为白色背景、灰色文字', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const backButton = screen.getByText('返回修改');
      expect(backButton).toHaveClass('white-background');
      expect(backButton).toHaveClass('gray-text');
    });

    it('"确认"按钮应该为橙色背景、白色文字', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const confirmButton = screen.getByText('确认');
      expect(confirmButton).toHaveClass('orange-background');
      expect(confirmButton).toHaveClass('white-text');
    });
  });

  describe('用户交互功能', () => {
    it('点击"返回修改"按钮应该回到订单填写页', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const backButton = screen.getByText('返回修改');
      fireEvent.click(backButton);

      // 验证onBack回调被调用
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('点击"确认"按钮应该提交订单', async () => {
      // Mock确认订单API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: '订单已经提交，系统正在处理中，请稍等',
          orderId: mockOrderInfo.orderId,
          status: 'processing'
        })
      });

      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const confirmButton = screen.getByText('确认');
      fireEvent.click(confirmButton);

      // 验证onConfirm回调被调用
      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it('点击"确认"后应该显示处理中提示："订单已经提交，系统正在处理中，请稍等"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: '订单已经提交，系统正在处理中，请稍等',
          orderId: mockOrderInfo.orderId,
          status: 'processing'
        })
      });

      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const confirmButton = screen.getByText('确认');
      fireEvent.click(confirmButton);

      // 验证显示处理中提示
      await waitFor(() => {
        expect(screen.getByText('订单已经提交，系统正在处理中，请稍等')).toBeInTheDocument();
      });
    });

    it('处理成功后应该显示"购买成功"提示', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: '订单已经提交，系统正在处理中，请稍等',
          orderId: mockOrderInfo.orderId,
          status: 'processing'
        })
      });

      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const confirmButton = screen.getByText('确认');
      fireEvent.click(confirmButton);

      // 等待处理完成后显示购买成功
      await waitFor(() => {
        expect(screen.getByText('购买成功')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('弹窗显示/隐藏控制', () => {
    it('isVisible为false时不应该显示弹窗', () => {
      render(
        <OrderConfirmationModal
          isVisible={false}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(screen.queryByText('请核对以下信息')).not.toBeInTheDocument();
    });

    it('isVisible为true时应该显示弹窗', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('请核对以下信息')).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('确认订单失败时应该显示错误提示', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: '确认订单失败' })
      });

      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const confirmButton = screen.getByText('确认');
      fireEvent.click(confirmButton);

      // 验证显示错误提示
      await waitFor(() => {
        expect(screen.getByText('确认订单失败')).toBeInTheDocument();
      });
    });

    it('订单不存在时应该显示错误提示', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: '订单不存在' })
      });

      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      const confirmButton = screen.getByText('确认');
      fireEvent.click(confirmButton);

      // 验证显示错误提示
      await waitFor(() => {
        expect(screen.getByText('订单不存在')).toBeInTheDocument();
      });
    });
  });

  describe('边界情况测试', () => {
    it('没有乘客信息时应该显示提示', () => {
      const emptyOrderInfo = {
        ...mockOrderInfo,
        passengers: []
      };

      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={emptyOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/暂无乘客信息/i)).toBeInTheDocument();
    });

    it('没有余票信息时应该显示提示', () => {
      const noSeatOrderInfo = {
        ...mockOrderInfo,
        availableSeats: {}
      };

      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={noSeatOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/暂无余票信息/i)).toBeInTheDocument();
    });

    it('总价应该正确显示', () => {
      render(
        <OrderConfirmationModal
          isVisible={true}
          orderId={mockOrderInfo.orderId}
          orderInfo={mockOrderInfo}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/总价.*1106/)).toBeInTheDocument();
    });
  });
});

