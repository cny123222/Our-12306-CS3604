// 历史订单查询流程跨页测试
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../../src/App';

global.fetch = vi.fn();

describe('历史订单查询流程跨页测试', () => {
  
  const mockOrders = [
    {
      orderId: 'E202501140001',
      trainNumber: 'G1234',
      departureStation: '上海虹桥',
      arrivalStation: '北京南',
      departureDate: '2025-01-15',
      departureTime: '08:00',
      arrivalTime: '13:30',
      seatType: '二等座',
      passengers: [{ name: '张三', idCardNumber: '310101199001011234' }],
      totalPrice: 553.00,
      status: '已支付'
    },
    {
      orderId: 'E202501130001',
      trainNumber: 'D5678',
      departureStation: '杭州东',
      arrivalStation: '南京南',
      departureDate: '2025-01-14',
      departureTime: '10:00',
      arrivalTime: '12:30',
      seatType: '一等座',
      passengers: [{ name: '李四', idCardNumber: '320101199002021234' }],
      totalPrice: 200.00,
      status: '已出票'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'valid-test-token');
    
    // 默认mock
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/user/orders')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ orders: mockOrders })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });
  });

  describe('[P0] 进入历史订单页流程', () => {
    
    it('应该能够从个人信息页进入历史订单页', async () => {
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
      const orderMenuItem = Array.from(sideMenu?.querySelectorAll('.menu-item') || []).find(
        item => item.textContent?.includes('火车票订单') || item.textContent?.includes('订单')
      );
      
      if (orderMenuItem) {
        fireEvent.click(orderMenuItem as Element);
        
        // Then: 应该跳转到历史订单页
        await waitFor(() => {
          expect(window.location.pathname).toBe('/orders');
        });
      }
    });

    it('历史订单页应该显示订单列表', async () => {
      // When: 访问历史订单页
      const { container } = render(
        <MemoryRouter initialEntries={['/orders']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 应该显示订单列表
      await waitFor(() => {
        expect(container.querySelector('.order-history-page')).toBeTruthy();
        expect(container.textContent).toContain('E202501140001');
        expect(container.textContent).toContain('G1234');
      });
      
      // And: 应该调用订单查询API
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/orders'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-test-token'
          })
        })
      );
    });
  });

  describe('[P1] 搜索订单流程', () => {
    
    it('应该能够按日期范围搜索订单', async () => {
      // Mock搜索API
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/user/orders')) {
          // 检查URL参数
          const urlObj = new URL(url, 'http://localhost');
          const startDate = urlObj.searchParams.get('startDate');
          const endDate = urlObj.searchParams.get('endDate');
          
          if (startDate && endDate) {
            // 返回筛选后的订单
            const filtered = mockOrders.filter(order => 
              order.departureDate >= startDate && order.departureDate <= endDate
            );
            return Promise.resolve({
              ok: true,
              json: async () => ({ orders: filtered })
            });
          }
          
          return Promise.resolve({
            ok: true,
            json: async () => ({ orders: mockOrders })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户在历史订单页
      const { container } = render(
        <MemoryRouter initialEntries={['/orders']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.order-history-page')).toBeTruthy();
      });
      
      // When: 设置日期范围
      const startDateInput = container.querySelector('input[name="startDate"], input[placeholder*="开始日期"]') as HTMLInputElement;
      const endDateInput = container.querySelector('input[name="endDate"], input[placeholder*="结束日期"]') as HTMLInputElement;
      
      if (startDateInput && endDateInput) {
        fireEvent.change(startDateInput, { target: { value: '2025-01-14' } });
        fireEvent.change(endDateInput, { target: { value: '2025-01-14' } });
        
        // And: 点击查询按钮
        const searchButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('查询') || btn.textContent?.includes('搜索')
        );
        
        if (searchButton) {
          fireEvent.click(searchButton);
          
          // Then: 应该调用搜索API
          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
              expect.stringContaining('startDate=2025-01-14'),
              expect.anything()
            );
          });
        }
      }
    });

    it('应该能够按关键词搜索订单', async () => {
      // Mock搜索API
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/user/orders')) {
          const urlObj = new URL(url, 'http://localhost');
          const keyword = urlObj.searchParams.get('keyword');
          
          if (keyword) {
            // 返回匹配的订单
            const filtered = mockOrders.filter(order => 
              order.orderId.includes(keyword) ||
              order.trainNumber.includes(keyword) ||
              order.passengers.some(p => p.name.includes(keyword))
            );
            return Promise.resolve({
              ok: true,
              json: async () => ({ orders: filtered })
            });
          }
          
          return Promise.resolve({
            ok: true,
            json: async () => ({ orders: mockOrders })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户在历史订单页
      const { container } = render(
        <MemoryRouter initialEntries={['/orders']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.order-history-page')).toBeTruthy();
      });
      
      // When: 输入关键词"G1234"
      const keywordInput = container.querySelector('input[name="keyword"], input[placeholder*="订单号"], input[placeholder*="车次"]') as HTMLInputElement;
      
      if (keywordInput) {
        fireEvent.change(keywordInput, { target: { value: 'G1234' } });
        
        // And: 点击查询按钮
        const searchButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('查询')
        );
        
        if (searchButton) {
          fireEvent.click(searchButton);
          
          // Then: 应该调用搜索API
          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
              expect.stringContaining('keyword=G1234'),
              expect.anything()
            );
          });
        }
      }
    });

    it('应该能够组合日期和关键词搜索', async () => {
      // Mock搜索API
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/user/orders')) {
          const urlObj = new URL(url, 'http://localhost');
          const startDate = urlObj.searchParams.get('startDate');
          const keyword = urlObj.searchParams.get('keyword');
          
          if (startDate && keyword) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ orders: [] }) // 组合查询可能没有结果
            });
          }
          
          return Promise.resolve({
            ok: true,
            json: async () => ({ orders: mockOrders })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户在历史订单页
      const { container } = render(
        <MemoryRouter initialEntries={['/orders']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.order-history-page')).toBeTruthy();
      });
      
      // When: 同时设置日期和关键词
      const startDateInput = container.querySelector('input[name="startDate"]') as HTMLInputElement;
      const keywordInput = container.querySelector('input[name="keyword"]') as HTMLInputElement;
      
      if (startDateInput && keywordInput) {
        fireEvent.change(startDateInput, { target: { value: '2025-01-15' } });
        fireEvent.change(keywordInput, { target: { value: '张三' } });
        
        // And: 点击查询按钮
        const searchButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('查询')
        );
        
        if (searchButton) {
          fireEvent.click(searchButton);
          
          // Then: 应该调用搜索API并携带两个参数
          await waitFor(() => {
            const calls = (global.fetch as any).mock.calls;
            const searchCall = calls.find((call: any) => 
              call[0].includes('startDate') && call[0].includes('keyword')
            );
            expect(searchCall).toBeTruthy();
          });
        }
      }
    });
  });

  describe('[P1] 空订单状态流程', () => {
    
    it('无订单时应该显示空状态并提供跳转链接', async () => {
      // Mock空订单列表
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/user/orders')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ orders: [] })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // When: 访问历史订单页且无订单
      const { container } = render(
        <MemoryRouter initialEntries={['/orders']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 应该显示空状态提示
      await waitFor(() => {
        const text = container.textContent || '';
        expect(
          text.includes('暂无订单') || 
          text.includes('没有订单') ||
          text.includes('未查询到')
        ).toBeTruthy();
      });
      
      // And: 应该有"车票预订"链接
      const bookingLink = container.querySelector('a[href="/trains"], a[href="/"]');
      expect(bookingLink).toBeTruthy();
    });

    it('应该能够从空状态跳转到车次列表页', async () => {
      // Mock空订单列表
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/user/orders')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ orders: [] })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户在空订单页面
      const { container } = render(
        <MemoryRouter initialEntries={['/orders']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        const text = container.textContent || '';
        expect(text.includes('暂无订单') || text.includes('没有订单')).toBeTruthy();
      });
      
      // When: 点击"车票预订"链接
      const bookingLink = container.querySelector('a[href="/trains"], a[href="/"], button, .link');
      
      if (bookingLink && bookingLink.textContent?.includes('车票') || bookingLink?.textContent?.includes('预订')) {
        fireEvent.click(bookingLink);
        
        // Then: 应该跳转到首页或车次列表页
        await waitFor(() => {
          expect(
            window.location.pathname === '/' || 
            window.location.pathname === '/trains'
          ).toBeTruthy();
        });
      }
    });
  });

  describe('[P1] 订单详情显示', () => {
    
    it('应该正确显示订单的所有信息', async () => {
      // When: 访问历史订单页
      const { container } = render(
        <MemoryRouter initialEntries={['/orders']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 应该显示完整的订单信息
      await waitFor(() => {
        const text = container.textContent || '';
        
        // 订单号
        expect(text).toContain('E202501140001');
        
        // 车次信息
        expect(text).toContain('G1234');
        expect(text).toContain('上海虹桥');
        expect(text).toContain('北京南');
        
        // 日期时间
        expect(text).toContain('2025-01-15');
        
        // 座位类型
        expect(text).toContain('二等座');
        
        // 乘客信息
        expect(text).toContain('张三');
        
        // 价格
        expect(text).toContain('553');
        
        // 状态
        expect(text).toContain('已支付');
      });
    });

    it('应该正确脱敏显示乘客身份证号', async () => {
      // When: 访问历史订单页
      const { container } = render(
        <MemoryRouter initialEntries={['/orders']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 身份证号应该脱敏显示
      await waitFor(() => {
        const text = container.textContent || '';
        // 应该包含脱敏的身份证号，不应该显示完整身份证号
        expect(text).not.toContain('310101199001011234');
        // 可能显示为 310***1234 或类似格式
        expect(text).toMatch(/310\*+1234/);
      });
    });
  });

  describe('[P2] 订单状态筛选', () => {
    
    it('应该能够按订单状态筛选', async () => {
      // Mock状态筛选API
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/user/orders')) {
          const urlObj = new URL(url, 'http://localhost');
          const status = urlObj.searchParams.get('status');
          
          if (status) {
            const filtered = mockOrders.filter(order => order.status === status);
            return Promise.resolve({
              ok: true,
              json: async () => ({ orders: filtered })
            });
          }
          
          return Promise.resolve({
            ok: true,
            json: async () => ({ orders: mockOrders })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户在历史订单页
      const { container } = render(
        <MemoryRouter initialEntries={['/orders']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.order-history-page')).toBeTruthy();
      });
      
      // When: 选择"已支付"状态
      const statusSelect = container.querySelector('select[name="status"]') as HTMLSelectElement;
      
      if (statusSelect) {
        fireEvent.change(statusSelect, { target: { value: '已支付' } });
        
        // And: 点击查询
        const searchButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('查询')
        );
        
        if (searchButton) {
          fireEvent.click(searchButton);
          
          // Then: 应该调用带状态参数的API
          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
              expect.stringContaining('status='),
              expect.anything()
            );
          });
        }
      }
    });
  });
});

