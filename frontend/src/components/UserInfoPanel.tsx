import React, { useState } from 'react';
import './UserInfoPanel.css';

interface UserInfo {
  username: string;
  name: string;
  country: string;
  idCardType: string;
  idCardNumber: string;
  verificationStatus: string;
  phone: string;
  email: string;
  discountType: string;
}

interface UserInfoPanelProps {
  userInfo: UserInfo | null;
  onEditContact?: () => void;
  onEditAdditional?: () => void;
}

const UserInfoPanel: React.FC<UserInfoPanelProps> = ({
  userInfo,
  onEditContact,
  onEditAdditional
}) => {
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingAdditional, setIsEditingAdditional] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');

  if (!userInfo) {
    return <div className="user-info-panel">加载中...</div>;
  }

  // 脱敏手机号（中间四位用*隐去）
  const maskPhone = (phone: string) => {
    if (phone && phone.length === 11) {
      return `(+86)${phone.slice(0, 3)}****${phone.slice(7)}`;
    }
    return phone;
  };

  const handleEditContact = () => {
    setIsEditingContact(true);
    if (onEditContact) {
      onEditContact();
    }
  };

  const handleEditAdditional = () => {
    setIsEditingAdditional(true);
    if (onEditAdditional) {
      onEditAdditional();
    }
  };

  return (
    <div className="user-info-panel">
      {/* 基本信息模块 */}
      <div className="info-section">
        <h3 className="section-title">基本信息</h3>
        <div className="info-row">
          <span className="info-label">用户名：</span>
          <span className="info-value">{userInfo.username}</span>
        </div>
        <div className="info-row">
          <span className="info-label">姓名：</span>
          <span className="info-value">{userInfo.name}</span>
        </div>
        <div className="info-row">
          <span className="info-label">国家/地区：</span>
          <span className="info-value">{userInfo.country}</span>
        </div>
        <div className="info-row">
          <span className="info-label">证件类型：</span>
          <span className="info-value">{userInfo.idCardType}</span>
        </div>
        <div className="info-row">
          <span className="info-label">证件号码：</span>
          <span className="info-value">{userInfo.idCardNumber}</span>
        </div>
        <div className="info-row">
          <span className="info-label">核验状态：</span>
          <span className="info-value verification-status">{userInfo.verificationStatus}</span>
        </div>
      </div>

      {/* 联系方式模块 */}
      <div className="info-section">
        <div className="section-header">
          <h3 className="section-title">联系方式</h3>
          <button className="edit-btn" onClick={handleEditContact}>编辑</button>
        </div>
        <div className="info-row">
          <span className="info-label">手机号：</span>
          <span className="info-value">{maskPhone(userInfo.phone)}</span>
          <span className="phone-verified">已通过核验</span>
        </div>
        <div className="info-row">
          <span className="info-label">邮箱：</span>
          <span className="info-value">{userInfo.email || ''}</span>
        </div>
      </div>

      {/* 附加信息模块 */}
      <div className="info-section">
        <div className="section-header">
          <h3 className="section-title">附加信息</h3>
          <button className="edit-btn" onClick={handleEditAdditional}>编辑</button>
        </div>
        <div className="info-row">
          <span className="info-label">优惠(待)类型：</span>
          <span className="info-value">{userInfo.discountType}</span>
        </div>
      </div>
    </div>
  );
};

export default UserInfoPanel;

