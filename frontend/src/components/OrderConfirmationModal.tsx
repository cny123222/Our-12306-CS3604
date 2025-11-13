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
  orderInfo?: any;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  onSuccess?: () => void; // 购买成功后的回调，通常是返回首页
}

/**
 * 信息核对弹窗组件
 */
const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isVisible,
  orderId,
  orderInfo: externalOrderInfo,
  onConfirm,
  onBack,
  onSuccess,
}) => {
  const [orderInfo, setOrderInfo] = useState<any>(externalOrderInfo || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // 获取订单核对信息
  useEffect(() => {
    const fetchOrderConfirmation = async () => {
      if (!isVisible || !orderId) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
        if (!token) {
          setError('请先登录');
          return;
        }
        
        // 调用API获取订单核对信息
        const response = await fetch(`/api/orders/${orderId}/confirmation`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '获取订单信息失败');
        }
        
        const data = await response.json();
        setOrderInfo(data);
      } catch (error: any) {
        setError(error.message || '获取订单信息失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderConfirmation();
  }, [isVisible, orderId]);
  
  const [confirmResult, setConfirmResult] = React.useState<any>(null);
  
  const handleConfirm = async () => {
    setShowProcessingModal(true);
    setError('');
    
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        setError('请先登录');
        setShowProcessingModal(false);
        return;
      }
      
      // 调用确认订单API
      const response = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '确认订单失败');
      }
      
      const result = await response.json();
      setConfirmResult(result);
      
      // 关闭处理中弹窗，显示成功弹窗
      setShowProcessingModal(false);
      setShowSuccessModal(true);
      
      // 调用父组件的onConfirm回调（如果有）
      if (onConfirm) {
        await onConfirm();
      }
    } catch (error: any) {
      setShowProcessingModal(false);
      setError(error.message || '订单确认失败，请稍后重试');
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="order-confirmation-modal">
      <div className="modal-overlay" onClick={onBack}></div>
      <div className="modal-content">
        <div className="modal-header blue-background">
          <h2 className="modal-title">请核对以下信息</h2>
          <button className="modal-close" onClick={onBack}>×</button>
        </div>
        
        <div className="modal-body white-background">
          {isLoading ? (
            <div className="loading">加载中...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : orderInfo ? (
            <>
              <TrainInfoDisplay trainInfo={orderInfo.trainInfo} />
              
              {orderInfo.passengers && orderInfo.passengers.length > 0 ? (
                <>
                  <div className="confirmation-table-container">
                    <table className="confirmation-passenger-table">
                      <thead>
                        <tr>
                          <th>序号</th>
                          <th>席别</th>
                          <th>票种</th>
                          <th>姓名</th>
                          <th>证件类型</th>
                          <th>证件号码</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderInfo.passengers.map((passenger: any, index: number) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{passenger.seatType || '二等座'}</td>
                            <td>{passenger.ticketType || '成人票'}</td>
                            <td>
                              {passenger.name}
                              {passenger.points && (
                                <span className="passenger-points">积分*{passenger.points}</span>
                              )}
                            </td>
                            <td>{passenger.idCardType || '居民身份证'}</td>
                            <td>{passenger.idCardNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="seat-allocation-notice">
                    系统将随机为您申请席位，暂不支持自选席位。
                  </div>
                </>
              ) : (
                <div className="empty-passengers">暂无乘客信息</div>
              )}
              
              {orderInfo.availableSeats && Object.keys(orderInfo.availableSeats).length > 0 ? (
                <SeatAvailabilityDisplay availableSeats={orderInfo.availableSeats} />
              ) : (
                <div className="empty-seats">暂无余票信息</div>
              )}
            </>
          ) : (
            <div className="loading">加载订单信息...</div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="back-modal-button white-background gray-text" onClick={onBack}>
            返回修改
          </button>
          <button className="confirm-modal-button orange-background white-text" onClick={handleConfirm} disabled={isLoading}>
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
          trainInfo={confirmResult?.trainInfo}
          tickets={confirmResult?.tickets}
          onClose={() => {
            setShowSuccessModal(false);
            // 调用成功回调，通常是返回首页
            if (onSuccess) {
              onSuccess();
            } else {
              onBack();
            }
          }}
        />
      )}
    </div>
  );
};

export default OrderConfirmationModal;

