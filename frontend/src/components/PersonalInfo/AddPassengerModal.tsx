/**
 * 添加乘车人弹窗组件
 */

import React, { useState } from 'react';
import './PassengerModal.css';

interface AddPassengerModalProps {
  onClose: () => void;
  onAdd: (passenger: PassengerFormData) => Promise<void>;
}

interface PassengerFormData {
  name: string;
  idCardType: string;
  idCardNumber: string;
  phone: string;
  discountType: string;
}

const AddPassengerModal: React.FC<AddPassengerModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState<PassengerFormData>({
    name: '',
    idCardType: '居民身份证',
    idCardNumber: '',
    phone: '',
    discountType: '成人'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = (name: string): string | null => {
    if (!name || name.trim() === '') {
      return '请输入姓名！';
    }
    // 计算字符长度（中文2个字符，英文1个字符）
    const length = name.split('').reduce((acc, char) => {
      return acc + (/[\u4e00-\u9fa5]/.test(char) ? 2 : 1);
    }, 0);
    if (length < 3 || length > 30) {
      return '允许输入的字符串在3-30个字符之间！';
    }
    // 只允许中英文、点和空格
    if (!/^[\u4e00-\u9fa5a-zA-Z\.\s]+$/.test(name)) {
      return '请输入姓名！';
    }
    return null;
  };

  const validateIdCard = (idCard: string): string | null => {
    if (!idCard || idCard.trim() === '') {
      return '请输入证件号码！';
    }
    if (idCard.length !== 18) {
      return '请正确输入18位证件号码！';
    }
    if (!/^[0-9a-zA-Z]{18}$/.test(idCard)) {
      return '输入的证件编号中包含中文信息或特殊字符！';
    }
    // 简单的身份证校验（实际应该更严格）
    if (!/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[\dXx]$/.test(idCard)) {
      return '请正确输入18位证件号码！';
    }
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone || phone.trim() === '') {
      return '请输入手机号码！';
    }
    if (phone.length !== 11) {
      return '您输入的手机号码不是有效的格式！';
    }
    if (!/^\d{11}$/.test(phone)) {
      return '您输入的手机号码不是有效的格式！';
    }
    return null;
  };

  const handleChange = (field: keyof PassengerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 限制只能输入数字，最多11位
    if (value.length <= 11 && /^\d*$/.test(value)) {
      handleChange('phone', value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证所有字段
    const newErrors: { [key: string]: string } = {};
    
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const idCardError = validateIdCard(formData.idCardNumber);
    if (idCardError) newErrors.idCardNumber = idCardError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(formData);
      onClose();
    } catch (error: any) {
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">添加乘车人</h2>
        
        <form onSubmit={handleSubmit}>
          {/* 基本信息 */}
          <div className="form-section">
            <h3 className="section-title">基本信息</h3>
            
            <div className="form-field">
              <label className="field-label required">证件类型：</label>
              <select
                className="field-input"
                value={formData.idCardType}
                onChange={(e) => handleChange('idCardType', e.target.value)}
              >
                <option value="居民身份证">居民身份证</option>
              </select>
            </div>

            <div className="form-field">
              <label className="field-label required">姓名：</label>
              <input
                type="text"
                className="field-input"
                placeholder="请输入姓名"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
              <span className="field-hint">姓名填写规则（用于身份核验）</span>
            </div>

            <div className="form-field">
              <label className="field-label required">证件号码：</label>
              <input
                type="text"
                className="field-input"
                placeholder="请填写证件号码"
                value={formData.idCardNumber}
                onChange={(e) => handleChange('idCardNumber', e.target.value)}
                maxLength={18}
              />
              {errors.idCardNumber && <span className="field-error">{errors.idCardNumber}</span>}
              <span className="field-hint">用于身份核验，请正确填写。</span>
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
                value={formData.phone}
                onChange={handlePhoneChange}
                maxLength={11}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
              <span className="field-hint orange">
                请您填写乘车人真实有效的联系方式，以便接收铁路部门推送的重要服务信息，以及在紧急特殊情况下的联系。
              </span>
            </div>
          </div>

          {/* 附加信息 */}
          <div className="form-section">
            <h3 className="section-title">附加信息</h3>
            
            <div className="form-field">
              <label className="field-label required">优惠(待)类型：</label>
              <select
                className="field-input"
                value={formData.discountType}
                onChange={(e) => handleChange('discountType', e.target.value)}
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

export default AddPassengerModal;



