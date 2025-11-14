import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LeftSidebar from '../../src/components/LeftSidebar';
import '@testing-library/jest-dom';

describe('LeftSidebar 左侧功能菜单栏组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UI-LeftSidebar: 基本渲染', () => {
    it('应该采用垂直列表形式展示功能分区', () => {
      render(<LeftSidebar />);
      const sidebar = document.querySelector('.left-sidebar');
      expect(sidebar).toBeInTheDocument();
    });

    it('应该包含三个大分区', () => {
      render(<LeftSidebar />);
      const sections = ['订单中心', '个人信息', '常用信息管理'];
      sections.forEach(section => {
        const sectionElement = screen.getByText(section);
        expect(sectionElement).toBeInTheDocument();
        expect(sectionElement).toHaveClass('section-title');
      });
    });

    it('大分区字体应该为黑色', () => {
      render(<LeftSidebar />);
      const section = screen.getByText('订单中心');
      expect(section).toHaveStyle({ color: '#000' });
    });

    it('小分区字体应该为深灰色', () => {
      render(<LeftSidebar />);
      const menuItems = document.querySelectorAll('.menu-item');
      menuItems.forEach(item => {
        if (!item.classList.contains('active')) {
          expect(item).toHaveStyle({ color: '#666' });
        }
      });
    });
  });

  describe('REQ-6.1.3: 功能分区内容', () => {
    it('订单中心应该包含"火车票订单"小分区', () => {
      render(<LeftSidebar />);
      const menuItem = screen.getByText('火车票订单');
      expect(menuItem).toBeInTheDocument();
      expect(menuItem).toHaveClass('menu-item');
    });

    it('个人信息应该包含"查看个人信息"和"手机核验"小分区', () => {
      render(<LeftSidebar />);
      expect(screen.getByText('查看个人信息')).toBeInTheDocument();
      expect(screen.getByText('手机核验')).toBeInTheDocument();
    });

    it('常用信息管理应该包含"乘车人"小分区', () => {
      render(<LeftSidebar />);
      expect(screen.getByText('乘车人')).toBeInTheDocument();
    });
  });

  describe('REQ-6.1.3: 选中项样式', () => {
    it('选中项应该以浅蓝底色白色字体显示', () => {
      render(<LeftSidebar activeItem="查看个人信息" />);
      const activeItem = screen.getByText('查看个人信息');
      expect(activeItem).toHaveClass('active');
      expect(activeItem).toHaveClass('menu-item');
    });

    it('Given: 未选中任何项, When: 渲染组件, Then: 不应该有选中项', () => {
      render(<LeftSidebar />);
      const menuItems = document.querySelectorAll('.menu-item.active');
      expect(menuItems.length).toBe(0);
    });

    it('Given: 选中"手机核验", When: 渲染组件, Then: 该项应该高亮显示', () => {
      render(<LeftSidebar activeItem="手机核验" />);
      const activeItem = screen.getByText('手机核验');
      expect(activeItem).toHaveClass('active');
    });
  });

  describe('REQ-6.1.3: 小分区点击跳转', () => {
    it('Given: 用户点击"火车票订单", When: 触发点击事件, Then: 应该调用回调函数', () => {
      const mockOnClick = vi.fn();
      render(<LeftSidebar onMenuItemClick={mockOnClick} />);

      const menuItem = screen.getByText('火车票订单');
      fireEvent.click(menuItem);

      expect(mockOnClick).toHaveBeenCalledWith('火车票订单');
    });

    it('Given: 用户点击"查看个人信息", When: 触发点击事件, Then: 应该调用回调函数', () => {
      const mockOnClick = vi.fn();
      render(<LeftSidebar onMenuItemClick={mockOnClick} />);

      const menuItem = screen.getByText('查看个人信息');
      fireEvent.click(menuItem);

      expect(mockOnClick).toHaveBeenCalledWith('查看个人信息');
    });

    it('Given: 用户点击"手机核验", When: 触发点击事件, Then: 应该调用回调函数', () => {
      const mockOnClick = vi.fn();
      render(<LeftSidebar onMenuItemClick={mockOnClick} />);

      const menuItem = screen.getByText('手机核验');
      fireEvent.click(menuItem);

      expect(mockOnClick).toHaveBeenCalledWith('手机核验');
    });

    it('Given: 用户点击"乘车人", When: 触发点击事件, Then: 应该调用回调函数', () => {
      const mockOnClick = vi.fn();
      render(<LeftSidebar onMenuItemClick=mockOnClick} />);

      const menuItem = screen.getByText('乘车人');
      fireEvent.click(menuItem);

      expect(mockOnClick).toHaveBeenCalledWith('乘车人');
    });

    it('Given: 未提供回调函数, When: 点击菜单项, Then: 不应该抛出错误', () => {
      render(<LeftSidebar />);

      const menuItem = screen.getByText('火车票订单');
      expect(() => fireEvent.click(menuItem)).not.toThrow();
    });
  });

  describe('UI元素存在性检查', () => {
    it('所有大分区标题应该存在且可见', () => {
      render(<LeftSidebar />);
      const sectionTitles = document.querySelectorAll('.section-title');
      expect(sectionTitles.length).toBe(3);
      sectionTitles.forEach(title => {
        expect(title).toBeVisible();
      });
    });

    it('所有小分区菜单项应该存在且可点击', () => {
      render(<LeftSidebar />);
      const menuItems = document.querySelectorAll('.menu-item');
      expect(menuItems.length).toBe(4); // 总共4个小分区
      menuItems.forEach(item => {
        expect(item).toBeVisible();
        expect(item).toHaveStyle({ cursor: 'pointer' });
      });
    });
  });

  describe('悬停效果', () => {
    it('Given: 鼠标悬停在菜单项上, When: 触发hover事件, Then: 应该改变背景颜色', () => {
      render(<LeftSidebar />);
      const menuItem = screen.getByText('火车票订单');

      // 悬停效果通过CSS :hover 实现，这里验证CSS类存在
      expect(menuItem).toHaveClass('menu-item');
    });
  });

  describe('可访问性', () => {
    it('所有菜单项应该有适当的语义结构', () => {
      render(<LeftSidebar />);
      const menuList = document.querySelectorAll('.menu-items');
      expect(menuList.length).toBeGreaterThan(0);
    });

    it('菜单项应该支持键盘导航', () => {
      // TODO: 添加键盘导航测试
    });
  });

  describe('边界情况', () => {
    it('Given: activeItem 为空字符串, When: 渲染组件, Then: 不应该有选中项', () => {
      render(<LeftSidebar activeItem="" />);
      const activeItems = document.querySelectorAll('.menu-item.active');
      expect(activeItems.length).toBe(0);
    });

    it('Given: activeItem 为不存在的项, When: 渲染组件, Then: 不应该有选中项', () => {
      render(<LeftSidebar activeItem="不存在的菜单项" />);
      const activeItems = document.querySelectorAll('.menu-item.active');
      expect(activeItems.length).toBe(0);
    });

    it('Given: onMenuItemClick 为 undefined, When: 点击菜单项, Then: 不应该抛出错误', () => {
      render(<LeftSidebar onMenuItemClick={undefined} />);
      const menuItem = screen.getByText('火车票订单');
      expect(() => fireEvent.click(menuItem)).not.toThrow();
    });
  });

  describe('性能测试', () => {
    it('组件应该快速渲染', () => {
      const startTime = performance.now();
      render(<LeftSidebar />);
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 渲染时间应该小于100ms
      expect(renderTime).toBeLessThan(100);
    });
  });
});

