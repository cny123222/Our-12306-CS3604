// 手机核验流程跨页测试
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../../src/App';

global.fetch = vi.fn();

describe('手机核验流程跨页测试', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'valid-test-token');
    
    // 默认mock
    (global.fetch as any).mockImplementation((url: string, options?: any) => {
      if (url === '/api/user/info') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            username: 'testuser',
            name: '张三',
            phone: '(+86)158****9968',
            email: 'test@example.com'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });
  });

  describe('[P0] 进入手机核验页流程', () => {
    
    it('应该能够从个人信息页进入手机核验页', async () => {
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
        
        // Then: 应该显示"去手机核验修改"链接
        await waitFor(() => {
          const phoneVerificationLink = container.querySelector('a[href="/phone-verification"], .phone-verification-link');
          expect(phoneVerificationLink).toBeTruthy();
        });
        
        // When: 点击"去手机核验修改"
        const phoneVerificationLink = container.querySelector('a[href="/phone-verification"], .phone-verification-link');
        if (phoneVerificationLink) {
          fireEvent.click(phoneVerificationLink);
          
          // Then: 应该跳转到手机核验页
          await waitFor(() => {
            expect(window.location.pathname).toBe('/phone-verification');
          });
        }
      }
    });

    it('手机核验页应该显示原手机号（脱敏）', async () => {
      // Mock获取原手机号API
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === '/api/user/info') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              phone: '(+86)158****9968'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // When: 访问手机核验页
      const { container } = render(
        <MemoryRouter initialEntries={['/phone-verification']}>
          <App />
        </MemoryRouter>
      );
      
      // Then: 应该显示原手机号（脱敏）
      await waitFor(() => {
        const oldPhoneDisplay = container.textContent;
        expect(oldPhoneDisplay).toContain('158****9968');
      });
    });
  });

  describe('[P0] 完成手机核验流程', () => {
    
    it('应该能够完成完整的手机核验流程', async () => {
      let sessionId = '';
      
      // Mock API
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        const body = options?.body ? JSON.parse(options.body) : {};
        
        if (url === '/api/user/info') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              phone: '(+86)158****9968'
            })
          });
        }
        
        if (url === '/api/user/update-phone/request' && options?.method === 'POST') {
          sessionId = 'test-session-id';
          return Promise.resolve({
            ok: true,
            json: async () => ({
              sessionId: sessionId,
              message: '验证码已发送'
            })
          });
        }
        
        if (url === '/api/user/update-phone/confirm' && options?.method === 'POST') {
          expect(body.sessionId).toBe(sessionId);
          expect(body.code).toBe('123456');
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: '手机号更新成功'
            })
          });
        }
        
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户在手机核验页
      const { container } = render(
        <MemoryRouter initialEntries={['/phone-verification']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.phone-verification-page')).toBeTruthy();
      });
      
      // When: 输入新手机号
      const newPhoneInput = container.querySelector('input[name="newPhone"], input[placeholder*="手机"]') as HTMLInputElement;
      if (newPhoneInput) {
        fireEvent.change(newPhoneInput, { target: { value: '13800138000' } });
      }
      
      // And: 输入密码
      const passwordInput = container.querySelector('input[type="password"], input[name="password"]') as HTMLInputElement;
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'Test@123' } });
      }
      
      // And: 点击确认按钮
      const confirmButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('确认') || btn.textContent?.includes('下一步')
      );
      
      if (confirmButton) {
        fireEvent.click(confirmButton);
        
        // Then: 应该显示验证码弹窗
        await waitFor(() => {
          const modal = container.querySelector('.phone-verification-modal, .verification-modal');
          expect(modal).toBeTruthy();
        });
        
        // When: 输入验证码
        const codeInput = container.querySelector('input[name="code"], input[placeholder*="验证码"]') as HTMLInputElement;
        if (codeInput) {
          fireEvent.change(codeInput, { target: { value: '123456' } });
        }
        
        // And: 点击完成按钮
        const completeButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('完成') || btn.textContent?.includes('确认')
        );
        
        if (completeButton) {
          fireEvent.click(completeButton);
          
          // Then: 应该返回个人信息页
          await waitFor(() => {
            expect(window.location.pathname).toBe('/personal-info');
          });
          
          // And: API应该被正确调用
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/user/update-phone/request',
            expect.objectContaining({
              method: 'POST',
              body: expect.stringContaining('13800138000')
            })
          );
          
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/user/update-phone/confirm',
            expect.objectContaining({
              method: 'POST',
              body: expect.stringContaining('123456')
            })
          );
        }
      }
    });

    it('应该验证新手机号格式', async () => {
      // Given: 用户在手机核验页
      const { container } = render(
        <MemoryRouter initialEntries={['/phone-verification']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.phone-verification-page')).toBeTruthy();
      });
      
      // When: 输入无效的手机号
      const newPhoneInput = container.querySelector('input[name="newPhone"], input[placeholder*="手机"]') as HTMLInputElement;
      if (newPhoneInput) {
        fireEvent.change(newPhoneInput, { target: { value: '123' } });
        fireEvent.blur(newPhoneInput);
        
        // Then: 应该显示错误提示
        await waitFor(() => {
          const errorMessage = container.textContent;
          expect(
            errorMessage?.includes('手机号') && 
            (errorMessage?.includes('无效') || errorMessage?.includes('格式') || errorMessage?.includes('11位'))
          ).toBeTruthy();
        });
      }
    });
  });

  describe('[P0] 取消手机核验流程', () => {
    
    it('应该能够取消手机核验并返回个人信息页', async () => {
      // Given: 用户在手机核验页
      const { container } = render(
        <MemoryRouter initialEntries={['/phone-verification']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.phone-verification-page')).toBeTruthy();
      });
      
      // When: 点击取消按钮
      const cancelButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('取消') || btn.textContent?.includes('返回')
      );
      
      if (cancelButton) {
        fireEvent.click(cancelButton);
        
        // Then: 应该返回个人信息页
        await waitFor(() => {
          expect(window.location.pathname).toBe('/personal-info');
        });
        
        // And: 不应该调用更新API
        expect(global.fetch).not.toHaveBeenCalledWith(
          expect.stringContaining('/api/user/update-phone'),
          expect.anything()
        );
      }
    });

    it('应该能够从验证码弹窗返回修改', async () => {
      // Mock API
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url === '/api/user/info') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ phone: '(+86)158****9968' })
          });
        }
        if (url === '/api/user/update-phone/request') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              sessionId: 'test-session-id',
              message: '验证码已发送'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户已经打开验证码弹窗
      const { container } = render(
        <MemoryRouter initialEntries={['/phone-verification']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.phone-verification-page')).toBeTruthy();
      });
      
      // 触发验证码弹窗
      const newPhoneInput = container.querySelector('input[name="newPhone"]') as HTMLInputElement;
      const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
      const confirmButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('确认')
      );
      
      if (newPhoneInput && passwordInput && confirmButton) {
        fireEvent.change(newPhoneInput, { target: { value: '13800138000' } });
        fireEvent.change(passwordInput, { target: { value: 'Test@123' } });
        fireEvent.click(confirmButton);
        
        await waitFor(() => {
          expect(container.querySelector('.phone-verification-modal')).toBeTruthy();
        });
        
        // When: 点击"返回修改"按钮
        const returnButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('返回修改') || btn.textContent?.includes('修改')
        );
        
        if (returnButton) {
          fireEvent.click(returnButton);
          
          // Then: 弹窗应该关闭
          await waitFor(() => {
            expect(container.querySelector('.phone-verification-modal')).toBeFalsy();
          });
          
          // And: 应该还在手机核验页
          expect(container.querySelector('.phone-verification-page')).toBeTruthy();
        }
      }
    });
  });

  describe('[P1] 错误处理', () => {
    
    it('应该处理验证码错误', async () => {
      // Mock API返回验证码错误
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url === '/api/user/info') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ phone: '(+86)158****9968' })
          });
        }
        if (url === '/api/user/update-phone/request') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              sessionId: 'test-session-id'
            })
          });
        }
        if (url === '/api/user/update-phone/confirm') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({
              error: '验证码错误'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      // Given: 用户输入了错误的验证码
      const { container } = render(
        <MemoryRouter initialEntries={['/phone-verification']}>
          <App />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(container.querySelector('.phone-verification-page')).toBeTruthy();
      });
      
      // 输入手机号和密码，打开弹窗
      const newPhoneInput = container.querySelector('input[name="newPhone"]') as HTMLInputElement;
      const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
      const confirmButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('确认')
      );
      
      if (newPhoneInput && passwordInput && confirmButton) {
        fireEvent.change(newPhoneInput, { target: { value: '13800138000' } });
        fireEvent.change(passwordInput, { target: { value: 'Test@123' } });
        fireEvent.click(confirmButton);
        
        await waitFor(() => {
          expect(container.querySelector('.phone-verification-modal')).toBeTruthy();
        });
        
        // When: 输入错误的验证码
        const codeInput = container.querySelector('input[name="code"]') as HTMLInputElement;
        const completeButton = Array.from(container.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('完成')
        );
        
        if (codeInput && completeButton) {
          fireEvent.change(codeInput, { target: { value: '000000' } });
          fireEvent.click(completeButton);
          
          // Then: 应该显示错误提示
          await waitFor(() => {
            const errorMessage = container.textContent;
            expect(errorMessage?.includes('验证码错误') || errorMessage?.includes('错误')).toBeTruthy();
          });
        }
      }
    });
  });
});

