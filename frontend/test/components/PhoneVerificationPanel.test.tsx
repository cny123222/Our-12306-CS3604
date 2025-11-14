import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhoneVerificationPanel from '../../src/components/PhoneVerificationPanel';
import '@testing-library/jest-dom';

describe('PhoneVerificationPanel 手机核验信息展示面板组件', () => {
  const mockOriginalPhone = '15812349968';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UI-PhoneVerificationPanel: 基本渲染', () => {
    it('应该分为上下两个模块和按钮组件', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const sections = document.querySelectorAll('.info-section');
      expect(sections.length).toBe(2);
      
      const buttonGroup = document.querySelector('.button-group');
      expect(buttonGroup).toBeInTheDocument();
    });

    it('应该显示手机核验模块', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      expect(screen.getByText('手机核验')).toBeInTheDocument();
    });

    it('应该显示登录密码模块', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      expect(screen.getByText('登录密码')).toBeInTheDocument();
    });

    it('应该显示取消和确认按钮', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('确认')).toBeInTheDocument();
    });
  });

  describe('REQ-7.1.3: 手机核验模块', () => {
    it('应该显示原手机号，中间四位用*隐去', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      expect(screen.getByText('原手机号：')).toBeInTheDocument();
      expect(screen.getByText('(+86)158****9968')).toBeInTheDocument();
      expect(screen.getByText('已通过核验')).toBeInTheDocument();
    });

    it('应该显示新手机号输入框', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      expect(screen.getByText('新手机号：')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('请输入新手机号');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('maxLength', '11');
    });

    it('已通过核验应该显示为蓝色字体', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      const verified = screen.getByText('已通过核验');
      expect(verified).toHaveStyle({ color: '#1890ff' });
    });
  });

  describe('REQ-7.1.3: 登录密码模块', () => {
    it('应该显示密码输入框', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      expect(screen.getByText('登录密码：')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('请输入登录密码');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('应该显示提示文字"正确输入密码才能修改密保"', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      expect(screen.getByText('正确输入密码才能修改密保')).toBeInTheDocument();
      const hint = screen.getByText('正确输入密码才能修改密保');
      expect(hint).toHaveClass('password-hint');
      expect(hint).toHaveStyle({ color: '#999' });
    });
  });

  describe('REQ-7.2.1: 用户输入新手机号码 - 过短', () => {
    it('Scenario: Given 用户在手机核验页, When 用户输入的手机号码长度小于11个字符, Then 系统提示：您输入的手机号码不是有效的格式！', async () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const input = screen.getByPlaceholderText('请输入新手机号');
      fireEvent.change(input, { target: { value: '1234567' } });

      await waitFor(() => {
        expect(screen.getByText('您输入的手机号码不是有效的格式！')).toBeInTheDocument();
      });
    });
  });

  describe('REQ-7.2.1: 用户输入新手机号码 - 过长', () => {
    it('Scenario: Given 用户在手机核验页, And 用户已经输入了一个11个字符的手机号码, When 用户尝试在手机号码输入框中输入第12个字符, Then 系统仅保留用户最初输入的11个字符手机号码', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const input = screen.getByPlaceholderText('请输入新手机号') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '12345678901' } });
      expect(input.value).toBe('12345678901');
      expect(input.value.length).toBe(11);
      
      // 尝试输入第12个字符
      fireEvent.change(input, { target: { value: '123456789012' } });
      // 由于maxLength=11，第12个字符不会被输入
      expect(input.value).toBe('12345678901');
    });
  });

  describe('REQ-7.2.1: 用户输入新手机号码 - 包含特殊字符', () => {
    it('Scenario: Given 用户在手机核验页, When 用户输入的手机号码包含除了数字以外的字符, Then 系统提示：您输入的手机号码不是有效的格式！', async () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const input = screen.getByPlaceholderText('请输入新手机号');
      fireEvent.change(input, { target: { value: '1234567890@' } });

      await waitFor(() => {
        expect(screen.getByText('您输入的手机号码不是有效的格式！')).toBeInTheDocument();
      });
    });
  });

  describe('REQ-7.2.1: 用户输入新手机号码 - 包含非数字字符', () => {
    it('Scenario: Given 用户在手机核验页, When 用户输入的手机号码包含除了数字以外的字符, Then 系统提示：您输入的手机号码不是有效的格式！', async () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const input = screen.getByPlaceholderText('请输入新手机号');
      fireEvent.change(input, { target: { value: '1234567890a' } });

      await waitFor(() => {
        expect(screen.getByText('您输入的手机号码不是有效的格式！')).toBeInTheDocument();
      });
    });
  });

  describe('REQ-7.2.1: 用户输入符合手机号码规范的内容', () => {
    it('Scenario: Given 用户在手机核验页, When 用户输入的手机号码长度为11个字符且只包含数字, Then 不出现系统提示', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const input = screen.getByPlaceholderText('请输入新手机号');
      fireEvent.change(input, { target: { value: '13812345678' } });

      const errorMessage = screen.queryByText('您输入的手机号码不是有效的格式！');
      expect(errorMessage).not.toBeInTheDocument();
    });
  });

  describe('REQ-7.2.2: 用户输入登录密码 - 未输入', () => {
    it('Scenario: Given 用户在手机核验页, When 用户点击"确认"按钮且未输入密码, Then 系统提示：输入登录密码！', () => {
      const mockOnSubmit = vi.fn();
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} onSubmit={mockOnSubmit} />);
      
      // 输入有效的手机号
      const phoneInput = screen.getByPlaceholderText('请输入新手机号');
      fireEvent.change(phoneInput, { target: { value: '13812345678' } });
      
      // 不输入密码，直接点击确认
      const confirmBtn = screen.getByText('确认');
      fireEvent.click(confirmBtn);

      expect(screen.getByText('输入登录密码！')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('REQ-7.2.2: 用户输入错误的密码', () => {
    it('Scenario: Given 用户在手机核验页, And 用户输入的密码与数据库中记录的该用户的登录密码不同, When 用户点击"确认"按钮, Then 系统无响应', async () => {
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('密码错误'));
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} onSubmit={mockOnSubmit} />);
      
      const phoneInput = screen.getByPlaceholderText('请输入新手机号');
      fireEvent.change(phoneInput, { target: { value: '13812345678' } });
      
      const passwordInput = screen.getByPlaceholderText('请输入登录密码');
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      
      const confirmBtn = screen.getByText('确认');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('REQ-7.2.2: 用户输入正确的密码', () => {
    it('Scenario: Given 用户在手机核验页, And 用户输入的密码正确, And 用户输入符合手机号码规范的内容, When 用户点击"确认"按钮, Then 系统弹出"手机验证弹窗"', () => {
      const mockOnSubmit = vi.fn();
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} onSubmit={mockOnSubmit} />);
      
      const phoneInput = screen.getByPlaceholderText('请输入新手机号');
      fireEvent.change(phoneInput, { target: { value: '13812345678' } });
      
      const passwordInput = screen.getByPlaceholderText('请输入登录密码');
      fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
      
      const confirmBtn = screen.getByText('确认');
      fireEvent.click(confirmBtn);

      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe('REQ-7.1.3: 按钮组件', () => {
    it('取消按钮应该为白色背景、黑色文字', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      const cancelBtn = screen.getByText('取消');
      expect(cancelBtn).toHaveClass('cancel-btn');
      expect(cancelBtn).toHaveStyle({ 
        backgroundColor: 'white',
        color: '#000'
      });
    });

    it('确认按钮应该为橙色背景、白色文字', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      const confirmBtn = screen.getByText('确认');
      expect(confirmBtn).toHaveClass('confirm-btn');
      expect(confirmBtn).toHaveStyle({ 
        backgroundColor: '#ff6700',
        color: 'white'
      });
    });

    it('Given: 用户点击"取消"按钮, When: 触发点击事件, Then: 应该调用回调函数', () => {
      const mockOnCancel = vi.fn();
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} onCancel={mockOnCancel} />);
      
      const cancelBtn = screen.getByText('取消');
      fireEvent.click(cancelBtn);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('UI元素存在性检查', () => {
    it('所有必需的输入框应该存在且可编辑', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const phoneInput = screen.getByPlaceholderText('请输入新手机号');
      expect(phoneInput).toBeInTheDocument();
      expect(phoneInput).not.toBeDisabled();
      
      const passwordInput = screen.getByPlaceholderText('请输入登录密码');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).not.toBeDisabled();
    });

    it('所有按钮应该存在且可点击', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const cancelBtn = screen.getByText('取消');
      expect(cancelBtn).toBeVisible();
      expect(cancelBtn).toHaveStyle({ cursor: 'pointer' });
      
      const confirmBtn = screen.getByText('确认');
      expect(confirmBtn).toBeVisible();
      expect(confirmBtn).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('边界情况', () => {
    it('Given: 原手机号为空, When: 渲染组件, Then: 应该正常显示', () => {
      render(<PhoneVerificationPanel originalPhone="" />);
      const panel = document.querySelector('.phone-verification-panel');
      expect(panel).toBeInTheDocument();
    });

    it('Given: 原手机号格式异常, When: 渲染组件, Then: 应该显示原始值', () => {
      render(<PhoneVerificationPanel originalPhone="123" />);
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('Given: 未提供回调函数, When: 点击按钮, Then: 不应该抛出错误', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const cancelBtn = screen.getByText('取消');
      expect(() => fireEvent.click(cancelBtn)).not.toThrow();
      
      const confirmBtn = screen.getByText('确认');
      expect(() => fireEvent.click(confirmBtn)).not.toThrow();
    });
  });

  describe('输入框交互', () => {
    it('手机号输入框应该支持实时输入', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const input = screen.getByPlaceholderText('请输入新手机号') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '138' } });
      expect(input.value).toBe('138');
      
      fireEvent.change(input, { target: { value: '13812345678' } });
      expect(input.value).toBe('13812345678');
    });

    it('密码输入框应该隐藏输入内容', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const input = screen.getByPlaceholderText('请输入登录密码');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('手机号输入框应该有focus效果', () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const input = screen.getByPlaceholderText('请输入新手机号');
      fireEvent.focus(input);
      // CSS focus效果通过:focus伪类实现
    });
  });

  describe('错误信息显示', () => {
    it('错误信息应该以红色字体显示', async () => {
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} />);
      
      const input = screen.getByPlaceholderText('请输入新手机号');
      fireEvent.change(input, { target: { value: '123' } });

      await waitFor(() => {
        const errorMessage = screen.getByText('您输入的手机号码不是有效的格式！');
        expect(errorMessage).toHaveClass('error-message');
        expect(errorMessage).toHaveStyle({ color: '#f5222d' });
      });
    });

    it('多个错误信息应该同时显示', () => {
      const mockOnSubmit = vi.fn();
      render(<PhoneVerificationPanel originalPhone={mockOriginalPhone} onSubmit={mockOnSubmit} />);
      
      // 不输入任何内容直接点击确认
      const confirmBtn = screen.getByText('确认');
      fireEvent.click(confirmBtn);

      // 应该同时显示手机号和密码的错误信息
      expect(screen.getByText('请输入手机号')).toBeInTheDocument();
      expect(screen.getByText('输入登录密码！')).toBeInTheDocument();
    });
  });
});

