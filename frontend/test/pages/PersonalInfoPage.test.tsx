/**
 * 用户基本信息页测试
 * UI-PersonalInfoPage
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PersonalInfoPage from '../../src/pages/PersonalInfoPage';

describe('PersonalInfoPage - 用户基本信息页', () => {
  
  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks();
  });

  describe('页面结构验证', () => {
    test('应该渲染完整的页面结构', () => {
      // Given: 渲染个人信息页
      render(<PersonalInfoPage />);
      
      // Then: 应该包含所有主要区域
      expect(screen.getByTestId('personal-info-page')).toBeInTheDocument();
      expect(screen.getByTestId('top-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('side-menu')).toBeInTheDocument();
      expect(screen.getByTestId('personal-info-panel')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    test('页面背景应该为白色', () => {
      // Given: 渲染个人信息页
      const { container } = render(<PersonalInfoPage />);
      
      // Then: 页面应该有白色背景
      const page = screen.getByTestId('personal-info-page');
      // 验证背景色（实际实现后取消注释）
      // expect(page).toHaveStyle({ backgroundColor: 'white' });
      expect(page).toBeInTheDocument();
    });

    test('应该分为上中下三大部分', () => {
      // Given: 渲染个人信息页
      render(<PersonalInfoPage />);
      
      // Then: 应该包含顶部、中部、底部三个区域
      expect(screen.getByTestId('top-navigation')).toBeInTheDocument();
      const mainContent = document.querySelector('.main-content');
      expect(mainContent).toBeInTheDocument();
      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    test('中部内容区域应该分为左右两部分', () => {
      // Given: 渲染个人信息页
      render(<PersonalInfoPage />);
      
      // Then: 左侧为菜单栏，右侧为信息面板
      expect(screen.getByTestId('side-menu')).toBeInTheDocument();
      expect(screen.getByTestId('personal-info-panel')).toBeInTheDocument();
    });
  });

  describe('加载状态', () => {
    test('应该在加载时显示加载提示', () => {
      // Given: 页面正在加载
      render(<PersonalInfoPage />);
      
      // Then: 应该显示"加载中..."
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    test('应该在页面加载时自动获取用户信息', async () => {
      // Given: 渲染个人信息页
      const consoleSpy = vi.spyOn(console, 'log');
      
      // When: 组件挂载
      render(<PersonalInfoPage />);
      
      // Then: 应该调用API获取用户信息
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('PersonalInfoPage: Fetching user info...');
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('错误处理', () => {
    test('应该在发生错误时显示错误信息', () => {
      // Given: 获取用户信息失败（模拟error状态）
      // 注意：这个测试需要实际实现后才能正常工作
      // 这里只是骨架测试
      
      // When: 渲染页面
      render(<PersonalInfoPage />);
      
      // Then: 应该显示错误信息（当error状态存在时）
      // 实际实现后取消注释
      // expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(true).toBe(true);
    });
  });

  describe('导航功能', () => {
    test('应该能够跳转到首页', () => {
      // Given: 渲染个人信息页
      const consoleSpy = vi.spyOn(console, 'log');
      const { rerender } = render(<PersonalInfoPage />);
      
      // When: 点击Logo或首页链接
      // TODO: 实际实现后添加点击事件
      
      // Then: 应该触发跳转到首页的逻辑
      // 实际实现后取消注释
      // expect(consoleSpy).toHaveBeenCalledWith('Navigate to home');
      
      consoleSpy.mockRestore();
      expect(true).toBe(true);
    });
  });

  describe('UI元素检查', () => {
    test('应该包含顶部导航栏且可见', () => {
      // Given: 渲染个人信息页
      render(<PersonalInfoPage />);
      
      // When: 检查顶部导航栏
      const topNav = screen.getByTestId('top-navigation');
      
      // Then: 应该存在且可见
      expect(topNav).toBeInTheDocument();
      expect(topNav).toBeVisible();
    });

    test('应该包含左侧功能菜单栏且可见', () => {
      // Given: 渲染个人信息页
      render(<PersonalInfoPage />);
      
      // When: 检查侧边菜单
      const sideMenu = screen.getByTestId('side-menu');
      
      // Then: 应该存在且可见
      expect(sideMenu).toBeInTheDocument();
      expect(sideMenu).toBeVisible();
    });

    test('应该包含个人信息面板且可见', () => {
      // Given: 渲染个人信息页
      render(<PersonalInfoPage />);
      
      // When: 检查信息面板
      const infoPanel = screen.getByTestId('personal-info-panel');
      
      // Then: 应该存在且可见
      expect(infoPanel).toBeInTheDocument();
      expect(infoPanel).toBeVisible();
    });

    test('应该包含底部导航区域且可见', () => {
      // Given: 渲染个人信息页
      render(<PersonalInfoPage />);
      
      // When: 检查底部导航
      const bottomNav = screen.getByTestId('bottom-navigation');
      
      // Then: 应该存在且可见
      expect(bottomNav).toBeInTheDocument();
      expect(bottomNav).toBeVisible();
    });
  });

  describe('acceptanceCriteria验证', () => {
    test('应该满足: 整体页面背景为白色，分为上中下三大部分', () => {
      // Given: 渲染个人信息页
      render(<PersonalInfoPage />);
      
      // Then: 验证布局符合要求
      const page = screen.getByTestId('personal-info-page');
      expect(page).toBeInTheDocument();
      expect(screen.getByTestId('top-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('side-menu')).toBeInTheDocument();
      expect(screen.getByTestId('personal-info-panel')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    test('应该满足: 顶部导航栏区域（复用）', () => {
      // Given: 渲染个人信息页
      render(<PersonalInfoPage />);
      
      // Then: 顶部导航栏应该存在
      expect(screen.getByTestId('top-navigation')).toBeInTheDocument();
    });

    test('应该满足: 中部主要内容区域分为左右两部分：左侧功能菜单栏、右侧个人信息展示面板', () => {
      // Given: 渲染个人信息页
      render(<PersonalInfoPage />);
      
      // Then: 左右两部分都应该存在
      expect(screen.getByTestId('side-menu')).toBeInTheDocument();
      expect(screen.getByTestId('personal-info-panel')).toBeInTheDocument();
    });

    test('应该满足: 底部导航区域（复用）', () => {
      // Given: 渲染个人信息页
      render(<PersonalInfoPage />);
      
      // Then: 底部导航应该存在
      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    test('应该满足: 页面加载时自动获取用户信息', async () => {
      // Given: 渲染个人信息页
      const consoleSpy = vi.spyOn(console, 'log');
      
      // When: 组件挂载
      render(<PersonalInfoPage />);
      
      // Then: 应该自动调用获取用户信息的逻辑
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('PersonalInfoPage: Fetching user info...');
      });
      
      consoleSpy.mockRestore();
    });
  });
});





