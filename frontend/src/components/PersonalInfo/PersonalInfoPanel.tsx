/**
 * 个人信息展示面板组件
 * 显示用户的基本信息、联系方式和附加信息
 */

import React, { useState } from 'react';
import './PersonalInfoPanel.css';

interface PersonalInfoPanelProps {
  userInfo: {
    username: string;
    name: string;
    country: string;
    idCardType: string;
    idCardNumber: string;
    verificationStatus: string;
    phone: string;
    email: string;
    discountType: string;
  } | null;
  onEditContact?: () => void;
  onEditAdditionalInfo?: () => void;
}

const PersonalInfoPanel: React.FC<PersonalInfoPanelProps> = ({
  userInfo,
  onEditContact,
  onEditAdditionalInfo
}) => {
  if (!userInfo) {
    return <div className="personal-info-panel loading">加载中...</div>;
  }

  return (
    <div data-testid="personal-info-panel" className="personal-info-panel">
      {/* 基本信息模块 */}
      <div className="info-section">
        <h3 className="section-title">基本信息</h3>
        <div className="info-content">
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
            <span className="info-value verified">{userInfo.verificationStatus}</span>
          </div>
        </div>
      </div>

      {/* 联系方式模块 */}
      <div className="info-section">
        <div className="section-header">
          <h3 className="section-title">联系方式</h3>
          <button className="edit-button" onClick={onEditContact}>编辑</button>
        </div>
        <div className="info-content">
          <div className="info-row">
            <span className="info-label">手机号：</span>
            <span className="info-value">{userInfo.phone}</span>
            <span className="info-status verified">已通过核验</span>
          </div>
          <div className="info-row">
            <span className="info-label">邮箱：</span>
            <span className="info-value">{userInfo.email || ''}</span>
          </div>
        </div>
      </div>

      {/* 附加信息模块 */}
      <div className="info-section">
        <div className="section-header">
          <h3 className="section-title">附加信息</h3>
          <button className="edit-button" onClick={onEditAdditionalInfo}>编辑</button>
        </div>
        <div className="info-content">
          <div className="info-row">
            <span className="info-label">优惠(待)类型：</span>
            <span className="info-value">{userInfo.discountType}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoPanel;




