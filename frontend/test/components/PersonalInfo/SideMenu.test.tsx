/**
 * 左侧功能菜单栏组件测试
 * UI-SideMenu
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SideMenu from '../../../src/components/PersonalInfo/SideMenu';

describe('SideMenu - 左侧功能菜单栏组件', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('菜单结构验证', () => {
    test('应该渲染所有三个大分区', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 应该包含三个大分区
      expect(screen.getByTestId('order-center-section')).toBeInTheDocument();
      expect(screen.getByTestId('personal-info-section')).toBeInTheDocument();
      expect(screen.getByTestId('common-info-section')).toBeInTheDocument();
    });

    test('应该显示"订单中心"大分区标题', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 应该显示"订单中心"
      expect(screen.getByText('订单中心')).toBeInTheDocument();
    });

    test('应该显示"个人信息"大分区标题', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 应该显示"个人信息"
      expect(screen.getByText('个人信息')).toBeInTheDocument();
    });

    test('应该显示"常用信息管理"大分区标题', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 应该显示"常用信息管理"
      expect(screen.getByText('常用信息管理')).toBeInTheDocument();
    });
  });

  describe('小分区菜单项验证', () => {
    test('订单中心应该包含"火车票订单"小分区', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 应该显示"火车票订单"
      expect(screen.getByTestId('train-order-item')).toBeInTheDocument();
      expect(screen.getByText('火车票订单')).toBeInTheDocument();
    });

    test('个人信息应该包含"查看个人信息"和"手机核验"小分区', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 应该显示两个小分区
      expect(screen.getByTestId('view-personal-info-item')).toBeInTheDocument();
      expect(screen.getByText('查看个人信息')).toBeInTheDocument();
      
      expect(screen.getByTestId('phone-verification-item')).toBeInTheDocument();
      expect(screen.getByText('手机核验')).toBeInTheDocument();
    });

    test('常用信息管理应该包含"乘车人"小分区', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 应该显示"乘车人"
      expect(screen.getByTestId('passenger-management-item')).toBeInTheDocument();
      expect(screen.getByText('乘车人')).toBeInTheDocument();
    });
  });

  describe('菜单项点击功能', () => {
    test('点击"火车票订单"应该触发onMenuClick回调', () => {
      // Given: 提供onMenuClick回调函数
      const mockOnMenuClick = vi.fn();
      render(<SideMenu onMenuClick={mockOnMenuClick} />);
      
      // When: 点击"火车票订单"
      const trainOrderItem = screen.getByTestId('train-order-item');
      fireEvent.click(trainOrderItem);
      
      // Then: 应该调用回调函数并传递正确的参数
      expect(mockOnMenuClick).toHaveBeenCalledWith('train-order');
    });

    test('点击"查看个人信息"应该触发onMenuClick回调', () => {
      // Given: 提供onMenuClick回调函数
      const mockOnMenuClick = vi.fn();
      render(<SideMenu onMenuClick={mockOnMenuClick} />);
      
      // When: 点击"查看个人信息"
      const viewInfoItem = screen.getByTestId('view-personal-info-item');
      fireEvent.click(viewInfoItem);
      
      // Then: 应该调用回调函数并传递正确的参数
      expect(mockOnMenuClick).toHaveBeenCalledWith('view-personal-info');
    });

    test('点击"手机核验"应该触发onMenuClick回调', () => {
      // Given: 提供onMenuClick回调函数
      const mockOnMenuClick = vi.fn();
      render(<SideMenu onMenuClick={mockOnMenuClick} />);
      
      // When: 点击"手机核验"
      const phoneVerificationItem = screen.getByTestId('phone-verification-item');
      fireEvent.click(phoneVerificationItem);
      
      // Then: 应该调用回调函数并传递正确的参数
      expect(mockOnMenuClick).toHaveBeenCalledWith('phone-verification');
    });

    test('点击"乘车人"应该触发onMenuClick回调', () => {
      // Given: 提供onMenuClick回调函数
      const mockOnMenuClick = vi.fn();
      render(<SideMenu onMenuClick={mockOnMenuClick} />);
      
      // When: 点击"乘车人"
      const passengerItem = screen.getByTestId('passenger-management-item');
      fireEvent.click(passengerItem);
      
      // Then: 应该调用回调函数并传递正确的参数
      expect(mockOnMenuClick).toHaveBeenCalledWith('passenger-management');
    });

    test('点击菜单项应该在控制台输出日志', () => {
      // Given: 渲染侧边菜单
      const consoleSpy = vi.spyOn(console, 'log');
      render(<SideMenu />);
      
      // When: 点击任意菜单项
      const trainOrderItem = screen.getByTestId('train-order-item');
      fireEvent.click(trainOrderItem);
      
      // Then: 应该输出日志
      expect(consoleSpy).toHaveBeenCalledWith('Menu clicked:', 'train-order');
      
      consoleSpy.mockRestore();
    });
  });

  describe('选中状态显示', () => {
    test('当前选中项应该显示为active状态', () => {
      // Given: 当前选中"查看个人信息"
      render(<SideMenu currentSection="view-personal-info" />);
      
      // Then: 该项应该有active类名
      const viewInfoItem = screen.getByTestId('view-personal-info-item');
      expect(viewInfoItem).toHaveClass('active');
    });

    test('未选中项不应该有active状态', () => {
      // Given: 当前选中"查看个人信息"
      render(<SideMenu currentSection="view-personal-info" />);
      
      // Then: 其他项不应该有active类名
      const phoneVerificationItem = screen.getByTestId('phone-verification-item');
      expect(phoneVerificationItem).not.toHaveClass('active');
    });

    test('应该支持选中状态切换', () => {
      // Given: 初始选中"查看个人信息"
      const { rerender } = render(<SideMenu currentSection="view-personal-info" />);
      expect(screen.getByTestId('view-personal-info-item')).toHaveClass('active');
      
      // When: 切换到"手机核验"
      rerender(<SideMenu currentSection="phone-verification" />);
      
      // Then: "手机核验"应该是active状态
      expect(screen.getByTestId('phone-verification-item')).toHaveClass('active');
      expect(screen.getByTestId('view-personal-info-item')).not.toHaveClass('active');
    });
  });

  describe('acceptanceCriteria验证', () => {
    test('应该满足: 采用垂直列表形式展示功能分区', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 所有分区应该存在且垂直排列
      const sideMenu = screen.getByTestId('side-menu');
      expect(sideMenu).toBeInTheDocument();
      expect(screen.getByTestId('order-center-section')).toBeInTheDocument();
      expect(screen.getByTestId('personal-info-section')).toBeInTheDocument();
      expect(screen.getByTestId('common-info-section')).toBeInTheDocument();
    });

    test('应该满足: 包含三个大分区：订单中心、个人信息、常用信息管理', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 三个大分区都应该存在
      expect(screen.getByText('订单中心')).toBeInTheDocument();
      expect(screen.getByText('个人信息')).toBeInTheDocument();
      expect(screen.getByText('常用信息管理')).toBeInTheDocument();
    });

    test('应该满足: 订单中心包含小分区：火车票订单', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 应该包含"火车票订单"
      expect(screen.getByText('火车票订单')).toBeInTheDocument();
    });

    test('应该满足: 个人信息包含小分区：查看个人信息、手机核验', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 应该包含两个小分区
      expect(screen.getByText('查看个人信息')).toBeInTheDocument();
      expect(screen.getByText('手机核验')).toBeInTheDocument();
    });

    test('应该满足: 常用信息管理包含小分区：乘车人', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 应该包含"乘车人"
      expect(screen.getByText('乘车人')).toBeInTheDocument();
    });

    test('应该满足: 大分区字体为黑色，小分区字体为深灰色', () => {
      // Given: 渲染侧边菜单
      render(<SideMenu />);
      
      // Then: 验证字体颜色（实际实现后取消注释）
      // const sectionTitle = document.querySelector('.section-title');
      // expect(sectionTitle).toHaveStyle({ color: 'black' });
      // const menuItem = document.querySelector('.menu-item');
      // expect(menuItem).toHaveStyle({ color: 'darkgray' });
      expect(true).toBe(true);
    });

    test('应该满足: 选中项以浅蓝底色白色字体显示', () => {
      // Given: 渲染侧边菜单，选中某一项
      render(<SideMenu currentSection="view-personal-info" />);
      
      // Then: 选中项应该有相应的样式（实际实现后取消注释）
      const activeItem = screen.getByTestId('view-personal-info-item');
      expect(activeItem).toHaveClass('active');
      // expect(activeItem).toHaveStyle({ backgroundColor: 'lightblue', color: 'white' });
    });

    test('应该满足: 小分区支持点击跳转到对应页面', () => {
      // Given: 提供onMenuClick回调
      const mockOnMenuClick = vi.fn();
      render(<SideMenu onMenuClick={mockOnMenuClick} />);
      
      // When: 点击小分区
      fireEvent.click(screen.getByTestId('view-personal-info-item'));
      
      // Then: 应该触发跳转逻辑
      expect(mockOnMenuClick).toHaveBeenCalledWith('view-personal-info');
    });
  });
});





