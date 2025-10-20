import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import LoginForm from '../../src/components/LoginForm';

describe('LoginForm', () => {
  let mockOnSubmit: any;
  let mockOnNavigateToRegister: any;
  let mockOnNavigateToForgotPassword: any;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
    mockOnNavigateToRegister = vi.fn();
    mockOnNavigateToForgotPassword = vi.fn();
  });

  it('should render login form correctly', () => {
    // 验收标准：渲染登录表单
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onNavigateToForgotPassword={mockOnNavigateToForgotPassword}
      />
    );
    
    // 验证组件正确渲染
    expect(screen.getByText('账号登录')).toBeInTheDocument();
    expect(screen.getByText('立即登录')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('用户名/邮箱/手机号')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument();
  });

  it('should render basic form structure', () => {
    // 验收标准：显示基本表单结构
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onNavigateToForgotPassword={mockOnNavigateToForgotPassword}
      />
    );
    
    // 验证基本元素存在
    expect(screen.getByText('账号登录')).toBeInTheDocument();
    expect(screen.getByText('注册12306账户')).toBeInTheDocument();
    expect(screen.getByText('忘记密码？')).toBeInTheDocument();
  });

  it('should handle component props', () => {
    // 验收标准：处理组件属性
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onNavigateToForgotPassword={mockOnNavigateToForgotPassword}
      />
    );
    
    // 验证组件正确渲染
    expect(screen.getByText('账号登录')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '立即登录' })).toBeInTheDocument();
  });


});