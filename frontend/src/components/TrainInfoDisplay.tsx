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
  
  // TODO: 实现日期格式化（包含星期）
  const formatDate = (date: string) => {
    // 临时实现
    return date;
  };
  
  return (
    <div className="train-info-display">
      <div className="train-info-text">
        <span className="train-date">{formatDate(trainInfo.departureDate)}</span>
        <span className="train-no">{trainInfo.trainNo}次</span>
        <span className="train-station">{trainInfo.departureStation}站</span>
        <span className="train-time">（{trainInfo.departureTime}开）</span>
        <span className="train-arrow">—</span>
        <span className="train-station">{trainInfo.arrivalStation}站</span>
        <span className="train-time">（{trainInfo.arrivalTime}到）</span>
      </div>
    </div>
  );
};

export default TrainInfoDisplay;

