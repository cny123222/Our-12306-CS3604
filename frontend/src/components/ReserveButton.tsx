import React, { useState } from 'react';
import './ReserveButton.css';
import ConfirmModal from './ConfirmModal';

interface ReserveButtonProps {
  trainNo: string;
  departureStation: string;
  arrivalStation: string;
  departureDate: string;
  departureTime: string;
  hasSoldOut: boolean;
  isLoggedIn: boolean;
  onReserve: (trainNo: string) => void;
  queryTimestamp: string;
}

/**
 * 预订按钮组件
 * 骨架实现：仅包含组件结构，不实现真实逻辑
 */
const ReserveButton: React.FC<ReserveButtonProps> = ({
  trainNo,
  departureStation,
  arrivalStation,
  departureDate,
  departureTime,
  hasSoldOut,
  isLoggedIn,
  onReserve,
  queryTimestamp,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>({});

  // TODO: 实现预订逻辑
  const handleClick = () => {
    // TODO: 检查用户登录状态
    // TODO: 检查距离发车时间
    // TODO: 检查查询时间是否超过5分钟
    // TODO: 调用预订API
  };

  return (
    <>
      <button
        className={`reserve-button ${hasSoldOut ? 'soldout' : ''}`}
        onClick={handleClick}
        disabled={hasSoldOut || isLoading}
      >
        {isLoading ? '处理中...' : '预订'}
      </button>
      {showConfirmModal && (
        <ConfirmModal
          isVisible={showConfirmModal}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          cancelText={modalConfig.cancelText}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </>
  );
};

export default ReserveButton;

