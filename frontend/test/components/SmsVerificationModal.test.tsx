import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import SmsVerificationModal from '../../src/components/SmsVerificationModal';

// Mock VerificationCodeInput component to avoid dependency issues
vi.mock('../../src/components/VerificationCodeInput', () => ({
  default: ({ onCodeChange, onGetCode }: any) => (
    <div data-testid="verification-code-input">
      <input 
        placeholder="请输入验证码"
        onChange={(e) => onCodeChange && onCodeChange(e.target.value)}
      />
      <button onClick={() => onGetCode && onGetCode()}>获取验证码</button>
    </div>
  )
}));

describe('SmsVerificationModal', () => {
  let mockOnClose: any;
  let mockOnVerificationSuccess: any;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnVerificationSuccess = vi.fn();
  });

  it('should render modal when isVisible is true', () => {
    // 验收标准：当 isVisible 为 true 时显示模态框
    render(
      <SmsVerificationModal
        isVisible={true}
        sessionToken="test-session-token"
        onClose={mockOnClose}
        onVerificationSuccess={mockOnVerificationSuccess}
      />
    );
    
    expect(screen.getByText(/选择验证方式/i)).toBeInTheDocument();
  });

  it('should not render modal when isVisible is false', () => {
    // 验收标准：当 isVisible 为 false 时不显示模态框
    render(
      <SmsVerificationModal
        isVisible={false}
        sessionToken="test-session-token"
        onClose={mockOnClose}
        onVerificationSuccess={mockOnVerificationSuccess}
      />
    );
    
    expect(screen.queryByText(/选择验证方式/i)).not.toBeInTheDocument();
  });

  it('should display modal structure', () => {
    // 验收标准：显示模态框基本结构
    render(
      <SmsVerificationModal
        isVisible={true}
        sessionToken="test-session-token"
        onClose={mockOnClose}
        onVerificationSuccess={mockOnVerificationSuccess}
      />
    );
    
    // 验证模态框基本元素存在
    expect(screen.getByText(/选择验证方式/i)).toBeInTheDocument();
    expect(screen.getByText(/短信验证/i)).toBeInTheDocument();
  });

  it('should render close button', () => {
    // 验收标准：显示关闭按钮
    render(
      <SmsVerificationModal
        isVisible={true}
        sessionToken="test-session-token"
        onClose={mockOnClose}
        onVerificationSuccess={mockOnVerificationSuccess}
      />
    );
    
    const closeButton = screen.getByText('×');
    expect(closeButton).toBeInTheDocument();
  });

  it('should render verification code input component', () => {
    // 验收标准：显示验证码输入组件
    render(
      <SmsVerificationModal
        isVisible={true}
        sessionToken="test-session-token"
        onClose={mockOnClose}
        onVerificationSuccess={mockOnVerificationSuccess}
      />
    );
    
    expect(screen.getByTestId('verification-code-input')).toBeInTheDocument();
  });
});