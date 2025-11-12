/**
 * SuccessModal组件
 * 源文件：frontend/src/components/SuccessModal.tsx
 * 测试文件：frontend/test/components/SuccessModal.test.tsx
 * 
 * 说明：注册成功弹窗组件
 */

import React from 'react';
import './SuccessModal.css';

interface SuccessModalProps {
  isVisible: boolean;
  message: string;
  onConfirm: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isVisible,
  message,
  onConfirm
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div 
        data-testid="modal-overlay" 
        className="overlay"
        onClick={(e) => e.stopPropagation()}
      >
      </div>
      <div 
        data-testid="success-modal"
        role="dialog"
        className="modal-30-percent centered fade-in"
      >
        <div className="modal-content">
          <p>{message}</p>
          <button onClick={onConfirm}>确认</button>
        </div>
      </div>
    </>
  );
};

export default SuccessModal;

