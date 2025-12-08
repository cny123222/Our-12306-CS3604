import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddressListPanel, { Address } from '../../../src/components/Address/AddressListPanel';
import '@testing-library/jest-dom';

describe('AddressListPanel Component', () => {
  const mockOnAddAddress = vi.fn();
  const mockOnDeleteAddress = vi.fn();
  
  const mockAddresses: Address[] = [
    {
      id: '1',
      recipient: '张三',
      detailAddress: '详细地址1',
      province: '省1',
      city: '市1',
      district: '区1',
      street: '街道1',
      surrounding: '',
      phone: '13800138000',
      isDefault: true
    },
    {
      id: '2',
      recipient: '李四',
      detailAddress: '详细地址2',
      province: '省2',
      city: '市2',
      district: '区2',
      street: '街道2',
      surrounding: '',
      phone: '13900139000',
      isDefault: false
    }
  ];

  beforeEach(() => {
    mockOnAddAddress.mockClear();
    mockOnDeleteAddress.mockClear();
  });

  test('renders address list header', () => {
    render(<AddressListPanel addresses={[]} onAddAddress={mockOnAddAddress} onDeleteAddress={mockOnDeleteAddress} />);
    
    expect(screen.getByText('序号')).toBeInTheDocument();
    expect(screen.getByText('收件人')).toBeInTheDocument();
    expect(screen.getByText('地址')).toBeInTheDocument();
    expect(screen.getByText('手机')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  test('renders address items', () => {
    render(<AddressListPanel addresses={mockAddresses} onAddAddress={mockOnAddAddress} onDeleteAddress={mockOnDeleteAddress} />);
    
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('13800138000')).toBeInTheDocument();
    expect(screen.getByText('13900139000')).toBeInTheDocument();
    expect(screen.getByText('省1市1区1街道1详细地址1')).toBeInTheDocument();
  });

  test('calls onAddAddress when add button is clicked', () => {
    render(<AddressListPanel addresses={[]} onAddAddress={mockOnAddAddress} onDeleteAddress={mockOnDeleteAddress} />);
    
    const addButton = screen.getByText(/增加/);
    fireEvent.click(addButton);
    
    expect(mockOnAddAddress).toHaveBeenCalled();
  });

  test('calls onDeleteAddress when delete button is clicked', () => {
    render(<AddressListPanel addresses={mockAddresses} onAddAddress={mockOnAddAddress} onDeleteAddress={mockOnDeleteAddress} />);
    
    const deleteButtons = screen.getAllByTitle('删除');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockOnDeleteAddress).toHaveBeenCalledWith('1');
  });

  test('renders warm tips section', () => {
    render(<AddressListPanel addresses={[]} onAddAddress={mockOnAddAddress} onDeleteAddress={mockOnDeleteAddress} />);
    
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
  });
});
