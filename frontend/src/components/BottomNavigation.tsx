import React from 'react';
import './BottomNavigation.css';

interface BottomNavigationProps {
  onLinkClick: (link: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ onLinkClick }) => {
  const friendlyLinks = [
    '中国铁路客户服务中心',
    '铁路客户服务热线',
    '铁路投诉举报',
    '铁路招聘信息',
    '铁路货运服务'
  ];

  const qrCodes = [
    { name: '中国铁路官方微信', id: 'wechat' },
    { name: '中国铁路官方微博', id: 'weibo' },
    { name: '12306 公众号', id: 'official' },
    { name: '铁路 12306', id: 'app' }
  ];

  const handleLinkClick = (link: string) => {
    // TODO: 实现友情链接点击逻辑
    // 验收标准：
    // - 左侧应显示友情链接列表
    // - 右侧应显示四个官方平台二维码
    // - 二维码应包含"中国铁路官方微信"、"中国铁路官方微博"、"12306 公众号"、"铁路 12306"
    // - 所有链接应可点击跳转到对应页面
    onLinkClick(link);
  };

  return (
    <footer className="bottom-navigation">
      <div className="nav-container">
        <div className="friendly-links">
          <h4>友情链接</h4>
          <ul>
            {friendlyLinks.map((link, index) => (
              <li key={index}>
                <button
                  onClick={() => handleLinkClick(link)}
                  className="link-button"
                >
                  {link}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="qr-codes">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="qr-code-item">
              <div className="qr-placeholder">
                二维码
              </div>
              <span>{qr.name}</span>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default BottomNavigation;