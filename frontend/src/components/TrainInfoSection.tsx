import React from 'react';
import './TrainInfoSection.css';

interface TrainInfoSectionProps {
  trainInfo: any;
  fareInfo: any;
  availableSeats: any;
}

/**
 * 列车信息区域组件
 */
const TrainInfoSection: React.FC<TrainInfoSectionProps> = ({
  trainInfo,
  fareInfo,
  availableSeats,
}) => {
  // 格式化日期，显示星期
  const formatDate = (date: string) => {
    const d = new Date(date);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[d.getDay()];
    return `${date}（${weekDay}）`;
  };
  
  return (
    <div className="train-info-section">
      <div className="train-info-header">
        <h2 className="section-title">列车信息（以下余票信息仅供参考）</h2>
      </div>
      
      <div className="train-info-content">
        {trainInfo && (
          <div className="train-basic-info">
            <span className="train-date">{formatDate(trainInfo.departureDate)}</span>
            <span className="train-no">{trainInfo.trainNo}次</span>
            <span className="train-station">{trainInfo.departureStation}站</span>
            <span className="train-time">（{trainInfo.departureTime}开）</span>
            <span className="train-separator">—</span>
            <span className="train-station">{trainInfo.arrivalStation}站</span>
            <span className="train-time">（{trainInfo.arrivalTime}到）</span>
          </div>
        )}
        
        {fareInfo && availableSeats && (
          <div className="train-fare-info">
            {Object.keys(fareInfo).map((seatType, index) => {
              const fare = fareInfo[seatType];
              const available = availableSeats[seatType];
              return (
                <div key={seatType} className="fare-item">
                  <span className="seat-type-label">{seatType}</span>
                  <span className="seat-price">（¥{fare.price}.0元）</span>
                  <span className="seat-available">{available !== undefined ? `${available}张票` : '无票'}</span>
                  <span className="seat-discount">{fare.discount ? `${fare.discount}折` : ''}</span>
                  {fare.status && <span className="seat-status">{fare.status}</span>}
                  {index < Object.keys(fareInfo).length - 1 && <span className="fare-separator">—</span>}
                </div>
              );
            })}
          </div>
        )}
        
        <div className="train-info-notice">
          <p className="notice-text">*显示的价格均为实际活动折扣后票价，供您参考。查看公布票价。具体票价以您确认支付时实际购买的铺别票价为准。</p>
        </div>
      </div>
    </div>
  );
};

export default TrainInfoSection;

