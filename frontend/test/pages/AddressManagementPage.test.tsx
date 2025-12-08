import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddressManagementPage from '../../src/pages/AddressManagementPage';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import axios from 'axios';

// Mock dependencies
vi.mock('axios');
vi.mock('../../src/components/TrainListTopBar', () => ({
  default: () => <div data-testid="top-bar">TopBar</div>
}));
vi.mock('../../src/components/MainNavigation', () => ({
  default: () => <div data-testid="main-nav">MainNav</div>
}));
vi.mock('../../src/components/SideMenu', () => ({
  default: () => <div data-testid="side-menu">SideMenu</div>
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AddressManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('redirects to login if not logged in', () => {
    // Ensure no auth token
    localStorage.removeItem('authToken');
    
    render(
      <BrowserRouter>
        <AddressManagementPage />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('fetches and displays addresses when logged in', async () => {
    localStorage.setItem('authToken', 'fake-token');
    
    const mockAddresses = [
      {
        id: '1',
        recipient: '张三',
        phone: '13800138000',
        province: '省1',
        city: '市1',
        district: '区1',
        street: '街道1',
        detailAddress: '详细地址1',
        isDefault: true
      }
    ];

    (axios.get as any).mockResolvedValue({ data: { addresses: mockAddresses } });

    render(
      <BrowserRouter>
        <AddressManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/addresses', expect.any(Object));
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
  });

  test('switches to add address view when add button is clicked', async () => {
    localStorage.setItem('authToken', 'fake-token');
    (axios.get as any).mockResolvedValue({ data: { addresses: [] } });

    render(
      <BrowserRouter>
        <AddressManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/增加/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/增加/));

    expect(screen.getByText('选择地址')).toBeInTheDocument(); // Header of AddAddressPanel
  });

  test('saves new address', async () => {
    localStorage.setItem('authToken', 'fake-token');
    (axios.get as any).mockResolvedValue({ data: { addresses: [] } });
    (axios.post as any).mockResolvedValue({ data: { address: { id: '2' } } });

    const { container } = render(
      <BrowserRouter>
        <AddressManagementPage />
      </BrowserRouter>
    );

    // Switch to add view
    await waitFor(() => screen.getByText(/增加/));
    fireEvent.click(screen.getByText(/增加/));

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('请输入省'), { target: { value: '广东省' } });
    fireEvent.change(screen.getByPlaceholderText('请输入市'), { target: { value: '广州市' } });
    fireEvent.change(screen.getByPlaceholderText('请输入区/县'), { target: { value: '天河区' } });
    fireEvent.change(screen.getByPlaceholderText('请输入乡镇'), { target: { value: '街道' } });
    
    const detailInput = container.querySelector('input[name="detailAddress"]');
    if (detailInput) fireEvent.change(detailInput, { target: { value: '详细地址' } });

    const recipientInput = container.querySelector('input[name="recipient"]');
    if (recipientInput) fireEvent.change(recipientInput, { target: { value: '李四' } });

    const phoneInput = container.querySelector('input[name="phone"]');
    if (phoneInput) fireEvent.change(phoneInput, { target: { value: '13900139000' } });

    // Save
    fireEvent.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/addresses', expect.objectContaining({
        recipient: '李四'
      }), expect.any(Object));
    });
  });

  test('deletes address', async () => {
    localStorage.setItem('authToken', 'fake-token');
    const mockAddresses = [
      {
        id: '1',
        recipient: '张三',
        phone: '13800138000',
        province: '省1',
        city: '市1',
        district: '区1',
        street: '街道1',
        detailAddress: '详细地址1',
        isDefault: true
      }
    ];
    (axios.get as any).mockResolvedValue({ data: { addresses: mockAddresses } });
    (axios.delete as any).mockResolvedValue({ data: { message: 'success' } });

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    render(
      <BrowserRouter>
        <AddressManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByTitle('删除'));
    fireEvent.click(screen.getByTitle('删除'));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/addresses/1', expect.any(Object));
    });

    confirmSpy.mockRestore();
  });

  test('displays error when fetching addresses fails', async () => {
    localStorage.setItem('authToken', 'fake-token');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (axios.get as any).mockRejectedValue(new Error('Fetch failed'));

    render(
      <BrowserRouter>
        <AddressManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch addresses:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  test('displays error when saving address fails', async () => {
    localStorage.setItem('authToken', 'fake-token');
    (axios.get as any).mockResolvedValue({ data: { addresses: [] } });
    (axios.post as any).mockRejectedValue(new Error('Save failed'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const { container } = render(
      <BrowserRouter>
        <AddressManagementPage />
      </BrowserRouter>
    );

    // Switch to add view
    await waitFor(() => screen.getByText(/增加/));
    fireEvent.click(screen.getByText(/增加/));

    // Fill minimal form
    fireEvent.change(screen.getByPlaceholderText('请输入省'), { target: { value: '广东省' } });
    fireEvent.change(screen.getByPlaceholderText('请输入市'), { target: { value: '广州市' } });
    fireEvent.change(screen.getByPlaceholderText('请输入区/县'), { target: { value: '天河区' } });
    fireEvent.change(screen.getByPlaceholderText('请输入乡镇'), { target: { value: '街道' } });
    
    const detailInput = container.querySelector('input[name="detailAddress"]');
    if (detailInput) fireEvent.change(detailInput, { target: { value: '详细地址' } });

    const recipientInput = container.querySelector('input[name="recipient"]');
    if (recipientInput) fireEvent.change(recipientInput, { target: { value: '李四' } });

    const phoneInput = container.querySelector('input[name="phone"]');
    if (phoneInput) fireEvent.change(phoneInput, { target: { value: '13900139000' } });

    // Save
    fireEvent.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save address:', expect.any(Error));
      expect(alertSpy).toHaveBeenCalledWith('保存地址失败');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  test('displays error when deleting address fails', async () => {
    localStorage.setItem('authToken', 'fake-token');
    const mockAddresses = [
      {
        id: '1',
        recipient: '张三',
        phone: '13800138000',
        province: '省1',
        city: '市1',
        district: '区1',
        street: '街道1',
        detailAddress: '详细地址1',
        isDefault: true
      }
    ];
    (axios.get as any).mockResolvedValue({ data: { addresses: mockAddresses } });
    (axios.delete as any).mockRejectedValue(new Error('Delete failed'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    render(
      <BrowserRouter>
        <AddressManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByTitle('删除'));
    fireEvent.click(screen.getByTitle('删除'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete address:', expect.any(Error));
      expect(alertSpy).toHaveBeenCalledWith('删除地址失败');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
    confirmSpy.mockRestore();
  });

  test('handles address deletion cancellation', async () => {
    localStorage.setItem('authToken', 'fake-token');
    const mockAddresses = [
      {
        id: '1',
        recipient: '张三',
        phone: '13800138000',
        province: '省1',
        city: '市1',
        district: '区1',
        street: '街道1',
        detailAddress: '详细地址1',
        isDefault: true
      }
    ];
    (axios.get as any).mockResolvedValue({ data: { addresses: mockAddresses } });

    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => false);

    render(
      <BrowserRouter>
        <AddressManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByTitle('删除'));
    fireEvent.click(screen.getByTitle('删除'));

    expect(axios.delete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
