import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PassengerInfoSection from '../../src/components/PassengerInfoSection';

describe('PassengerInfoSection Component Tests', () => {
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
    },
    {
      id: 'passenger-3',
      name: '张三',
      idCardType: '居民身份证',
      idCardNumber: '4401************042',
      points: 500
    }
  ];

  const mockAvailableSeatTypes = [
    { type: '商务座', price: 1748 },
    { type: '一等座', price: 933 },
    { type: '二等座', price: 553 }
  ];

  const mockOnPassengerSelect = vi.fn();
  const mockOnSearchPassenger = vi.fn();

  beforeEach(() => {
    mockOnPassengerSelect.mockClear();
    mockOnSearchPassenger.mockClear();
  });

  describe('乘客列表显示', () => {
    it('应该显示所有乘客信息', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 验证所有乘客都显示
      expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
      expect(screen.getByText('王欣')).toBeInTheDocument();
      expect(screen.getByText('张三')).toBeInTheDocument();
    });

    it('每个乘客前应该有勾选框', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 验证所有勾选框都存在
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(mockPassengers.length);
    });
  });

  describe('乘客选择功能', () => {
    it('勾选乘客应该触发onPassengerSelect回调', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 勾选第一个乘客
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      // 验证回调被调用
      expect(mockOnPassengerSelect).toHaveBeenCalledWith(
        mockPassengers[0].id,
        true
      );
    });

    it('取消勾选乘客应该触发onPassengerSelect回调', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 勾选然后取消勾选第一个乘客
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);
      fireEvent.click(checkbox);

      // 验证取消勾选的回调被调用
      expect(mockOnPassengerSelect).toHaveBeenLastCalledWith(
        mockPassengers[0].id,
        false
      );
    });
  });

  describe('乘客搜索功能', () => {
    it('右上角应该有搜索框', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 验证搜索框存在
      const searchInput = screen.getByPlaceholderText(/搜索/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('输入搜索关键词应该触发onSearchPassenger回调', async () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 输入搜索关键词
      const searchInput = screen.getByPlaceholderText(/搜索/i);
      fireEvent.change(searchInput, { target: { value: '刘蕊蕊' } });

      // 验证搜索回调被调用
      await waitFor(() => {
        expect(mockOnSearchPassenger).toHaveBeenCalledWith('刘蕊蕊');
      });
    });

    it('搜索应该支持实时过滤', async () => {
      const { rerender } = render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 输入搜索关键词
      const searchInput = screen.getByPlaceholderText(/搜索/i);
      fireEvent.change(searchInput, { target: { value: '刘蕊蕊' } });

      // 重新渲染，只显示匹配的乘客
      rerender(
        <PassengerInfoSection
          passengers={[mockPassengers[0]]}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 验证只显示匹配的乘客
      await waitFor(() => {
        expect(screen.getByText('刘蕊蕊')).toBeInTheDocument();
        expect(screen.queryByText('王欣')).not.toBeInTheDocument();
        expect(screen.queryByText('张三')).not.toBeInTheDocument();
      });
    });
  });

  describe('购票信息填写区域', () => {
    it('应该显示购票信息表格', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 验证购票信息表格的列标题
      expect(screen.getByText('序号')).toBeInTheDocument();
      expect(screen.getByText('票种')).toBeInTheDocument();
      expect(screen.getByText('席别')).toBeInTheDocument();
      expect(screen.getByText('姓名')).toBeInTheDocument();
      expect(screen.getByText('证件类型')).toBeInTheDocument();
      expect(screen.getByText('证件号码')).toBeInTheDocument();
    });

    it('默认应该有一条序号为1的购票信息行', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 验证默认有序号为1的行
      const purchaseTable = screen.getByText('序号').closest('table');
      expect(purchaseTable).toContainHTML('1');
    });

    it('票种下拉框应该默认选择"成人票"', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 验证票种默认为成人票
      const ticketTypeSelect = screen.getByDisplayValue('成人票');
      expect(ticketTypeSelect).toBeInTheDocument();
    });

    it('席别下拉框应该自动选择默认席别', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 验证席别默认为二等座
      const seatTypeSelect = screen.getByDisplayValue(/二等座/);
      expect(seatTypeSelect).toBeInTheDocument();
    });

    it('证件类型应该默认为"居民身份证"', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 验证证件类型默认为居民身份证
      const idTypeSelect = screen.getByDisplayValue('居民身份证');
      expect(idTypeSelect).toBeInTheDocument();
    });
  });

  describe('席别下拉框功能', () => {
    it('席别下拉框应该只显示当前有票的席别', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 勾选一个乘客
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      // 点击席别下拉框
      const seatTypeSelect = screen.getAllByRole('combobox').find(
        select => select.getAttribute('name') === 'seatType'
      );
      
      if (seatTypeSelect) {
        fireEvent.click(seatTypeSelect);

        // 验证下拉框显示所有有票的席别及价格
        mockAvailableSeatTypes.forEach(seat => {
          expect(screen.getByText(new RegExp(`${seat.type}.*${seat.price}`))).toBeInTheDocument();
        });
      }
    });

    it('用户选择席别后应该更新购票信息', async () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 勾选一个乘客
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      // 查找席别下拉框并更改选择
      const seatTypeSelect = screen.getAllByRole('combobox').find(
        select => select.getAttribute('name') === 'seatType'
      );

      if (seatTypeSelect) {
        fireEvent.change(seatTypeSelect, { target: { value: '一等座' } });

        // 验证席别已更新
        await waitFor(() => {
          expect(seatTypeSelect).toHaveValue('一等座');
        });
      }
    });
  });

  describe('购票信息自动填充', () => {
    it('勾选乘客应该自动填充购票信息', async () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 勾选第一个乘客
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      // 验证购票信息已自动填充
      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
        expect(screen.getByDisplayValue('居民身份证')).toBeInTheDocument();
        expect(screen.getByDisplayValue('3301************028')).toBeInTheDocument();
      });
    });

    it('姓名、证件类型、证件号码应该不可手动修改', async () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 勾选第一个乘客
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('刘蕊蕊');
        const idInput = screen.getByDisplayValue('3301************028');

        // 验证字段为只读
        expect(nameInput).toHaveAttribute('readonly');
        expect(idInput).toHaveAttribute('readonly');
      });
    });

    it('勾选多个乘客应该添加多个购票信息行', async () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 勾选多个乘客
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      // 验证有多个购票信息行
      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
        expect(screen.getByDisplayValue('王欣')).toBeInTheDocument();
        expect(screen.getByDisplayValue('3301************028')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1101************015')).toBeInTheDocument();
      });
    });

    it('取消勾选应该移除对应的购票信息行', async () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 勾选两个乘客
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('刘蕊蕊')).toBeInTheDocument();
        expect(screen.getByDisplayValue('王欣')).toBeInTheDocument();
      });

      // 取消勾选第一个乘客
      fireEvent.click(checkboxes[0]);

      // 验证第一个乘客的购票信息行被移除
      await waitFor(() => {
        expect(screen.queryByDisplayValue('刘蕊蕊')).not.toBeInTheDocument();
        expect(screen.getByDisplayValue('王欣')).toBeInTheDocument();
      });
    });
  });

  describe('边界情况测试', () => {
    it('没有乘客时应该显示提示信息', () => {
      render(
        <PassengerInfoSection
          passengers={[]}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 验证显示无乘客提示
      expect(screen.getByText(/暂无乘客/i)).toBeInTheDocument();
    });

    it('没有可用席别时应该显示提示信息', () => {
      render(
        <PassengerInfoSection
          passengers={mockPassengers}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={[]}
          defaultSeatType=""
        />
      );

      // 勾选一个乘客
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);

      // 验证显示无可用席别提示
      expect(screen.getByText(/暂无可用席别/i)).toBeInTheDocument();
    });

    it('搜索无结果时应该显示提示信息', () => {
      render(
        <PassengerInfoSection
          passengers={[]}
          onPassengerSelect={mockOnPassengerSelect}
          onSearchPassenger={mockOnSearchPassenger}
          availableSeatTypes={mockAvailableSeatTypes}
          defaultSeatType="二等座"
        />
      );

      // 验证显示无搜索结果提示
      expect(screen.getByText(/暂无乘客/i)).toBeInTheDocument();
    });
  });
});

