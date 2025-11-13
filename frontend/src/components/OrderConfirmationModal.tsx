import React, { useState, useEffect } from 'react';
import './OrderConfirmationModal.css';
import TrainInfoDisplay from './TrainInfoDisplay';
import PassengerInfoTable from './PassengerInfoTable';
import SeatAvailabilityDisplay from './SeatAvailabilityDisplay';
import ProcessingModal from './ProcessingModal';
import OrderSuccessModal from './OrderSuccessModal';

interface OrderConfirmationModalProps {
  isVisible: boolean;
  orderId: string;
  onConfirm: () => Promise<void>;
  onBack: () => void;
}

/**
 * 信息核对弹窗组件
 */
const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isVisible,
  orderId,
  onConfirm,
  onBack,
}) => {
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // TODO: 实现获取订单核对信息
  useEffect(() => {
    if (isVisible && orderId) {
      // TODO: 调用API获取订单核对信息
    }
  }, [isVisible, orderId]);
  
  const handleConfirm = async () => {
    setShowProcessingModal(true);
    try {
      await onConfirm();
      setShowProcessingModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      setShowProcessingModal(false);
      setError('订单确认失败，请稍后重试');
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="order-confirmation-modal">
      <div className="modal-overlay" onClick={onBack}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">请核对以下信息</h2>
          <button className="modal-close" onClick={onBack}>×</button>
        </div>
        
        <div className="modal-body">
          {isLoading ? (
            <div className="loading">加载中...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : orderInfo ? (
            <>
              <TrainInfoDisplay trainInfo={orderInfo.trainInfo} />
              <PassengerInfoTable passengers={orderInfo.passengers} />
              <SeatAvailabilityDisplay availableSeats={orderInfo.availableSeats} />
            </>
          ) : (
            <div className="loading">加载订单信息...</div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="back-modal-button" onClick={onBack}>
            返回修改
          </button>
          <button className="confirm-modal-button" onClick={handleConfirm} disabled={isLoading}>
            确认
          </button>
        </div>
      </div>
      
      {showProcessingModal && (
        <ProcessingModal
          isVisible={showProcessingModal}
          message="订单已经提交，系统正在处理中，请稍等"
        />
      )}
      
      {showSuccessModal && (
        <OrderSuccessModal
          isVisible={showSuccessModal}
          orderId={orderId}
          onClose={() => {
            setShowSuccessModal(false);
            // TODO: 跳转到订单详情页或个人中心
          }}
        />
      )}
    </div>
  );
};

export default OrderConfirmationModal;

