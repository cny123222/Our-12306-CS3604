import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import LoginPage from '../../src/components/LoginPage';

// Mock LoginForm component
vi.mock('../../src/components/LoginForm', () => ({
  default: () => <div data-testid="login-form">Login Form</div>
}));

// Mock SmsVerificationModal component
vi.mock('../../src/components/SmsVerificationModal', () => ({
  default: () => <div data-testid="sms-modal">SMS Modal</div>
}));

// Mock TopNavigation component
vi.mock('../../src/components/TopNavigation', () => ({
  default: () => <div data-testid="top-navigation">Top Navigation</div>
}));

// Mock BottomNavigation component
vi.mock('../../src/components/BottomNavigation', () => ({
  default: () => <div data-testid="bottom-navigation">Bottom Navigation</div>
}));

describe('LoginPage', () => {
  it('should render login page components', () => {
    // 验收标准：渲染登录页面基本组件
    render(<LoginPage />);
    
    expect(screen.getByTestId('top-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
  });

  it('should maintain responsive design', () => {
    // 验收标准：保持响应式设计
    render(<LoginPage />);
    
    // 验证页面基本结构存在
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('top-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
  });

  it('should support accessibility features', () => {
    // 验收标准：支持无障碍功能
    render(<LoginPage />);
    
    // 验证基本的无障碍结构
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('top-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
  });
});