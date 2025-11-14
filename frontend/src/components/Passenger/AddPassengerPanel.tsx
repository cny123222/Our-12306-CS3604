// 添加乘车人面板组件
import React, { useState } from 'react';
import SelectDropdown from '../SelectDropdown';
import './AddPassengerPanel.css';

interface AddPassengerPanelProps {
  onSubmit: (passengerData: any) => void;
  onCancel: () => void;
}

const AddPassengerPanel: React.FC<AddPassengerPanelProps> = ({
  onSubmit,
  onCancel
}) => {
  const [idCardType, setIdCardType] = useState('居民身份证');
  const [name, setName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [discountType, setDiscountType] = useState('成人');
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const idCardTypes = [
    '居民身份证',
    '港澳居民来往内地通行证',
    '台湾居民来往大陆通行证',
    '护照'
  ];

  const discountTypes = ['成人', '儿童', '学生', '残军'];

  const validateName = (value: string) => {
    if (!value) return '姓名不能为空';
    if (value.length < 2 || value.length > 30) return '姓名长度应在2-30个字符之间';
    return '';
  };

  const validateIdCard = (value: string) => {
    if (!value) return '证件号码不能为空';
    if (idCardType === '居民身份证' && value.length !== 18) {
      return '居民身份证号码应为18位';
    }
    return '';
  };

  const validatePhone = (value: string) => {
    if (!value) return '手机号码不能为空';
    if (value.length !== 11 || !/^\d{11}$/.test(value)) {
      return '手机号码应为11位数字';
    }
    return '';
  };

  const handleSubmit = async () => {
    const nameError = validateName(name);
    const idCardError = validateIdCard(idCardNumber);
    const phoneError = validatePhone(phone);

    if (nameError || idCardError || phoneError) {
      setErrors({
        name: nameError,
        idCardNumber: idCardError,
        phone: phoneError
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        id_card_type: idCardType,
        name,
        id_card_number: idCardNumber,
        phone,
        discount_type: discountType
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-passenger-panel">
      <h3 className="panel-title">添加乘车人</h3>

      <div className="form-section">
        <h4 className="section-title">基本信息</h4>
        
        <div className="form-row">
          <label className="form-label">
            <span className="required">*</span> 证件类型：
          </label>
          <SelectDropdown
            options={idCardTypes}
            value={idCardType}
            onChange={setIdCardType}
            placeholder="请选择证件类型"
          />
        </div>

        <div className="form-row">
          <label className="form-label">
            <span className="required">*</span> 姓名：
          </label>
          <div className="input-wrapper">
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入姓名"
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
            <div className="input-hint">姓名填写规则（用于身份核验）</div>
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">
            <span className="required">*</span> 证件号码：
          </label>
          <div className="input-wrapper">
            <input
              type="text"
              className="form-input"
              value={idCardNumber}
              onChange={(e) => setIdCardNumber(e.target.value)}
              placeholder="请填写证件号码"
            />
            {errors.idCardNumber && (
              <div className="error-message">{errors.idCardNumber}</div>
            )}
            <div className="input-hint">用于身份核验，请正确填写。</div>
          </div>
        </div>

        <h4 className="section-title">联系方式（请提供乘车人真实有效的联系方式）</h4>

        <div className="form-row">
          <label className="form-label">手机号码：</label>
          <div className="phone-input-group">
            <select className="country-code">
              <option>+86</option>
            </select>
            <input
              type="text"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请填写手机号码"
              maxLength={11}
            />
          </div>
          {errors.phone && <div className="error-message phone-error">{errors.phone}</div>}
          <div className="input-hint hint-orange">
            请您填写乘车人真实有效的联系方式，以便接收铁路部门推送的重要服务信息，以及在紧急特殊情况下的联系。
          </div>
        </div>

        <h4 className="section-title">附加信息</h4>

        <div className="form-row">
          <label className="form-label">
            <span className="required">*</span> 优惠(待)类型：
          </label>
          <SelectDropdown
            options={discountTypes}
            value={discountType}
            onChange={setDiscountType}
            placeholder="请选择优惠类型"
          />
        </div>
      </div>

      <div className="button-group">
        <button className="cancel-button" onClick={onCancel}>
          取消
        </button>
        <button 
          className="save-button" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
};

export default AddPassengerPanel;

