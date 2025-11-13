import React from 'react';
import './ProcessingModal.css';
import LoadingSpinner from './LoadingSpinner';

interface ProcessingModalProps {
  isVisible: boolean;
  message: string;
}

/**
 * 订单处理中弹窗组件
 */
const ProcessingModal: React.FC<ProcessingModalProps> = ({ isVisible, message }) => {
  if (!isVisible) return null;
  
  return (
    <div className="processing-modal">
      <div className="processing-modal-overlay"></div>
      <div className="processing-modal-content">
        <LoadingSpinner isVisible={true} size="large" />
        <p className="processing-message">{message}</p>
      </div>
    </div>
  );
};

export default ProcessingModal;

