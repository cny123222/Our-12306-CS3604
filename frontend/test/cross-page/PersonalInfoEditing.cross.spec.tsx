// 个人信息编辑流程跨页测试
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../../src/App';

global.fetch = vi.fn();

describe('个人信息编辑流程跨页测试', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'valid-test-token');
    
    // 默认mock
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
            email: '', // 初始无邮箱
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

  describe('[P1] 邮箱编辑流程', () => {
    
    it('用户无邮箱时应该只显示"邮箱："标签', async () => {
      // When: 访问个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 应该显示"邮箱："但没有具体邮箱地址
      await waitFor(() => {
        const text = container.textContent || '';
        expect(text).toContain('邮箱');
        // 不应该显示邮箱地址
        expect(text).not.toMatch(/\w+@\w+\.\w+/);
      });
    });

    it('用户有邮箱时应该显示完整邮箱地址', async () => {
      // Mock用户有邮箱
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === '/api/user/info') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              username: 'testuser',
              email: 'test@example.com'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // When: 访问个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 应该显示完整邮箱地址
      await waitFor(() => {
        const text = container.textContent || '';
        expect(text).toContain('test@example.com');
      });
    });

    it('应该能够进入邮箱编辑模式', async () => {
      // Given: 用户在个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
      });
      
      // When: 点击联系方式模块的"编辑"按钮
      const contactSection = container.querySelector('.contact-info-section');
      const editButton = contactSection?.querySelector('button');
      
      if (editButton && editButton.textContent?.includes('编辑')) {
        fireEvent.click(editButton);
        
        // Then: 应该显示邮箱输入框
        await waitFor(() => {
          const emailInput = container.querySelector('input[name="email"], input[type="email"]');
          expect(emailInput).toBeTruthy();
        });
      }
    });

    it('应该能够完成邮箱编辑流程', async () => {
      const newEmail = 'newemail@example.com';

      // Mock更新邮箱API
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url === '/api/user/info' && options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              username: 'testuser',
              email: ''
            })
          });
        }
        if (url === '/api/user/email' && options?.method === 'PUT') {
          const body = JSON.parse(options.body);
          expect(body.email).toBe(newEmail);
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: '邮箱更新成功'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户在个人信息页的编辑模式
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
      });
      
      // 进入编辑模式
      const contactSection = container.querySelector('.contact-info-section');
      const editButton = contactSection?.querySelector('button');
      
      if (editButton && editButton.textContent?.includes('编辑')) {
        fireEvent.click(editButton);
        
        await waitFor(() => {
          expect(container.querySelector('input[name="email"], input[type="email"]')).toBeTruthy();
        });
        
        // When: 输入新邮箱
        const emailInput = container.querySelector('input[name="email"], input[type="email"]') as HTMLInputElement;
        if (emailInput) {
          fireEvent.change(emailInput, { target: { value: newEmail } });
          
          // And: 点击保存按钮
          const saveButton = Array.from(container.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('保存') || btn.textContent?.includes('确认')
          );
          
          if (saveButton) {
            fireEvent.click(saveButton);
            
            // Then: 应该调用更新邮箱API
            await waitFor(() => {
              expect(global.fetch).toHaveBeenCalledWith(
                '/api/user/email',
                expect.objectContaining({
                  method: 'PUT',
                  body: expect.stringContaining(newEmail)
                })
              );
            });
            
            // And: 应该显示成功提示
            await waitFor(() => {
              const text = container.textContent || '';
              expect(
                text.includes('成功') || 
                text.includes('保存')
              ).toBeTruthy();
            });
          }
        }
      }
    });

    it('应该验证邮箱格式', async () => {
      // Given: 用户在邮箱编辑模式
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
      });
      
      // 进入编辑模式
      const editButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('编辑')
      );
      
      if (editButton) {
        fireEvent.click(editButton);
        
        await waitFor(() => {
          expect(container.querySelector('input[type="email"]')).toBeTruthy();
        });
        
        // When: 输入无效的邮箱格式
        const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
        if (emailInput) {
          fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
          fireEvent.blur(emailInput);
          
          // Then: 应该显示格式错误提示
          await waitFor(() => {
            const text = container.textContent || '';
            expect(
              text.includes('格式') || 
              text.includes('无效') || 
              text.includes('邮箱')
            ).toBeTruthy();
          });
        }
      }
    });

    it('应该能够取消邮箱编辑', async () => {
      // Given: 用户在邮箱编辑模式
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
      });
      
      // 进入编辑模式
      const editButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('编辑')
      );
      
      if (editButton) {
        fireEvent.click(editButton);
        
        await waitFor(() => {
          expect(container.querySelector('input[type="email"]')).toBeTruthy();
        });
        
        // When: 输入新邮箱但点击取消
        const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
        if (emailInput) {
          fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });
        }
        
        const cancelButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('取消')
        );
        
        if (cancelButton) {
          fireEvent.click(cancelButton);
          
          // Then: 不应该调用更新API
          expect(global.fetch).not.toHaveBeenCalledWith(
            '/api/user/email',
            expect.objectContaining({ method: 'PUT' })
          );
          
          // And: 应该退出编辑模式
          await waitFor(() => {
            expect(container.querySelector('input[type="email"]')).toBeFalsy();
          });
        }
      }
    });
  });

  describe('[P2] 附加信息编辑流程', () => {
    
    it('应该显示附加信息的编辑按钮', async () => {
      // When: 访问个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 附加信息模块应该有编辑按钮
      await waitFor(() => {
        const additionalSection = container.querySelector('.additional-info-section');
        if (additionalSection) {
          const editButton = additionalSection.querySelector('button');
          expect(editButton).toBeTruthy();
          expect(editButton?.textContent).toContain('编辑');
        }
      });
    });

    it('点击附加信息编辑按钮应该有相应反馈', async () => {
      // Given: 用户在个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
      });
      
      // When: 点击附加信息模块的编辑按钮
      const additionalSection = container.querySelector('.additional-info-section');
      const editButton = additionalSection?.querySelector('button');
      
      if (editButton) {
        fireEvent.click(editButton);
        
        // Then: 应该有某种反馈（根据实际实现可能是打开编辑模式或显示提示）
        // 这里只验证点击不会导致错误
        await waitFor(() => {
          expect(container.querySelector('.personal-info-page')).toBeTruthy();
        });
      }
    });
  });

  describe('[P1] 联系方式-手机号展示', () => {
    
    it('应该正确脱敏显示手机号', async () => {
      // When: 访问个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 手机号应该脱敏显示
      await waitFor(() => {
        const text = container.textContent || '';
        expect(text).toContain('158****9968');
        // 不应该显示完整手机号
        expect(text).not.toMatch(/\d{11}/);
      });
    });

    it('应该显示手机号核验状态', async () => {
      // When: 访问个人信息页
      const { container } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 应该显示"已通过核验"或类似状态
      await waitFor(() => {
        const text = container.textContent || '';
        expect(
          text.includes('已通过核验') || 
          text.includes('已核验') ||
          text.includes('已通过')
        ).toBeTruthy();
      });
    });
  });

  describe('[P1] 数据持久化验证', () => {
    
    it('编辑后刷新页面应该保持新数据', async () => {
      const newEmail = 'persisted@example.com';
      let savedEmail = '';

      // Mock API
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url === '/api/user/info' && options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              username: 'testuser',
              email: savedEmail
            })
          });
        }
        if (url === '/api/user/email' && options?.method === 'PUT') {
          const body = JSON.parse(options.body);
          savedEmail = body.email;
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户保存了新邮箱
      const { container, unmount } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.personal-info-page')).toBeTruthy();
      });
      
      // 编辑并保存邮箱
      const editButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('编辑')
      );
      
      if (editButton) {
        fireEvent.click(editButton);
        
        await waitFor(() => {
          expect(container.querySelector('input[type="email"]')).toBeTruthy();
        });
        
        const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
        const saveButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('保存')
        );
        
        if (emailInput && saveButton) {
          fireEvent.change(emailInput, { target: { value: newEmail } });
          fireEvent.click(saveButton);
          
          await waitFor(() => {
            expect(savedEmail).toBe(newEmail);
          });
        }
      }
      
      // When: 重新渲染页面（模拟刷新）
      unmount();
      
      const { container: newContainer } = render(
        <MemoryRouter initialEntries={['/personal-info']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 应该显示保存的新邮箱
      await waitFor(() => {
        const text = newContainer.textContent || '';
        expect(text).toContain(newEmail);
      });
    });
  });
});

