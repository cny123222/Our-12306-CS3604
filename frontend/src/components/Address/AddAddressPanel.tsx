import React, { useState } from 'react';
import './AddAddressPanel.css';

interface AddAddressPanelProps {
  onCancel: () => void;
  onSave: (address: any) => void;
}

const AddAddressPanel: React.FC<AddAddressPanelProps> = ({ onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    province: '',
    city: '',
    district: '',
    street: '',
    surrounding: '', // optional
    detailAddress: '',
    recipient: '',
    phone: '',
    isDefault: false
  });

  const [errors, setErrors] = useState({
    location: '',
    detailAddress: '',
    recipient: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (name === 'province' || name === 'city' || name === 'district' || name === 'street') {
      if (errors.location) {
        setErrors(prev => ({ ...prev, location: '' }));
      }
    } else if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      location: '',
      detailAddress: '',
      recipient: '',
      phone: ''
    };

    if (!formData.province.trim() || !formData.city.trim() || !formData.district.trim() || !formData.street.trim()) {
      newErrors.location = '请完整填写所在地区信息';
      isValid = false;
    }

    if (!formData.detailAddress.trim()) {
      newErrors.detailAddress = '请输入详细地址';
      isValid = false;
    }

    if (!formData.recipient.trim()) {
      newErrors.recipient = '请输入收件人姓名';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '请输入手机号码';
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '手机号码格式不正确';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="add-address-panel">
      <div className="panel-header">
        <span className="title">选择地址</span>
        <span className="required-tip">（*为必填项）</span>
      </div>

      <div className="form-container">
        <div className="form-item">
          <label className="form-label required">所在地址：</label>
          <div className="input-wrapper location-inputs">
            <input
              type="text"
              name="province"
              value={formData.province}
              onChange={handleInputChange}
              placeholder="请输入省"
              className={`form-input location-input ${errors.location && !formData.province ? 'error' : ''}`}
            />
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="请输入市"
              className={`form-input location-input ${errors.location && !formData.city ? 'error' : ''}`}
            />
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              placeholder="请输入区/县"
              className={`form-input location-input ${errors.location && !formData.district ? 'error' : ''}`}
            />
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              placeholder="请输入乡镇"
              className={`form-input location-input ${errors.location && !formData.street ? 'error' : ''}`}
            />
            <input
              type="text"
              name="surrounding"
              value={formData.surrounding}
              onChange={handleInputChange}
              placeholder="请输入附近区域"
              className="form-input location-input"
            />
            {errors.location && <span className="error-msg">{errors.location}</span>}
          </div>
        </div>

        <div className="form-item">
          <label className="form-label required">详细地址：</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="detailAddress"
              value={formData.detailAddress}
              onChange={handleInputChange}
              className={`form-input large ${errors.detailAddress ? 'error' : ''}`}
            />
            <span className="field-tip">（地址填写规则）</span>
            {errors.detailAddress && <span className="error-msg">{errors.detailAddress}</span>}
          </div>
        </div>

        <div className="form-item">
          <label className="form-label required">收件人：</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="recipient"
              value={formData.recipient}
              onChange={handleInputChange}
              className={`form-input medium ${errors.recipient ? 'error' : ''}`}
            />
            {errors.recipient && <span className="error-msg">{errors.recipient}</span>}
          </div>
        </div>

        <div className="form-item">
          <label className="form-label required">手机号码：</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`form-input medium ${errors.phone ? 'error' : ''}`}
            />
            {errors.phone && <span className="error-msg">{errors.phone}</span>}
          </div>
        </div>

        <div className="form-item checkbox-item">
          <div className="input-wrapper checkbox-wrapper">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleInputChange}
              />
              设为默认地址
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={onCancel}>取消</button>
          <button className="btn-save" onClick={handleSubmit}>保存</button>
        </div>
      </div>
    </div>
  );
};

export default AddAddressPanel;
