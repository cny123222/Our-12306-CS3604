// 个人信息页导航流程跨页测试
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../../src/App';

// Mock fetch
global.fetch = vi.fn();

describe('个人信息页导航流程测试', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // 默认mock用户信息API
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/user/info') {
        return Promise.resolve({
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
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });
  });

  describe('进入个人信息页流程', () => {
    
    it('[P0] 已登录用户应该能够访问个人信息页', async () => {
      // Given: 用户已登录
      localStorage.setItem('token', 'valid-test-token');
      
      // When: 直接访问个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 页面应该正确加载
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
        expect(container.querySelector('.side-menu')).toBeTruthy();
      });
      
      // And: 应该调用用户信息API
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/info',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-test-token'
          })
        })
      );
    });

    it('[P0] 未登录用户访问个人信息页应该被拦截', async () => {
      // Given: 用户未登录
      localStorage.removeItem('token');
      
      // Mock API返回401
      (global.fetch as any).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: '未授权' })
        })
      );
      
      // When: 尝试访问个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 应该显示错误信息或跳转到登录页
      await waitFor(() => {
        const errorElement = container.querySelector('.error-container');
        const loginPage = container.querySelector('.login-page');
        expect(errorElement || loginPage).toBeTruthy();
      });
    });
  });

  describe('侧边菜单导航流程', () => {
    
    beforeEach(() => {
      localStorage.setItem('token', 'valid-test-token');
    });

    it('[P0] 应该能够通过侧边菜单导航到手机核验页', async () => {
      // Given: 用户在个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
      });
      
      // When: 点击侧边菜单的"手机核验"
      const sideMenu = container.querySelector('.side-menu');
      const menuItems = sideMenu?.querySelectorAll('.menu-item');
      const phoneVerificationItem = Array.from(menuItems || []).find(
        item => item.textContent?.includes('手机核验')
      );
      
      if (phoneVerificationItem) {
        fireEvent.click(phoneVerificationItem as Element);
        
        // Then: 应该跳转到手机核验页
        await waitFor(() => {
          expect(window.location.pathname).toBe('/phone-verification');
        });
      }
    });

    it('[P0] 应该能够通过侧边菜单导航到乘客管理页', async () => {
      // Given: 用户在个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
      });
      
      // When: 点击侧边菜单的"乘车人"
      const sideMenu = container.querySelector('.side-menu');
      const menuItems = sideMenu?.querySelectorAll('.menu-item');
      const passengersItem = Array.from(menuItems || []).find(
        item => item.textContent?.includes('乘车人')
      );
      
      if (passengersItem) {
        fireEvent.click(passengersItem as Element);
        
        // Then: 应该跳转到乘客管理页
        await waitFor(() => {
          expect(window.location.pathname).toBe('/passengers');
        });
      }
    });

    it('[P0] 应该能够通过侧边菜单导航到历史订单页', async () => {
      // Given: 用户在个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
      });
      
      // When: 点击侧边菜单的"火车票订单"
      const sideMenu = container.querySelector('.side-menu');
      const menuItems = sideMenu?.querySelectorAll('.menu-item');
      const ordersItem = Array.from(menuItems || []).find(
        item => item.textContent?.includes('火车票订单')
      );
      
      if (ordersItem) {
        fireEvent.click(ordersItem as Element);
        
        // Then: 应该跳转到历史订单页
        await waitFor(() => {
          expect(window.location.pathname).toBe('/orders');
        });
      }
    });

    it('[P1] 侧边菜单应该正确高亮当前页面', async () => {
      // Given: 用户在个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
      });
      
      // Then: "查看个人信息"菜单项应该被选中
      const selectedItem = container.querySelector('.menu-item.selected');
      expect(selectedItem).toBeTruthy();
      expect(selectedItem?.textContent).toContain('查看个人信息');
    });
  });

  describe('面包屑导航验证', () => {
    
    beforeEach(() => {
      localStorage.setItem('token', 'valid-test-token');
    });

    it('[P1] 个人信息页应该显示正确的面包屑导航', async () => {
      // When: 访问个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 面包屑应该显示正确的路径
      await waitFor(() => {
        const breadcrumb = container.querySelector('.breadcrumb-navigation');
        expect(breadcrumb).toBeTruthy();
        expect(breadcrumb?.textContent).toContain('个人中心');
        expect(breadcrumb?.textContent).toContain('个人信息');
        expect(breadcrumb?.textContent).toContain('查看个人信息');
      });
    });

    it('[P1] 手机核验页应该显示正确的面包屑导航', async () => {
      // When: 访问手机核验页
      const { container } = render(
        <MemoryRouter initialEntries={['/phone-verification']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 面包屑应该显示完整路径
      await waitFor(() => {
        const breadcrumb = container.querySelector('.breadcrumb-navigation');
        expect(breadcrumb).toBeTruthy();
        expect(breadcrumb?.textContent).toContain('个人中心');
        expect(breadcrumb?.textContent).toContain('账号安全');
        expect(breadcrumb?.textContent).toContain('手机核验');
      });
    });

    it('[P1] 乘客管理页应该显示正确的面包屑导航', async () => {
      // Mock乘客列表API
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === '/api/passengers') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ passengers: [] })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // When: 访问乘客管理页
      const { container } = render(
        <MemoryRouter initialEntries={['/passengers']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 面包屑应该显示正确路径
      await waitFor(() => {
        const breadcrumb = container.querySelector('.breadcrumb-navigation');
        expect(breadcrumb).toBeTruthy();
        expect(breadcrumb?.textContent).toContain('个人中心');
        expect(breadcrumb?.textContent).toContain('常用信息管理');
        expect(breadcrumb?.textContent).toContain('乘车人');
      });
    });
  });

  describe('Logo返回首页流程', () => {
    
    beforeEach(() => {
      localStorage.setItem('token', 'valid-test-token');
    });

    it('[P1] 点击Logo应该返回首页', async () => {
      // Given: 用户在个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
      });
      
      // When: 点击顶部的Logo
      const topNav = container.querySelector('.top-navigation');
      const logo = topNav?.querySelector('.logo, .logo-link, a[href="/"]');
      
      if (logo) {
        fireEvent.click(logo as Element);
        
        // Then: 应该跳转到首页
        await waitFor(() => {
          expect(window.location.pathname).toBe('/');
        });
      }
    });
  });
});

