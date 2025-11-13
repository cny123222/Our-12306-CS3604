import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import OrderPage from '../../src/pages/OrderPage';

// Mock API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: {
        trainNo: 'G27',
        departureStation: '北京南站',
        arrivalStation: '上海虹桥',
        departureDate: '2025-09-14'
      }
    })
  };
});

describe('订单填写页功能测试', () => {
  const mockTrainInfo = {
    trainNo: 'G27',
    departureStation: '北京南站',
    arrivalStation: '上海虹桥',
    departureDate: '2025-09-14',
    departureTime: '19:00',
    arrivalTime: '23:35',
    duration: '4h35m'
  };

  const mockFareInfo = {
    '商务座': { price: 1748, available: 10 },
    '一等座': { price: 933, available: 50 },
    '二等座': { price: 553, available: 100 }
  };

  const mockPassengers = [
    {
      id: 'passenger-1',
      name: '刘蕊蕊',
      idCardType: '居民身份证',
      idCardNumber: '3301************028',
      points: 1200
    },
    {
      id: 'passenger-2',
      name: '王欣',
      idCardType: '居民身份证',
      idCardNumber: '1101************015',
      points: 800
    }
  ];

  beforeEach(() => {
    mockFetch.mockClear();
    mockNavigate.mockClear();
    
    // Mock initial data fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        trainInfo: mockTrainInfo,
        fareInfo: mockFareInfo,
        availableSeats: mockFareInfo,
        passengers: mockPassengers,
        defaultSeatType: '二等座'
      })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('5.3 用户选择乘车人', () => {
    it('Scenario: 用户从列表中勾选一名乘车人 - 未勾选任何乘车人时', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      // 等待页面加载完成
      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选第一个乘车人
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      // 验证购票信息填写区域显示了该乘车人的信息
      await waitFor(() => {
        const purchaseTable = screen.getByText('姓名').closest('table');
        expect(purchaseTable).toBeInTheDocument();
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
        expect(screen.getByDisplayValue('3301************028')).toBeInTheDocument();
      });

      // 验证姓名、证件类型、证件号码不可修改
      const nameInput = screen.getByDisplayValue('刘蕊蕊');
      expect(nameInput).toHaveAttribute('readonly');
      
      const idInput = screen.getByDisplayValue('3301************028');
      expect(idInput).toHaveAttribute('readonly');
    });

    it('Scenario: 用户从列表中勾选多名乘车人 - 已勾选至少一个乘车人时', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 先勾选第一个乘车人
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
      });

      // 再勾选第二个乘车人
      const checkbox2 = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox2);

      // 验证购票信息填写区域增加了新的购票信息行
      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
        expect(screen.getByDisplayValue('王欣')).toBeInTheDocument();
        expect(screen.getByDisplayValue('3301************028')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1101************015')).toBeInTheDocument();
      });

      // 验证序号自动更新
      const purchaseTable = screen.getByText('序号').closest('table');
      expect(purchaseTable).toContainHTML('1');
      expect(purchaseTable).toContainHTML('2');
    });

    it('Scenario: 用户尝试手动输入乘车人姓名 - 输入框应不响应', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选一个乘车人
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
      });

      // 尝试手动输入姓名
      const nameInput = screen.getByDisplayValue('刘蕊蕊');
      fireEvent.change(nameInput, { target: { value: '张三' } });

      // 验证输入框内容无变化
      expect(nameInput).toHaveValue('刘蕊蕊');
    });

    it('Scenario: 用户取消勾选已选乘车人 - 只有一个乘车人时', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选一个乘车人
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
      });

      // 取消勾选
      fireEvent.click(checkbox1);

      // 验证购票信息行恢复至默认状态（序号为1的行）
      await waitFor(() => {
        expect(screen.queryByDisplayValue('刘蕊蕊')).not.toBeInTheDocument();
        const purchaseTable = screen.getByText('序号').closest('table');
        expect(purchaseTable).toContainHTML('1');
      });
    });

    it('Scenario: 用户取消勾选已选乘车人 - 已勾选至少两个乘车人时', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选两个乘车人
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      const checkbox2 = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox1);
      fireEvent.click(checkbox2);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
        expect(screen.getByDisplayValue('王欣')).toBeInTheDocument();
      });

      // 取消勾选第一个乘车人
      fireEvent.click(checkbox1);

      // 验证第一个乘车人的信息行被移除，第二个乘车人信息行保持不变，序号自动调整
      await waitFor(() => {
        expect(screen.queryByDisplayValue('刘蕊蕊')).not.toBeInTheDocument();
        expect(screen.getByDisplayValue('王欣')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1101************015')).toBeInTheDocument();
      });
    });
  });

  describe('5.4 用户选择席位', () => {
    it('Scenario: 用户展开席位下拉菜单 - 仅显示有票席别', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选一个乘车人
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
      });

      // 点击席别下拉菜单
      const seatTypeSelect = screen.getByDisplayValue('二等座（¥553元）');
      fireEvent.click(seatTypeSelect);

      // 验证下拉菜单显示所有有票的席别及其价格
      await waitFor(() => {
        expect(screen.getByText(/商务座.*¥1748元/)).toBeInTheDocument();
        expect(screen.getByText(/一等座.*¥933元/)).toBeInTheDocument();
        expect(screen.getByText(/二等座.*¥553元/)).toBeInTheDocument();
      });
    });

    it('Scenario: 用户更改席位选择 - 席位和票价随之更新', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选一个乘车人
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
        expect(screen.getByDisplayValue('二等座（¥553元）')).toBeInTheDocument();
      });

      // 选择其他席别
      const seatTypeSelect = screen.getByDisplayValue('二等座（¥553元）');
      fireEvent.change(seatTypeSelect, { target: { value: '一等座' } });

      // 验证席位变更为用户选择的席别，票价信息随之更新
      await waitFor(() => {
        expect(screen.getByDisplayValue('一等座（¥933元）')).toBeInTheDocument();
      });
    });
  });

  describe('5.5 用户提交订单', () => {
    it('Scenario: 用户未选择任何乘车人点击"提交订单" - 显示提示', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 点击提交订单按钮（未选择乘车人）
      const submitButton = screen.getByText('提交订单');
      fireEvent.click(submitButton);

      // 验证弹出提示"请选择乘车人！"
      await waitFor(() => {
        expect(screen.getByText('请选择乘车人！')).toBeInTheDocument();
      });

      // 点击"确认"按钮关闭弹窗
      const confirmButton = screen.getByText('确认');
      fireEvent.click(confirmButton);

      // 验证弹窗关闭，页面回到订单填写页
      await waitFor(() => {
        expect(screen.queryByText('请选择乘车人！')).not.toBeInTheDocument();
        expect(screen.getByText('提交订单')).toBeInTheDocument();
      });
    });

    it('Scenario: 用户提交订单时车票售罄 - 显示售罄提示', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选一个乘车人
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
      });

      // Mock提交订单API返回售罄错误
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: '手慢了，该车次席别车票已售罄！' })
      });

      // 点击提交订单按钮
      const submitButton = screen.getByText('提交订单');
      fireEvent.click(submitButton);

      // 验证弹出提示"手慢了，该车次席别车票已售罄！"
      await waitFor(() => {
        expect(screen.getByText('手慢了，该车次席别车票已售罄！')).toBeInTheDocument();
      });

      // 点击"确认"按钮
      const confirmButton = screen.getByText('确认');
      fireEvent.click(confirmButton);

      // 验证页面跳转回车票查询界面
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/trains');
      });
    });

    it('Scenario: 用户选择乘车人后成功提交订单 - 在100ms内跳出信息核对弹窗', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选一个乘车人
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
      });

      // Mock提交订单API成功
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: '订单提交成功',
          orderId: 'order-123',
          orderDetails: {
            trainInfo: mockTrainInfo,
            passengers: [mockPassengers[0]],
            availableSeats: mockFareInfo,
            totalPrice: 553
          }
        })
      });

      // 记录开始时间
      const startTime = Date.now();

      // 点击提交订单按钮
      const submitButton = screen.getByText('提交订单');
      fireEvent.click(submitButton);

      // 验证在100ms内跳出信息核对弹窗
      await waitFor(
        () => {
          expect(screen.getByText('请核对以下信息')).toBeInTheDocument();
          const elapsedTime = Date.now() - startTime;
          expect(elapsedTime).toBeLessThan(100);
        },
        { timeout: 100 }
      );
    });

    it('Scenario: 用户提交订单时网络异常 - 显示网络异常提示', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选一个乘车人
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
      });

      // Mock提交订单API网络错误
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: '网络忙，请稍后再试。' })
      });

      // 点击提交订单按钮
      const submitButton = screen.getByText('提交订单');
      fireEvent.click(submitButton);

      // 验证弹出提示：网络忙，请稍后再试。
      await waitFor(() => {
        expect(screen.getByText('网络忙，请稍后再试。')).toBeInTheDocument();
      });

      // 点击"确认"按钮关闭提示弹窗，回到购票页面
      const confirmButton = screen.getByText('确认');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText('网络忙，请稍后再试。')).not.toBeInTheDocument();
        expect(screen.getByText('提交订单')).toBeInTheDocument();
      });
    });
  });

  describe('5.6 信息核对弹窗', () => {
    beforeEach(async () => {
      // Setup: 创建一个已提交的订单状态
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          trainInfo: mockTrainInfo,
          fareInfo: mockFareInfo,
          availableSeats: mockFareInfo,
          passengers: mockPassengers,
          defaultSeatType: '二等座'
        })
      });
    });

    it('Scenario: 信息核对弹窗显示完整信息', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选一个乘车人并提交订单
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: '订单提交成功',
          orderId: 'order-123',
          orderDetails: {
            trainInfo: mockTrainInfo,
            passengers: [{
              ...mockPassengers[0],
              seatType: '二等座',
              ticketType: '成人票'
            }],
            availableSeats: { '二等座': 99 },
            totalPrice: 553
          }
        })
      });

      const submitButton = screen.getByText('提交订单');
      fireEvent.click(submitButton);

      // 验证信息核对弹窗的布局和内容
      await waitFor(() => {
        // 标题区域
        expect(screen.getByText('请核对以下信息')).toBeInTheDocument();

        // 车次与出行信息区
        expect(screen.getByText(/2025-09-14.*周日/)).toBeInTheDocument();
        expect(screen.getByText(/G27次/)).toBeInTheDocument();
        expect(screen.getByText(/北京南站.*19:00开/)).toBeInTheDocument();
        expect(screen.getByText(/上海虹桥.*23:35到/)).toBeInTheDocument();

        // 乘客信息区
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
        expect(screen.getByText('居民身份证')).toBeInTheDocument();
        expect(screen.getByText('3301************028')).toBeInTheDocument();
        expect(screen.getByText('积分*1200')).toBeInTheDocument();

        // 提示文字
        expect(screen.getByText('系统将随机为您申请席位，暂不支持自选席位')).toBeInTheDocument();

        // 余票信息
        expect(screen.getByText(/本次列车，二等座余票.*99.*张/)).toBeInTheDocument();
        expect(screen.getByText(/二等座余票.*99.*张/)).toBeInTheDocument();

        // 操作按钮
        expect(screen.getByText('返回修改')).toBeInTheDocument();
        expect(screen.getByText('确认')).toBeInTheDocument();
      });
    });

    it('Scenario: 用户在信息核对弹窗点击"返回修改" - 回到订单填写页', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选一个乘车人并提交订单
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: '订单提交成功',
          orderId: 'order-123',
          orderDetails: {
            trainInfo: mockTrainInfo,
            passengers: [mockPassengers[0]],
            availableSeats: mockFareInfo,
            totalPrice: 553
          }
        })
      });

      const submitButton = screen.getByText('提交订单');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请核对以下信息')).toBeInTheDocument();
      });

      // 点击"返回修改"按钮
      const backButton = screen.getByText('返回修改');
      fireEvent.click(backButton);

      // 验证回到订单填写页
      await waitFor(() => {
        expect(screen.queryByText('请核对以下信息')).not.toBeInTheDocument();
        expect(screen.getByText('提交订单')).toBeInTheDocument();
      });
    });

    it('Scenario: 用户在信息核对弹窗点击"确认" - 显示处理中并购买成功提示', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 勾选一个乘车人并提交订单
      const checkbox1 = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: '订单提交成功',
          orderId: 'order-123',
          orderDetails: {
            trainInfo: mockTrainInfo,
            passengers: [mockPassengers[0]],
            availableSeats: mockFareInfo,
            totalPrice: 553
          }
        })
      });

      const submitButton = screen.getByText('提交订单');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请核对以下信息')).toBeInTheDocument();
      });

      // Mock确认订单API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: '订单已经提交，系统正在处理中，请稍等',
          orderId: 'order-123',
          status: 'processing'
        })
      });

      // 点击"确认"按钮
      const confirmButton = screen.getAllByText('确认').find(btn => 
        btn.closest('.order-confirmation-modal')
      );
      fireEvent.click(confirmButton!);

      // 验证弹出提示：订单已经提交，系统正在处理中，请稍等
      await waitFor(() => {
        expect(screen.getByText('订单已经提交，系统正在处理中，请稍等')).toBeInTheDocument();
      });

      // 验证系统为用户保留座位预定信息，弹出提示：购买成功
      await waitFor(() => {
        expect(screen.getByText('购买成功')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('乘客搜索功能', () => {
    it('应该支持按姓名搜索乘客', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
        expect(screen.getByText('王欣')).toBeInTheDocument();
      });

      // 输入搜索关键词
      const searchInput = screen.getByPlaceholderText(/搜索乘客/);
      fireEvent.change(searchInput, { target: { value: '刘蕊蕊' } });

      // 验证只显示匹配的乘客
      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
        expect(screen.queryByText('王欣')).not.toBeInTheDocument();
      });

      // 清空搜索框
      fireEvent.change(searchInput, { target: { value: '' } });

      // 验证显示所有乘客
      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
        expect(screen.getByText('王欣')).toBeInTheDocument();
      });
    });
  });

  describe('上一步按钮功能', () => {
    it('应该点击"上一步"按钮返回车次列表页', async () => {
      render(
        <BrowserRouter>
          <OrderPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      });

      // 点击"上一步"按钮
      const backButton = screen.getByText('上一步');
      fireEvent.click(backButton);

      // 验证页面跳转回车次列表页
      expect(mockNavigate).toHaveBeenCalledWith('/trains');
    });
  });
});

