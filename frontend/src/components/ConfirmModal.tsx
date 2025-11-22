import React from 'react';
import ReactDOM from 'react-dom';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 确认弹窗组件
 * 使用 React Portal 渲染到 body，避免被父元素样式限制
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isVisible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) => {
  if (!isVisible) return null;

  const modalContent = (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h3 className="confirm-modal-title">{title}</h3>
        </div>
        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
        </div>
        <div className="confirm-modal-footer">
          <button className="confirm-modal-button confirm-modal-confirm-button" onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="confirm-modal-button confirm-modal-cancel-button" onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ConfirmModal;

