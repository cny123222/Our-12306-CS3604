import React from 'react';
import './TrainInfoDisplay.css';

interface TrainInfoDisplayProps {
  trainInfo: any;
}

/**
 * 车次信息展示组件（用于信息核对弹窗）
 */
const TrainInfoDisplay: React.FC<TrainInfoDisplayProps> = ({ trainInfo }) => {
  if (!trainInfo) return null;
  
  // 实现日期格式化（包含星期）
  const formatDate = (date: string, dayOfWeek?: string) => {
    if (dayOfWeek) {
      return `${date}（${dayOfWeek}）`;
    }
    const d = new Date(date);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[d.getDay()];
    return `${date}（${weekDay}）`;
  };
  
  return (
    <div className="train-info-display">
      <div className="train-info-text">
        <span className="train-date bold">{formatDate(trainInfo.departureDate, trainInfo.dayOfWeek)}</span>
        {' '}
        <span className="train-no bold">{trainInfo.trainNo}次</span>
        {' '}
        <span className="train-station">{trainInfo.departureStation}站</span>
        <span className="train-time bold">（{trainInfo.departureTime}开）</span>
        <span className="train-arrow">—</span>
        <span className="train-station">{trainInfo.arrivalStation}站</span>
        <span className="train-time">（{trainInfo.arrivalTime}到）</span>
      </div>
    </div>
  );
};

export default TrainInfoDisplay;

