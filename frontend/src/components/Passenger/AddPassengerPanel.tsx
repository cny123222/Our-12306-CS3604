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
        idCardType: idCardType,
        name,
        idCardNumber: idCardNumber,
        phone,
        discountType: discountType
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-passenger-panel">
      <div className="passenger-form-container">
        {/* 基本信息 */}
        <div className="passenger-section">
          <h3 className="passenger-section-title">基本信息</h3>

          <div className="passenger-form-row">
            <div className="passenger-label-wrapper">
              <label className="passenger-label">
                <span className="passenger-required">*</span> 证件类型：
              </label>
            </div>
            <div className="passenger-input-container">
              <SelectDropdown
                options={idCardTypes}
                value={idCardType}
                onChange={setIdCardType}
                placeholder="请选择证件类型"
              />
            </div>
          </div>

          <div className="passenger-form-row">
            <div className="passenger-label-wrapper">
              <label className="passenger-label">
                <span className="passenger-required">*</span> 姓名：
              </label>
            </div>
            <div className="passenger-input-container">
              <div className="passenger-input-wrapper">
                <input
                  type="text"
                  className={`passenger-input ${errors.name ? 'passenger-input-error' : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入姓名"
                />
                <span className="passenger-hint">姓名填写规则（用于身份核验）</span>
              </div>
              {errors.name && <div className="passenger-error-message">{errors.name}</div>}
            </div>
          </div>

          <div className="passenger-form-row">
            <div className="passenger-label-wrapper">
              <label className="passenger-label">
                <span className="passenger-required">*</span> 证件号码：
              </label>
            </div>
            <div className="passenger-input-container">
              <div className="passenger-input-wrapper">
                <input
                  type="text"
                  className={`passenger-input ${errors.idCardNumber ? 'passenger-input-error' : ''}`}
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  placeholder="请填写证件号码"
                />
                <span className="passenger-hint">用于身份核验，请正确填写。</span>
              </div>
              {errors.idCardNumber && (
                <div className="passenger-error-message">{errors.idCardNumber}</div>
              )}
            </div>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="passenger-section">
          <h3 className="passenger-section-title">
            联系方式<span className="passenger-section-subtitle">（请提供乘车人真实有效的联系方式）</span>
          </h3>

          <div className="passenger-form-row">
            <div className="passenger-label-wrapper">
              <label className="passenger-label">手机号码：</label>
            </div>
            <div className="passenger-input-container">
              <div className="passenger-input-wrapper">
                <div className="passenger-phone-group">
                  <SelectDropdown
                    options={['+86']}
                    value="+86"
                    onChange={() => {}}
                    placeholder="+86"
                  />
                  <input
                    type="text"
                    className={`passenger-input passenger-phone-input ${errors.phone ? 'passenger-input-error' : ''}`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请填写手机号码"
                    maxLength={11}
                  />
                </div>
              </div>
              {errors.phone && <div className="passenger-error-message">{errors.phone}</div>}
              <div className="passenger-hint passenger-hint-block">
                请您填写乘车人真实有效的联系方式，以便接收铁路部门推送的重要服务信息，以及在紧急特殊情况下的联系。
              </div>
            </div>
          </div>
        </div>

        {/* 附加信息 */}
        <div className="passenger-section">
          <h3 className="passenger-section-title">附加信息</h3>

          <div className="passenger-form-row">
            <div className="passenger-label-wrapper">
              <label className="passenger-label">
                <span className="passenger-required">*</span> 优惠(待)类型：
              </label>
            </div>
            <div className="passenger-input-container">
              <SelectDropdown
                options={discountTypes}
                value={discountType}
                onChange={setDiscountType}
                placeholder="请选择优惠类型"
              />
            </div>
          </div>
        </div>

        {/* 按钮组 */}
        <div className="passenger-button-group">
          <button className="passenger-button passenger-button-cancel" onClick={onCancel}>
            取消
          </button>
          <button 
            className="passenger-button passenger-button-submit" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPassengerPanel;

