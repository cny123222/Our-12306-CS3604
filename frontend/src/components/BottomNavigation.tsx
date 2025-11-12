import React from 'react';
import './BottomNavigation.css';

const BottomNavigation: React.FC = () => {
  return (
    <footer className="bottom-navigation">
      <div className="bottom-content">
        <div className="contact-info">
          <div className="contact-item">
            <span className="contact-icon">📞</span>
            <span className="contact-text">全国统一客服电话</span>
          </div>
          <div className="contact-item">
            <span className="contact-icon">🕐</span>
            <span className="contact-text">客服时间：6:00-23:00</span>
          </div>
        </div>
        
        <div className="qr-codes-section">
          <div className="friendship-links">
            <img src="/images/登录页-友情链接.png" alt="友情链接" />
          </div>
          
          <div className="qr-codes-container">
            <div className="qr-codes">
              <div className="qr-code-item">
                <img src="/images/中国铁路官方微信二维码.png" alt="中国铁路官方微信" />
                <span>中国铁路官方微信</span>
              </div>
              <div className="qr-code-item">
                <img src="/images/中国铁路官方微博二维码.png" alt="中国铁路官方微博" />
                <span>中国铁路官方微博</span>
              </div>
              <div className="qr-code-item">
                <img src="/images/12306公众号二维码.png" alt="12306 公众号" />
                <span>12306 公众号</span>
              </div>
              <div className="qr-code-item">
                <img src="/images/铁路12306二维码.png" alt="铁路12306" />
                <span>铁路12306</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BottomNavigation;