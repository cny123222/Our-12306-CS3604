import React from 'react';
import './OrderSubmitSection.css';

interface OrderSubmitSectionProps {
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

/**
 * 订单提交与温馨提示区域组件
 */
const OrderSubmitSection: React.FC<OrderSubmitSectionProps> = ({
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  return (
    <div className="order-submit-section">
      <div className="submit-notice">
        <p className="notice-text">
          提交订单表示阅读并同意《中国集团铁路旅客运输规程》《服务条款》
        </p>
      </div>
      
      <div className="submit-buttons">
        <button
          className="back-button"
          onClick={onBack}
          disabled={isSubmitting}
        >
          上一步
        </button>
        <button
          className="submit-button"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '提交中...' : '提交订单'}
        </button>
      </div>
    </div>
  );
};

export default OrderSubmitSection;

