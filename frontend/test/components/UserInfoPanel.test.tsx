import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserInfoPanel from '../../src/components/UserInfoPanel';
import '@testing-library/jest-dom';

describe('UserInfoPanel 用户信息展示面板组件', () => {
  const mockUserInfo = {
    username: 'testuser123',
    name: '张三',
    country: '中国China',
    idCardType: '居民身份证',
    idCardNumber: '310xxxxxxxxxx',
    verificationStatus: '已通过',
    phone: '15812349968',
    email: 'test@example.com',
    discountType: '成人'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UI-UserInfoPanel: 基本渲染', () => {
    it('应该渲染用户信息面板', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const panel = document.querySelector('.user-info-panel');
      expect(panel).toBeInTheDocument();
    });

    it('Given: userInfo 为 null, When: 渲染组件, Then: 应该显示加载中', () => {
      render(<UserInfoPanel userInfo={null} />);
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('应该分为三个信息模块', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const sections = document.querySelectorAll('.info-section');
      expect(sections.length).toBe(3);
    });

    it('各模块应该以白色卡片样式展示', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const sections = document.querySelectorAll('.info-section');
      sections.forEach(section => {
        expect(section).toHaveStyle({ backgroundColor: 'white' });
      });
    });
  });

  describe('REQ-6.1.4: 基本信息模块', () => {
    it('应该显示模块标题"基本信息"', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const titles = screen.getAllByText('基本信息');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('应该显示用户名', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      expect(screen.getByText('用户名：')).toBeInTheDocument();
      expect(screen.getByText('testuser123')).toBeInTheDocument();
      
      const label = screen.getByText('用户名：');
      expect(label).toHaveClass('info-label');
      expect(label).toHaveStyle({ color: '#999' });
    });

    it('应该显示姓名', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      expect(screen.getByText('姓名：')).toBeInTheDocument();
      expect(screen.getByText('张三')).toBeInTheDocument();
    });

    it('应该显示国家/地区', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      expect(screen.getByText('国家/地区：')).toBeInTheDocument();
      expect(screen.getByText('中国China')).toBeInTheDocument();
    });

    it('应该显示证件类型', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      expect(screen.getByText('证件类型：')).toBeInTheDocument();
      expect(screen.getByText('居民身份证')).toBeInTheDocument();
    });

    it('应该显示证件号码', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      expect(screen.getByText('证件号码：')).toBeInTheDocument();
      expect(screen.getByText('310xxxxxxxxxx')).toBeInTheDocument();
    });

    it('应该显示核验状态', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      expect(screen.getByText('核验状态：')).toBeInTheDocument();
      const status = screen.getByText('已通过');
      expect(status).toBeInTheDocument();
      expect(status).toHaveClass('verification-status');
      expect(status).toHaveStyle({ color: '#fa8c16' });
    });

    it('基本信息的标签应该为灰色字体', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const labels = document.querySelectorAll('.info-label');
      labels.forEach(label => {
        expect(label).toHaveStyle({ color: '#999' });
      });
    });

    it('基本信息的值应该为黑色字体', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const values = document.querySelectorAll('.info-value');
      values.forEach(value => {
        if (!value.classList.contains('verification-status')) {
          expect(value).toHaveStyle({ color: '#000' });
        }
      });
    });
  });

  describe('REQ-6.1.4: 联系方式模块', () => {
    it('应该显示模块标题"联系方式"', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const titles = screen.getAllByText('联系方式');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('应该在右上角显示"编辑"按钮', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const editButtons = screen.getAllByText('编辑');
      expect(editButtons.length).toBeGreaterThan(0);
      editButtons.forEach(button => {
        expect(button).toHaveClass('edit-btn');
      });
    });

    it('应该显示手机号，中间四位用*隐去', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      expect(screen.getByText('手机号：')).toBeInTheDocument();
      expect(screen.getByText('(+86)158****9968')).toBeInTheDocument();
    });

    it('应该显示"已通过核验"状态', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const verified = screen.getByText('已通过核验');
      expect(verified).toBeInTheDocument();
      expect(verified).toHaveClass('phone-verified');
      expect(verified).toHaveStyle({ color: '#fa8c16' });
    });

    it('应该显示邮箱', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      expect(screen.getByText('邮箱：')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('Given: 邮箱为空, When: 渲染组件, Then: 应该显示空字符串', () => {
      const userInfoWithoutEmail = { ...mockUserInfo, email: '' };
      render(<UserInfoPanel userInfo={userInfoWithoutEmail} />);
      expect(screen.getByText('邮箱：')).toBeInTheDocument();
    });

    it('Given: 点击"编辑"按钮, When: 触发点击事件, Then: 应该调用回调函数', () => {
      const mockOnEditContact = vi.fn();
      render(<UserInfoPanel userInfo={mockUserInfo} onEditContact={mockOnEditContact} />);

      const editButtons = screen.getAllByText('编辑');
      // 联系方式模块的编辑按钮是第一个
      fireEvent.click(editButtons[0]);

      expect(mockOnEditContact).toHaveBeenCalled();
    });
  });

  describe('REQ-6.1.4: 附加信息模块', () => {
    it('应该显示模块标题"附加信息"', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const titles = screen.getAllByText('附加信息');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('应该在右上角显示"编辑"按钮', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const editButtons = screen.getAllByText('编辑');
      expect(editButtons.length).toBe(2); // 联系方式和附加信息各一个
    });

    it('应该显示优惠(待)类型', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      expect(screen.getByText('优惠(待)类型：')).toBeInTheDocument();
      expect(screen.getByText('成人')).toBeInTheDocument();
    });

    it('Given: 点击"编辑"按钮, When: 触发点击事件, Then: 应该调用回调函数', () => {
      const mockOnEditAdditional = vi.fn();
      render(<UserInfoPanel userInfo={mockUserInfo} onEditAdditional={mockOnEditAdditional} />);

      const editButtons = screen.getAllByText('编辑');
      // 附加信息模块的编辑按钮是第二个
      fireEvent.click(editButtons[1]);

      expect(mockOnEditAdditional).toHaveBeenCalled();
    });
  });

  describe('REQ-6.1.4: 手机号脱敏功能', () => {
    it('Given: 手机号为11位, When: 显示手机号, Then: 中间四位应该用*隐去', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      expect(screen.getByText('(+86)158****9968')).toBeInTheDocument();
      expect(screen.queryByText('15812349968')).not.toBeInTheDocument();
    });

    it('Given: 手机号格式异常, When: 显示手机号, Then: 应该显示原始手机号', () => {
      const userInfoWithInvalidPhone = { ...mockUserInfo, phone: '123' };
      render(<UserInfoPanel userInfo={userInfoWithInvalidPhone} />);
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('Given: 手机号为空, When: 显示手机号, Then: 应该显示空字符串', () => {
      const userInfoWithEmptyPhone = { ...mockUserInfo, phone: '' };
      render(<UserInfoPanel userInfo={userInfoWithEmptyPhone} />);
      expect(screen.getByText('手机号：')).toBeInTheDocument();
    });
  });

  describe('UI元素存在性检查', () => {
    it('所有信息行应该存在且可见', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const infoRows = document.querySelectorAll('.info-row');
      expect(infoRows.length).toBeGreaterThan(0);
      infoRows.forEach(row => {
        expect(row).toBeVisible();
      });
    });

    it('所有标签应该存在且格式正确', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const labels = document.querySelectorAll('.info-label');
      expect(labels.length).toBeGreaterThan(0);
      labels.forEach(label => {
        expect(label).toBeVisible();
        expect(label.textContent).toMatch(/：$/); // 应该以冒号结尾
      });
    });

    it('所有编辑按钮应该存在且可点击', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const editButtons = screen.getAllByText('编辑');
      expect(editButtons.length).toBe(2);
      editButtons.forEach(button => {
        expect(button).toBeVisible();
        expect(button).toHaveClass('edit-btn');
      });
    });
  });

  describe('边界情况', () => {
    it('Given: 所有字段都为空, When: 渲染组件, Then: 应该正常显示', () => {
      const emptyUserInfo = {
        username: '',
        name: '',
        country: '',
        idCardType: '',
        idCardNumber: '',
        verificationStatus: '',
        phone: '',
        email: '',
        discountType: ''
      };
      render(<UserInfoPanel userInfo={emptyUserInfo} />);
      const panel = document.querySelector('.user-info-panel');
      expect(panel).toBeInTheDocument();
    });

    it('Given: 字段包含特殊字符, When: 渲染组件, Then: 应该正确显示', () => {
      const specialUserInfo = {
        ...mockUserInfo,
        name: '张三·李四',
        email: 'test+123@example.com'
      };
      render(<UserInfoPanel userInfo={specialUserInfo} />);
      expect(screen.getByText('张三·李四')).toBeInTheDocument();
      expect(screen.getByText('test+123@example.com')).toBeInTheDocument();
    });

    it('Given: 未提供回调函数, When: 点击编辑按钮, Then: 不应该抛出错误', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const editButtons = screen.getAllByText('编辑');
      expect(() => fireEvent.click(editButtons[0])).not.toThrow();
      expect(() => fireEvent.click(editButtons[1])).not.toThrow();
    });
  });

  describe('性能测试', () => {
    it('组件应该快速渲染', () => {
      const startTime = performance.now();
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('样式测试', () => {
    it('模块标题应该是加粗字体', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const titles = document.querySelectorAll('.section-title');
      titles.forEach(title => {
        expect(title).toHaveStyle({ fontWeight: 'bold' });
      });
    });

    it('编辑按钮应该有适当的样式', () => {
      render(<UserInfoPanel userInfo={mockUserInfo} />);
      const editButtons = screen.getAllByText('编辑');
      editButtons.forEach(button => {
        expect(button).toHaveStyle({ 
          color: '#1890ff',
          cursor: 'pointer'
        });
      });
    });
  });
});

