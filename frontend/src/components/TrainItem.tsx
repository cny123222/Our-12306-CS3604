import React from 'react';
import './TrainItem.css';
import ReserveButton from './ReserveButton';

interface TrainItemProps {
  train: any;
  onReserve: (trainNo: string) => void;
  isLoggedIn: boolean;
  queryTimestamp: string;
}

/**
 * 车次列表项组件
 */
const TrainItem: React.FC<TrainItemProps> = ({ train, onReserve, isLoggedIn, queryTimestamp }) => {
  // 从 train.availableSeats 中提取座位信息，映射中文到英文
  const availableSeats = {
    business: train.availableSeats?.['商务座'] ?? null,
    firstClass: train.availableSeats?.['一等座'] ?? null,
    secondClass: train.availableSeats?.['二等座'] ?? null,
    softSleeper: train.availableSeats?.['软卧'] ?? null,
    hardSleeper: train.availableSeats?.['硬卧'] ?? null,
  };

  const formatSeatStatus = (count: number | null | undefined) => {
    if (count === null || count === undefined) return '--';
    if (count === 0) return '无';
    if (count >= 20) return '有';
    return count.toString();
  };

  const getSeatClass = (count: number | null | undefined) => {
    if (count === null || count === undefined) return 'not-available';
    if (count === 0) return 'sold-out';
    if (count >= 20) return 'available';
    return 'limited';
  };

  // 格式化历时（分钟 -> "X小时Y分"）
  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins}分`;
  };

  return (
    <div className="train-item">
      {/* 车次号 - 带下拉箭头 */}
      <div className="train-item-cell align-left">
        <div className="train-number-container">
          <span className="train-number">{train.trainNo || '--'}</span>
          <svg className="train-dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {/* 可以在这里添加车次类型标签 */}
        <div className="train-badges">
          {train.trainNo?.startsWith('G') && <span className="train-badge">高</span>}
          {train.trainNo?.startsWith('D') && <span className="train-badge">动</span>}
        </div>
      </div>
      
      {/* 出发站/到达站 */}
      <div className="train-item-cell">
        <div className="train-stations-vertical">
          <div className="station-name">{train.departureStation || '--'}</div>
          <div className="station-name">{train.arrivalStation || '--'}</div>
        </div>
      </div>
      
      {/* 出发/到达时间 */}
      <div className="train-item-cell">
        <div className="train-times-vertical">
          <div className="train-time">{train.departureTime || '--'}</div>
          <div className="train-time">{train.arrivalTime || '--'}</div>
        </div>
        <div className="train-arrival-date">
          {train.arrivalDate && train.departureDate && train.arrivalDate !== train.departureDate && (
            <span className="next-day-tag">次日到达</span>
          )}
        </div>
      </div>
      
      {/* 历时 */}
      <div className="train-item-cell">
        <div className="train-duration">{formatDuration(train.duration)}</div>
      </div>
      
      {/* 商务座/特等座 */}
      <div className="train-item-cell">
        <div className={`seat-info ${getSeatClass(availableSeats.business)}`}>
          {formatSeatStatus(availableSeats.business)}
        </div>
      </div>
      
      {/* 一等座 */}
      <div className="train-item-cell">
        <div className={`seat-info ${getSeatClass(availableSeats.firstClass)}`}>
          {formatSeatStatus(availableSeats.firstClass)}
        </div>
      </div>
      
      {/* 二等座/二等包座 */}
      <div className="train-item-cell">
        <div className={`seat-info ${getSeatClass(availableSeats.secondClass)}`}>
          {formatSeatStatus(availableSeats.secondClass)}
        </div>
      </div>
      
      {/* 软卧/动卧/一等卧 */}
      <div className="train-item-cell">
        <div className={`seat-info ${getSeatClass(availableSeats.softSleeper)}`}>
          {formatSeatStatus(availableSeats.softSleeper)}
        </div>
      </div>
      
      {/* 硬卧/动卧/二等卧 */}
      <div className="train-item-cell">
        <div className={`seat-info ${getSeatClass(availableSeats.hardSleeper)}`}>
          {formatSeatStatus(availableSeats.hardSleeper)}
        </div>
      </div>
      
      {/* 硬座 */}
      <div className="train-item-cell">
        <div className="seat-info">--</div>
      </div>
      
      {/* 备注 */}
      <div className="train-item-cell train-reserve-cell">
        <ReserveButton
          trainNo={train.trainNo}
          departureStation={train.departureStation}
          arrivalStation={train.arrivalStation}
          departureDate={train.departureDate}
          departureTime={train.departureTime}
          hasSoldOut={false}
          isLoggedIn={isLoggedIn}
          onReserve={onReserve}
          queryTimestamp={queryTimestamp}
        />
      </div>
    </div>
  );
};

export default TrainItem;

