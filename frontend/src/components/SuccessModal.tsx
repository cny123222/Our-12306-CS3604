/**
 * SuccessModal组件
 * 源文件：frontend/src/components/SuccessModal.tsx
 * 测试文件：frontend/test/components/SuccessModal.test.tsx
 * 
 * 说明：这是代码骨架，仅用于让测试可执行且失败
 */

import React from 'react';

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

