import React from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isVisible: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * 确认弹窗组件
 * 骨架实现：仅包含组件结构，不实现真实逻辑
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

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          <div className="modal-message">{message}</div>
        </div>
        <div className="modal-footer">
          <button className="modal-button confirm-button" onClick={onConfirm}>
            {confirmText}
          </button>
          {cancelText && onCancel && (
            <button className="modal-button cancel-button" onClick={onCancel}>
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

