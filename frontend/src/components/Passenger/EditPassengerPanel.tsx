// 编辑乘车人面板组件
import React, { useState } from 'react';
import './EditPassengerPanel.css';

interface EditPassengerPanelProps {
  passenger: any;
  onSubmit: (passengerData: any) => void;
  onCancel: () => void;
}

const EditPassengerPanel: React.FC<EditPassengerPanelProps> = ({
  passenger,
  onSubmit,
  onCancel
}) => {
  const [phone, setPhone] = useState(passenger.phone || '');
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (value: string) => {
    if (!value) return '手机号码不能为空';
    if (value.length !== 11 || !/^\d{11}$/.test(value)) {
      return '手机号码应为11位数字';
    }
    return '';
  };

  const handleSubmit = async () => {
    const phoneError = validatePhone(phone);

    if (phoneError) {
      setErrors({ phone: phoneError });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({ phone });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-passenger-panel">
      <h3 className="panel-title">编辑乘车人</h3>

      <div className="form-section">
        <h4 className="section-title">基本信息</h4>

        <div className="info-row">
          <label className="info-label">姓名：</label>
          <span className="info-value">{passenger.name}</span>
        </div>

        <div className="info-row">
          <label className="info-label">国家/地区：</label>
          <span className="info-value">中国China</span>
        </div>

        <div className="info-row">
          <label className="info-label">证件类型：</label>
          <span className="info-value">{passenger.idCardType || passenger.id_card_type}</span>
        </div>

        <div className="info-row">
          <label className="info-label">证件号码：</label>
          <span className="info-value">{passenger.idCardNumber || passenger.id_card_number}</span>
        </div>

        <div className="info-row">
          <label className="info-label">核验状态：</label>
          <span className="info-value verification">已通过</span>
        </div>

        <div className="info-row">
          <label className="info-label">添加日期：</label>
          <span className="info-value">
            {passenger.created_at || new Date().toISOString().split('T')[0]}
          </span>
        </div>
      </div>

      <div className="form-section">
        <h4 className="section-title">联系方式</h4>

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
          {errors.phone && <div className="error-message">{errors.phone}</div>}
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

export default EditPassengerPanel;

