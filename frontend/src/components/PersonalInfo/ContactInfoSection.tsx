// 联系方式模块组件
import React, { useState } from 'react';
import './ContactInfoSection.css';

interface ContactInfoSectionProps {
  phone: string;
  email: string;
  isEditing?: boolean;
  onEdit?: () => void;
  onNavigateToPhoneVerification?: () => void;
  onSaveEmail?: (email: string) => void;
}

/**
 * UI-ContactInfoSection: 联系方式模块组件
 * 显示手机号和邮箱信息，支持编辑
 */
const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({
  phone,
  email,
  isEditing = false,
  onEdit,
  onNavigateToPhoneVerification,
  onSaveEmail
}) => {
  const [editingEmail, setEditingEmail] = useState(email);
  const [localIsEditing, setLocalIsEditing] = useState(false);

  // 当email prop变化时，同步更新editingEmail
  React.useEffect(() => {
    setEditingEmail(email);
  }, [email]);

  const handleEdit = () => {
    setEditingEmail(email); // 确保编辑时从最新的email开始
    setLocalIsEditing(true);
    onEdit?.();
  };

  const handleSave = async () => {
    if (onSaveEmail && editingEmail !== email) {
      await onSaveEmail(editingEmail);
    }
    setLocalIsEditing(false);
  };

  const handleCancel = () => {
    setEditingEmail(email); // 恢复原值
    setLocalIsEditing(false); // 退出编辑模式
  };

  const showEditing = isEditing || localIsEditing;

  return (
    <div className="contact-info-section">
      <div className="section-header">
        <h3 className="section-title">联系方式</h3>
        {!showEditing && (
          <button className="edit-button" onClick={handleEdit}>
            编辑
          </button>
        )}
      </div>
      <div className="info-content">
        <div className="info-row">
          <span className="info-label">手机：</span>
          <div className="info-value-group">
            <span className="info-value">{phone}</span>
            {showEditing ? (
              <span 
                className="phone-link" 
                onClick={onNavigateToPhoneVerification}
              >
                去手机核验修改
              </span>
            ) : (
              <span className="verification-status">已通过核验</span>
            )}
          </div>
        </div>
        <div className="info-row">
          <span className="info-label">邮箱：</span>
          {showEditing ? (
            <div className="email-edit-group">
              <input
                type="email"
                className="email-input"
                value={editingEmail}
                onChange={(e) => setEditingEmail(e.target.value)}
                placeholder="请输入邮箱"
              />
              <button className="save-button" onClick={handleSave}>
                保存
              </button>
              <button className="cancel-button" onClick={handleCancel}>
                取消
              </button>
            </div>
          ) : (
            <span className="info-value">{email || '未设置'}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactInfoSection;

