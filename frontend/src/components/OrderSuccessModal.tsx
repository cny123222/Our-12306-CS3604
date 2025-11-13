import React from 'react';
import './OrderSuccessModal.css';

interface OrderSuccessModalProps {
  isVisible: boolean;
  orderId: string;
  onClose: () => void;
}

/**
 * 购买成功提示弹窗组件
 */
const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ isVisible, orderId, onClose }) => {
  if (!isVisible) return null;
  
  return (
    <div className="order-success-modal">
      <div className="success-modal-overlay" onClick={onClose}></div>
      <div className="success-modal-content">
        <div className="success-icon">✓</div>
        <h2 className="success-title">购买成功</h2>
        <p className="success-order-id">订单号：{orderId}</p>
        <button className="success-confirm-button" onClick={onClose}>
          确认
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessModal;

