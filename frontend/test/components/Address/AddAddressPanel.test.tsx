import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddAddressPanel from '../../../src/components/Address/AddAddressPanel';
import '@testing-library/jest-dom';

describe('AddAddressPanel Component', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
  });

  test('renders all input fields', () => {
    const { container } = render(<AddAddressPanel onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByText('选择地址')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入省')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入市')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入区/县')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入乡镇')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入附近区域')).toBeInTheDocument();
    
    // For inputs without placeholders, check by name attribute
    expect(container.querySelector('input[name="detailAddress"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="recipient"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="phone"]')).toBeInTheDocument();
  });

  test('validates required fields', () => {
    render(<AddAddressPanel onSave={mockOnSave} onCancel={mockOnCancel} />);

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    // Check for error messages
    expect(screen.getByText('请完整填写所在地区信息')).toBeInTheDocument();
    expect(screen.getByText('请输入详细地址')).toBeInTheDocument();
    expect(screen.getByText('请输入收件人姓名')).toBeInTheDocument();
    expect(screen.getByText('请输入手机号码')).toBeInTheDocument();
  });

  test('submits form with valid data', () => {
    const { container } = render(<AddAddressPanel onSave={mockOnSave} onCancel={mockOnCancel} />);

    fireEvent.change(screen.getByPlaceholderText('请输入省'), { target: { value: '广东省' } });
    fireEvent.change(screen.getByPlaceholderText('请输入市'), { target: { value: '广州市' } });
    fireEvent.change(screen.getByPlaceholderText('请输入区/县'), { target: { value: '天河区' } });
    fireEvent.change(screen.getByPlaceholderText('请输入乡镇'), { target: { value: '街道' } });
    
    const detailInput = container.querySelector('input[name="detailAddress"]');
    if (detailInput) fireEvent.change(detailInput, { target: { value: '详细地址123' } });

    const recipientInput = container.querySelector('input[name="recipient"]');
    if (recipientInput) fireEvent.change(recipientInput, { target: { value: '张三' } });

    const phoneInput = container.querySelector('input[name="phone"]');
    if (phoneInput) fireEvent.change(phoneInput, { target: { value: '13800138000' } });

    fireEvent.click(screen.getByText('保存'));

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      province: '广东省',
      city: '广州市',
      district: '天河区',
      street: '街道',
      detailAddress: '详细地址123',
      recipient: '张三',
      phone: '13800138000'
    }));
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<AddAddressPanel onSave={mockOnSave} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByText('取消'));

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
