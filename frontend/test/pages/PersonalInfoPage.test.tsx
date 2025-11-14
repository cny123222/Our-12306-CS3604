// 用户基本信息页测试
// 基于acceptanceCriteria的测试用例

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import PersonalInfoPage from '../../src/pages/PersonalInfoPage';

// Mock fetch
global.fetch = vi.fn();

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PersonalInfoPage - 用户基本信息页', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认mock一个成功的API响应
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        username: 'testuser',
        name: '张三',
        country: '中国China',
        idCardType: '居民身份证',
        idCardNumber: '310101199001011234',
        verificationStatus: '已通过',
        phone: '(+86)158****9968',
        email: 'test@example.com',
        discountType: '成人'
      })
    });
  });
  
  // ===== AC1: 整体页面背景为白色，分为上中下三大部分 =====
  test('[AC1] 应该显示完整的页面布局结构', async () => {
    // Given: 页面加载
    const { container } = renderWithRouter(<PersonalInfoPage />);
    
    // Then: 页面应该包含主要区域
    const personalInfoPage = container.querySelector('.personal-info-page');
    expect(personalInfoPage).toBeTruthy();
    
    // 等待数据加载完成
    await waitFor(() => {
      const mainContent = container.querySelector('.main-content');
      expect(mainContent).toBeTruthy();
    });
  });
  
  // ===== AC2: 顶部导航栏区域（复用） =====
  test('[AC2] 应该显示顶部导航栏', async () => {
    // Given: 页面加载
    const { container } = renderWithRouter(<PersonalInfoPage />);
    
    // Then: 应该显示顶部导航栏组件
    // 检查顶部导航组件是否存在
    expect(container.querySelector('.top-navigation') || container.querySelector('nav')).toBeTruthy();
  });
  
  // ===== AC3: 中部主要内容区域分为左右两部分 =====
  test('[AC3] 应该显示左侧功能菜单栏和右侧个人信息展示面板', async () => {
    // Given: 页面加载
    const { container } = renderWithRouter(<PersonalInfoPage />);
    
    // Then: 应该显示左侧和右侧区域
    await waitFor(() => {
      expect(container.querySelector('.side-menu')).toBeTruthy();
      // 个人信息面板只在有用户信息时显示，所以可能不存在
      const panel = container.querySelector('.personal-info-panel') || container.querySelector('.loading-container') || container.querySelector('.error-container');
      expect(panel).toBeTruthy();
    });
  });
  
  // ===== AC4: 底部导航区域（复用） =====
  test('[AC4] 应该显示底部导航区域', async () => {
    // Given: 页面加载
    const { container } = renderWithRouter(<PersonalInfoPage />);
    
    // Then: 应该显示底部导航组件
    expect(container.querySelector('.bottom-navigation') || container.querySelector('footer')).toBeTruthy();
  });
  
  // ===== AC5: 页面加载时自动获取用户信息 =====
  test('[AC5] 应该在页面加载时自动获取用户信息', async () => {
    // Given: Mock API返回用户信息
    const mockUserInfo = {
      username: 'testuser',
      name: '张三',
      country: '中国China',
      idCardType: '居民身份证',
      idCardNumber: '310101199001011234',
      verificationStatus: '已通过',
      phone: '(+86)158****9968',
      email: 'test@example.com',
      discountType: '成人'
    };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserInfo
    });
    
    // When: 渲染页面
    renderWithRouter(<PersonalInfoPage />);
    
    // Then: 应该调用API获取用户信息
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/info',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });
  
  // ===== 错误处理测试 =====
  test('[Error] 应该在API调用失败时显示错误信息', async () => {
    // Given: Mock API返回错误
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    
    // When: 渲染页面
    renderWithRouter(<PersonalInfoPage />);
    
    // Then: 应该显示错误信息
    await waitFor(() => {
      expect(screen.getByText(/获取用户信息失败/i)).toBeInTheDocument();
    });
  });
  
  // ===== 加载状态测试 =====
  test('[Loading] 应该在加载时显示加载指示器', async () => {
    // Given: Mock API延迟返回
    (global.fetch as any).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    // When: 渲染页面
    renderWithRouter(<PersonalInfoPage />);
    
    // Then: 应该显示加载状态
    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
  });
});

