import React, { useState } from 'react';
import './TrainItem.css';
import ReserveButton from './ReserveButton';

interface TrainItemProps {
  train: any;
  onReserve: (trainNo: string) => void;
  isLoggedIn: boolean;
}

/**
 * 车次列表项组件
 * 骨架实现：仅包含组件结构，不实现真实逻辑
 */
const TrainItem: React.FC<TrainItemProps> = ({ train, onReserve, isLoggedIn }) => {
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
      <div className="train-item-cell align-left">
        <div className="train-number">{train.trainNo || '--'}</div>
      </div>
      <div className="train-item-cell">
        <div className="train-stations">
          <div className="station-row">
            <span className="station-name">{train.departureStation || '--'}</span>
            <span className="station-arrow">→</span>
            <span className="station-name">{train.arrivalStation || '--'}</span>
          </div>
        </div>
      </div>
      <div className="train-item-cell">
        <div className="train-time">{train.departureTime || '--'}</div>
      </div>
      <div className="train-item-cell">
        <div className="train-time">{train.arrivalTime || '--'}</div>
      </div>
      <div className="train-item-cell">
        <div className="train-duration">{formatDuration(train.duration)}</div>
      </div>
      <div className="train-item-cell">
        <div className={`seat-info ${getSeatClass(availableSeats.business)}`}>
          {formatSeatStatus(availableSeats.business)}
        </div>
      </div>
      <div className="train-item-cell">
        <div className={`seat-info ${getSeatClass(availableSeats.firstClass)}`}>
          {formatSeatStatus(availableSeats.firstClass)}
        </div>
      </div>
      <div className="train-item-cell">
        <div className={`seat-info ${getSeatClass(availableSeats.secondClass)}`}>
          {formatSeatStatus(availableSeats.secondClass)}
        </div>
      </div>
      <div className="train-item-cell">
        <div className={`seat-info ${getSeatClass(availableSeats.softSleeper)}`}>
          {formatSeatStatus(availableSeats.softSleeper)}
        </div>
      </div>
      <div className="train-item-cell">
        <div className={`seat-info ${getSeatClass(availableSeats.hardSleeper)}`}>
          {formatSeatStatus(availableSeats.hardSleeper)}
        </div>
      </div>
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
          queryTimestamp={new Date().toISOString()}
        />
      </div>
    </div>
  );
};

export default TrainItem;

