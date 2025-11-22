import React from 'react';
import './SuccessOrderInfo.css';

interface Passenger {
  sequence: number;
  name: string;
  idCardType: string;
  idCardNumber: string;
  ticketType: string;
  seatType: string;
  carNumber?: string;
  seatNumber?: string;
  price: number;
}

interface TrainInfo {
  trainNo: string;
  departureStation: string;
  arrivalStation: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
}

interface SuccessOrderInfoProps {
  trainInfo: TrainInfo;
  passengers: Passenger[];
  totalPrice: number;
  onFoodClick: () => void;
  onContinuePurchase: () => void;
  onViewDetails: () => void;
}

/**
 * 购票成功页专用订单信息组件
 */
const SuccessOrderInfo: React.FC<SuccessOrderInfoProps> = ({
  trainInfo,
  passengers,
  totalPrice,
  onFoodClick,
  onContinuePurchase,
  onViewDetails
}) => {
  // 温馨提示和二维码区域
  const renderWarmTipsWithQRCodes = () => {
    return (
      <div className="success-order-warm-tips-container">
        <div className="success-order-warm-tips-content">
          <h3 className="success-order-tips-title">温馨提示：</h3>
          <ol className="success-order-tips-list">
            <li className="success-order-tip-item">请在指定时间内完成网上支付。</li>
            <li className="success-order-tip-item">逾期未支付，系统将取消本次交易。</li>
            <li className="success-order-tip-item">在完成支付或取消本订单之前，您将无法购买其他车票。</li>
            <li className="success-order-tip-item">
              退票政策收获现：<a href="#" onClick={(e) => e.preventDefault()}>退改说明</a>
            </li>
            <li className="success-order-tip-item">购买铁路乘意险保障您的出行安全，提供意外伤害身故伤残、意外伤害医疗费用、意外伤害住院津贴、突发急性病身故保障，同时保障您和随行被监护人因意疏忽过失造成第三人身伤亡和财产损失依法应由您承担的直接经济赔偿责任，详见保险条款</li>
            <li className="success-order-tip-item">
              请充分理解保险责任、责任免除、保险期间、合同解除等约定，详见保险条款，凭保单号或保单查询号登录<a href="#" onClick={(e) => e.preventDefault()}>www.china-ric.com</a> 查看电子保单或下载电子发票。
            </li>
            <li className="success-order-tip-item">如因运力原因或其他不可控因素致列车调度调整时，当前车型可能会发生变动。</li>
            <li className="success-order-tip-item">跨境旅客旅行须知详见跨境旅客相关运输组织规则和车站公告。</li>
            <li className="success-order-tip-item">未尽事宜详见《国铁集团铁路旅客运输规程》等有关规定和车站公告。</li>
          </ol>
        </div>
        
        {/* 二维码在温馨提示框内的右侧 */}
        <div className="success-order-qr-codes-inline">
          <div className="success-order-qr-item-inline">
            <img 
              src="/images/微信二维码.png" 
              alt="微信二维码"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <p className="success-order-qr-text-inline">使用微信扫一扫，可通过微信接收12306行程通知</p>
          </div>
          <div className="success-order-qr-item-inline">
            <img 
              src="/images/支付宝二维码.png" 
              alt="支付宝二维码"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <p className="success-order-qr-text-inline">使用支付宝扫一扫，可通过支付宝通知提醒接收12306行程通知</p>
          </div>
        </div>
      </div>
    );
  };
  // 格式化日期显示
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} （${weekday}）`;
  };

  // 格式化身份证号码（中间打码）
  const maskIdCard = (idCard: string): string => {
    if (!idCard || idCard.length < 8) return idCard;
    const start = idCard.substring(0, 4);
    const end = idCard.substring(idCard.length - 3);
    const middle = '*'.repeat(idCard.length - 7);
    return `${start}${middle}${end}`;
  };

  // 格式化座位号显示
  const formatSeatDisplay = (seatNumber?: string): string => {
    if (seatNumber) {
      // 如果包含 "-"，提取座位号部分（如 "4-01" -> "01"）
      const parts = seatNumber.split('-');
      const seatPart = parts.length > 1 ? parts[1] : seatNumber;
      return `${seatPart}号`;
    }
    return '';
  };

  return (
    <div className="success-order-info-container">
      <div className="success-order-info-display">
        {/* 订单信息标题 */}
        <div className="success-order-info-header">
          订单信息
        </div>

        <div className="success-order-info-content">
          {/* 车次信息行 */}
          <div className="success-train-info-row">
            <span className="success-train-date">{formatDate(trainInfo.departureDate)}</span>
            <span className="success-train-info-group">
              <span className="success-train-no">{trainInfo.trainNo}</span>
              <span className="success-train-text">次</span>
            </span>
            <span className="success-train-info-group">
              <span className="success-train-station">{trainInfo.departureStation}</span>
              <span className="success-train-text">站</span>
              <span className="success-train-bold-group">（{trainInfo.departureTime} 开）—{trainInfo.arrivalStation}</span>
              <span className="success-train-text">站（{trainInfo.arrivalTime} 到）</span>
            </span>
          </div>

          {/* 乘车人信息表格 */}
          <div className="success-passenger-table-container">
            <table className="success-passenger-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>姓名</th>
                  <th>证件类型</th>
                  <th>证件号码</th>
                  <th>票种</th>
                  <th>席别</th>
                  <th>车厢</th>
                  <th>席位号</th>
                  <th>票价（元）</th>
                  <th>订单状态</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((passenger, index) => (
                  <tr key={index}>
                    <td>{passenger.sequence}</td>
                    <td>{passenger.name}</td>
                    <td>{passenger.idCardType}</td>
                    <td>{maskIdCard(passenger.idCardNumber)}</td>
                    <td>{passenger.ticketType}</td>
                    <td>{passenger.seatType}</td>
                    <td>{passenger.carNumber ? `${String(passenger.carNumber).padStart(2, '0')}` : ''}</td>
                    <td>{formatSeatDisplay(passenger.seatNumber)}</td>
                    <td>{passenger.price.toFixed(1)}元</td>
                    <td><span className="status-paid">已支付</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 操作按钮 */}
          <div className="success-order-actions">
            <button
              className="success-order-button food-button"
              onClick={onFoodClick}
            >
              餐饮·特产
            </button>
            <button
              className="success-order-button continue-button"
              onClick={onContinuePurchase}
            >
              继续购票
            </button>
            <button
              className="success-order-button view-details-button"
              onClick={onViewDetails}
            >
              查询订单详情
            </button>
          </div>

          {/* 温馨提示和二维码区域（二维码在温馨提示框内） */}
          {renderWarmTipsWithQRCodes()}

          {/* 广告区域 */}
          <div className="success-order-advertisement">
            <img 
              src="/images/广告.png" 
              alt="广告"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessOrderInfo;

