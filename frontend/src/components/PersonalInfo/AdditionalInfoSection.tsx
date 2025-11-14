// 附加信息模块组件
import React from 'react';
import './AdditionalInfoSection.css';

interface AdditionalInfoSectionProps {
  discountType: string;
  onEdit?: () => void;
}

/**
 * UI-AdditionalInfoSection: 附加信息模块组件
 * 显示优惠(待)类型信息
 */
const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({
  discountType,
  onEdit
}) => {
  return (
    <div className="additional-info-section">
      <div className="section-header">
        <h3 className="section-title">附加信息</h3>
        {onEdit && (
          <button className="edit-button" onClick={onEdit}>
            编辑
          </button>
        )}
      </div>
      <div className="info-content">
        <div className="info-row">
          <span className="info-label">优惠(待)类型：</span>
          <span className="info-value">{discountType}</span>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoSection;

