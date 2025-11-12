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
  const [availableSeats, setAvailableSeats] = useState<any>({});

  // TODO: 实现余票信息获取
  // TODO: 根据余票数量显示不同状态

  const formatSeatStatus = (count: number | null) => {
    if (count === null) return '--';
    if (count === 0) return '无';
    if (count >= 20) return '有';
    return count.toString();
  };

  const getSeatClass = (count: number | null) => {
    if (count === null) return 'seat-unavailable';
    if (count === 0) return 'seat-soldout';
    if (count >= 20) return 'seat-available';
    return 'seat-limited';
  };

  return (
    <div className="train-item">
      <div className="item-cell">{train.trainNo || '--'}</div>
      <div className="item-cell">
        {train.departureStation || '--'} / {train.arrivalStation || '--'}
      </div>
      <div className="item-cell">{train.departureTime || '--'}</div>
      <div className="item-cell">{train.arrivalTime || '--'}</div>
      <div className="item-cell">{train.duration || '--'}</div>
      <div className={`item-cell ${getSeatClass(availableSeats.business)}`}>
        {formatSeatStatus(availableSeats.business)}
      </div>
      <div className={`item-cell ${getSeatClass(availableSeats.firstClass)}`}>
        {formatSeatStatus(availableSeats.firstClass)}
      </div>
      <div className={`item-cell ${getSeatClass(availableSeats.secondClass)}`}>
        {formatSeatStatus(availableSeats.secondClass)}
      </div>
      <div className={`item-cell ${getSeatClass(availableSeats.softSleeper)}`}>
        {formatSeatStatus(availableSeats.softSleeper)}
      </div>
      <div className={`item-cell ${getSeatClass(availableSeats.hardSleeper)}`}>
        {formatSeatStatus(availableSeats.hardSleeper)}
      </div>
      <div className="item-cell">
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

