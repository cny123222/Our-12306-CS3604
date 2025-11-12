import React from 'react';
import './TrainList.css';
import TrainItem from './TrainItem';

interface TrainListProps {
  trains: any[];
  onReserve: (trainNo: string) => void;
  isLoggedIn: boolean;
}

/**
 * 车次列表组件
 * 骨架实现：仅包含组件结构，不实现真实逻辑
 */
const TrainList: React.FC<TrainListProps> = ({ trains, onReserve, isLoggedIn }) => {
  if (trains.length === 0) {
    return (
      <div className="train-list">
        <div className="empty-message">暂无符合条件的车次</div>
      </div>
    );
  }

  return (
    <div className="train-list">
      <div className="train-list-header">
        <div className="header-cell">车次</div>
        <div className="header-cell">出发站/到达站</div>
        <div className="header-cell">出发时间</div>
        <div className="header-cell">到达时间</div>
        <div className="header-cell">历时</div>
        <div className="header-cell">商务座</div>
        <div className="header-cell">一等座</div>
        <div className="header-cell">二等座</div>
        <div className="header-cell">软卧</div>
        <div className="header-cell">硬卧</div>
        <div className="header-cell">操作</div>
      </div>
      <div className="train-list-body">
        {trains.map((train) => (
          <TrainItem
            key={train.trainNo}
            train={train}
            onReserve={onReserve}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>
    </div>
  );
};

export default TrainList;

