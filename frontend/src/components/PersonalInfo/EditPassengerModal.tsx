/**
 * 编辑乘车人弹窗组件
 */

import React, { useState } from 'react';
import './PassengerModal.css';

interface EditPassengerModalProps {
  passenger: {
    id: number;
    name: string;
    idCardType: string;
    idCardNumber: string;
    phone: string;
    discountType: string;
    createdAt: string;
  };
  onClose: () => void;
  onUpdate: (passengerId: number, data: { phone: string; discountType: string }) => Promise<void>;
}

const EditPassengerModal: React.FC<EditPassengerModalProps> = ({ passenger, onClose, onUpdate }) => {
  const [phone, setPhone] = useState(passenger.phone);
  const [discountType, setDiscountType] = useState(passenger.discountType);
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePhone = (phoneValue: string): string | null => {
    if (!phoneValue || phoneValue.trim() === '') {
      return '请输入手机号码！';
    }
    if (phoneValue.length !== 11) {
      return '您输入的手机号码不是有效的格式！';
    }
    if (!/^\d{11}$/.test(phoneValue)) {
      return '您输入的手机号码不是有效的格式！';
    }
    return null;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 限制只能输入数字，最多11位
    if (value.length <= 11 && /^\d*$/.test(value)) {
      setPhone(value);
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validatePhone(phone);
    if (error) {
      setPhoneError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(passenger.id, { phone, discountType });
      alert('修改成功');
      onClose();
    } catch (error: any) {
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">编辑乘车人</h2>
        
        <form onSubmit={handleSubmit}>
          {/* 基本信息 */}
          <div className="form-section">
            <h3 className="section-title">基本信息</h3>
            
            <div className="form-field">
              <label className="field-label">证件类型：</label>
              <div className="field-value">{passenger.idCardType}</div>
            </div>

            <div className="form-field">
              <label className="field-label">姓名：</label>
              <div className="field-value">{passenger.name}</div>
            </div>

            <div className="form-field">
              <label className="field-label">证件号码：</label>
              <div className="field-value">{passenger.idCardNumber}</div>
            </div>

            <div className="form-field">
              <label className="field-label">国家/地区：</label>
              <div className="field-value">中国China</div>
            </div>

            <div className="form-field">
              <label className="field-label">添加日期：</label>
              <div className="field-value">{formatDate(passenger.createdAt)}</div>
            </div>

            <div className="form-field">
              <label className="field-label">核验状态：</label>
              <div className="field-value status-verified">已通过</div>
            </div>
          </div>

          {/* 联系方式 */}
          <div className="form-section">
            <h3 className="section-title">联系方式（请提供乘车人真实有效的联系方式）</h3>
            
            <div className="form-field">
              <label className="field-label">手机号码：</label>
              <select className="country-code-select" value="+86" disabled>
                <option value="+86">+86</option>
              </select>
              <input
                type="text"
                className="field-input phone-input"
                placeholder="请填写手机号码"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={11}
              />
              {phoneError && <span className="field-error">{phoneError}</span>}
              <span className="field-hint orange">
                请您填写乘车人真实有效的联系方式，以便接收铁路部门推送的重要服务信息，以及在紧急特殊情况下的联系。
              </span>
            </div>
          </div>

          {/* 附加信息 */}
          <div className="form-section">
            <h3 className="section-title">附加信息</h3>
            
            <div className="form-field">
              <label className="field-label">优惠(待)类型：</label>
              <select
                className="field-input"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="成人">成人</option>
              </select>
            </div>
          </div>

          {/* 按钮组 */}
          <div className="modal-buttons">
            <button type="button" className="cancel-button" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPassengerModal;



