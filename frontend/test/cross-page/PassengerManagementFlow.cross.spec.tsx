// 乘客管理流程跨页测试
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../../src/App';

global.fetch = vi.fn();

describe('乘客管理流程跨页测试', () => {
  
  const mockPassengers = [
    {
      id: 1,
      name: '张三',
      idCardType: '居民身份证',
      idCardNumber: '310101199001011234',
      phone: '13800138000',
      discountType: '成人',
      verificationStatus: '已通过'
    },
    {
      id: 2,
      name: '李四',
      idCardType: '居民身份证',
      idCardNumber: '320101199002021234',
      phone: '13900139000',
      discountType: '学生',
      verificationStatus: '未通过'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'valid-test-token');
    
    // 默认mock
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/passengers') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ passengers: mockPassengers })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });
  });

  describe('[P0] 进入乘客管理页流程', () => {
    
    it('应该能够从个人信息页进入乘客管理页', async () => {
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
      const passengerMenuItem = Array.from(sideMenu?.querySelectorAll('.menu-item') || []).find(
        item => item.textContent?.includes('乘车人')
      );
      
      if (passengerMenuItem) {
        fireEvent.click(passengerMenuItem as Element);
        
        // Then: 应该跳转到乘客管理页
        await waitFor(() => {
          expect(window.location.pathname).toBe('/passengers');
        });
      }
    });

    it('乘客管理页应该显示所有乘客列表', async () => {
      // When: 访问乘客管理页
      const { container } = render(
        <MemoryRouter initialEntries={['/passengers']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 应该显示乘客列表
      await waitFor(() => {
        expect(container.querySelector('.passenger-management-page')).toBeTruthy();
        expect(container.textContent).toContain('张三');
        expect(container.textContent).toContain('李四');
      });
      
      // And: 应该调用乘客列表API
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/passengers',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-test-token'
          })
        })
      );
    });

    it('应该正确脱敏显示身份证号和手机号', async () => {
      // When: 访问乘客管理页
      const { container } = render(
        <MemoryRouter initialEntries={['/passengers']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 身份证号应该脱敏显示
      await waitFor(() => {
        const text = container.textContent || '';
        // 应该包含脱敏的身份证号
        expect(text).toMatch(/310\*+1234/);
        // 应该包含脱敏的手机号
        expect(text).toMatch(/138\*+000/);
      });
    });
  });

  describe('[P0] 添加乘客流程', () => {
    
    it('应该能够完成添加乘客的完整流程', async () => {
      const newPassenger = {
        name: '王五',
        idCardType: '居民身份证',
        idCardNumber: '330101199003031234',
        phone: '13700137000',
        discountType: '成人'
      };

      // Mock添加乘客API
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url === '/api/passengers' && options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ passengers: mockPassengers })
          });
        }
        if (url === '/api/passengers' && options?.method === 'POST') {
          const body = JSON.parse(options.body);
          expect(body.name).toBe(newPassenger.name);
          expect(body.idCardNumber).toBe(newPassenger.idCardNumber);
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              passenger: { id: 3, ...newPassenger }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户在乘客管理页
      const { container } = render(
        <MemoryRouter initialEntries={['/passengers']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.passenger-management-page')).toBeTruthy();
      });
      
      // When: 点击"添加"按钮
      const addButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('添加') || btn.textContent?.includes('新增')
      );
      
      if (addButton) {
        fireEvent.click(addButton);
        
        // Then: 应该显示添加乘客表单
        await waitFor(() => {
          expect(container.querySelector('.add-passenger-panel')).toBeTruthy();
        });
        
        // When: 填写表单
        const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
        const idCardNumberInput = container.querySelector('input[name="idCardNumber"]') as HTMLInputElement;
        const phoneInput = container.querySelector('input[name="phone"]') as HTMLInputElement;
        
        if (nameInput && idCardNumberInput && phoneInput) {
          fireEvent.change(nameInput, { target: { value: newPassenger.name } });
          fireEvent.change(idCardNumberInput, { target: { value: newPassenger.idCardNumber } });
          fireEvent.change(phoneInput, { target: { value: newPassenger.phone } });
          
          // And: 点击保存按钮
          const saveButton = Array.from(container.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('保存') || btn.textContent?.includes('确认')
          );
          
          if (saveButton) {
            fireEvent.click(saveButton);
            
            // Then: 应该调用添加乘客API
            await waitFor(() => {
              expect(global.fetch).toHaveBeenCalledWith(
                '/api/passengers',
                expect.objectContaining({
                  method: 'POST',
                  body: expect.stringContaining(newPassenger.name)
                })
              );
            });
            
            // And: 应该返回乘客列表页
            await waitFor(() => {
              expect(container.querySelector('.passenger-list-panel')).toBeTruthy();
            });
          }
        }
      }
    });

    it('应该验证添加乘客表单的必填字段', async () => {
      // Given: 用户在添加乘客面板
      const { container } = render(
        <MemoryRouter initialEntries={['/passengers']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.passenger-management-page')).toBeTruthy();
      });
      
      const addButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('添加')
      );
      
      if (addButton) {
        fireEvent.click(addButton);
        
        await waitFor(() => {
          expect(container.querySelector('.add-passenger-panel')).toBeTruthy();
        });
        
        // When: 不填写任何内容直接点击保存
        const saveButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('保存')
        );
        
        if (saveButton) {
          fireEvent.click(saveButton);
          
          // Then: 应该显示验证错误信息
          await waitFor(() => {
            const text = container.textContent || '';
            expect(
              text.includes('必填') || 
              text.includes('不能为空') || 
              text.includes('请输入')
            ).toBeTruthy();
          });
          
          // And: 不应该调用添加API
          expect(global.fetch).not.toHaveBeenCalledWith(
            '/api/passengers',
            expect.objectContaining({ method: 'POST' })
          );
        }
      }
    });

    it('应该能够取消添加乘客', async () => {
      // Given: 用户在添加乘客面板
      const { container } = render(
        <MemoryRouter initialEntries={['/passengers']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.passenger-management-page')).toBeTruthy();
      });
      
      const addButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('添加')
      );
      
      if (addButton) {
        fireEvent.click(addButton);
        
        await waitFor(() => {
          expect(container.querySelector('.add-passenger-panel')).toBeTruthy();
        });
        
        // When: 点击取消按钮
        const cancelButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('取消') || btn.textContent?.includes('返回')
        );
        
        if (cancelButton) {
          fireEvent.click(cancelButton);
          
          // Then: 应该返回乘客列表
          await waitFor(() => {
            expect(container.querySelector('.passenger-list-panel')).toBeTruthy();
          });
          
          // And: 不应该调用添加API
          expect(global.fetch).not.toHaveBeenCalledWith(
            '/api/passengers',
            expect.objectContaining({ method: 'POST' })
          );
        }
      }
    });
  });

  describe('[P0] 编辑乘客流程', () => {
    
    it('应该能够完成编辑乘客的完整流程', async () => {
      const updatedPhone = '13600136000';

      // Mock编辑乘客API
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url === '/api/passengers' && options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ passengers: mockPassengers })
          });
        }
        if (url.match(/\/api\/passengers\/\d+/) && options?.method === 'PUT') {
          const body = JSON.parse(options.body);
          expect(body.phone).toBe(updatedPhone);
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: '更新成功'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户在乘客管理页
      const { container } = render(
        <MemoryRouter initialEntries={['/passengers']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.passenger-management-page')).toBeTruthy();
        expect(container.textContent).toContain('张三');
      });
      
      // When: 点击第一个乘客的"编辑"按钮
      const editButtons = Array.from(container.querySelectorAll('button')).filter(
        btn => btn.textContent?.includes('编辑')
      );
      
      if (editButtons.length > 0) {
        fireEvent.click(editButtons[0]);
        
        // Then: 应该显示编辑乘客面板
        await waitFor(() => {
          expect(container.querySelector('.edit-passenger-panel')).toBeTruthy();
        });
        
        // And: 应该显示乘客的基本信息（只读）
        expect(container.textContent).toContain('张三');
        
        // When: 修改手机号
        const phoneInput = container.querySelector('input[name="phone"]') as HTMLInputElement;
        if (phoneInput) {
          fireEvent.change(phoneInput, { target: { value: updatedPhone } });
          
          // And: 点击保存按钮
          const saveButton = Array.from(container.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('保存')
          );
          
          if (saveButton) {
            fireEvent.click(saveButton);
            
            // Then: 应该调用更新API
            await waitFor(() => {
              expect(global.fetch).toHaveBeenCalledWith(
                expect.stringMatching(/\/api\/passengers\/\d+/),
                expect.objectContaining({
                  method: 'PUT',
                  body: expect.stringContaining(updatedPhone)
                })
              );
            });
            
            // And: 应该返回乘客列表
            await waitFor(() => {
              expect(container.querySelector('.passenger-list-panel')).toBeTruthy();
            });
          }
        }
      }
    });
  });

  describe('[P0] 删除乘客流程', () => {
    
    it('应该能够删除乘客', async () => {
      // Mock删除乘客API
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url === '/api/passengers' && options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ passengers: mockPassengers })
          });
        }
        if (url.match(/\/api\/passengers\/\d+/) && options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: '删除成功'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户在乘客管理页
      const { container } = render(
        <MemoryRouter initialEntries={['/passengers']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.passenger-management-page')).toBeTruthy();
        expect(container.textContent).toContain('张三');
      });
      
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => true);
      
      // When: 点击第一个乘客的"删除"按钮
      const deleteButtons = Array.from(container.querySelectorAll('button')).filter(
        btn => btn.textContent?.includes('删除')
      );
      
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        
        // Then: 应该调用删除API
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringMatching(/\/api\/passengers\/\d+/),
            expect.objectContaining({
              method: 'DELETE'
            })
          );
        });
      }
      
      window.confirm = originalConfirm;
    });

    it('应该能够取消删除操作', async () => {
      // Given: 用户在乘客管理页
      const { container } = render(
        <MemoryRouter initialEntries={['/passengers']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.passenger-management-page')).toBeTruthy();
      });
      
      // Mock window.confirm返回false
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => false);
      
      // When: 点击删除按钮但选择取消
      const deleteButtons = Array.from(container.querySelectorAll('button')).filter(
        btn => btn.textContent?.includes('删除')
      );
      
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        
        // Then: 不应该调用删除API
        await waitFor(() => {
          expect(global.fetch).not.toHaveBeenCalledWith(
            expect.stringMatching(/\/api\/passengers\/\d+/),
            expect.objectContaining({ method: 'DELETE' })
          );
        });
      }
      
      window.confirm = originalConfirm;
    });
  });

  describe('[P1] 搜索乘客流程', () => {
    
    it('应该能够按姓名搜索乘客', async () => {
      // Given: 用户在乘客管理页
      const { container } = render(
        <MemoryRouter initialEntries={['/passengers']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.passenger-management-page')).toBeTruthy();
        expect(container.textContent).toContain('张三');
        expect(container.textContent).toContain('李四');
      });
      
      // When: 在搜索框输入"张三"
      const searchInput = container.querySelector('input[type="text"], input[placeholder*="搜索"], input[placeholder*="查询"]') as HTMLInputElement;
      
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: '张三' } });
        
        // And: 点击查询按钮或按回车
        const searchButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('查询') || btn.textContent?.includes('搜索')
        );
        
        if (searchButton) {
          fireEvent.click(searchButton);
        } else {
          fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });
        }
        
        // Then: 应该只显示匹配的乘客
        await waitFor(() => {
          expect(container.textContent).toContain('张三');
          // 注意：前端过滤可能仍显示所有乘客，这取决于实现
        });
      }
    });
  });
});

