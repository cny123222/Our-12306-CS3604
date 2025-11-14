import React, { useState } from 'react';
import './TrainList.css';
import TrainItem from './TrainItem';

interface TrainListProps {
  trains: any[];
  onReserve: (trainNo: string) => void;
  isLoggedIn: boolean;
  queryTimestamp: string;
}

type SortField = 'departureTime' | 'arrivalTime' | 'duration' | null;
type SortOrder = 'asc' | 'desc';

/**
 * 车次列表组件
 */
const TrainList: React.FC<TrainListProps> = ({ trains, onReserve, isLoggedIn, queryTimestamp }) => {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // 处理排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 如果点击相同字段，切换排序顺序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果点击新字段，设置为升序
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // 排序后的车次列表
  const sortedTrains = [...trains].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;
    if (sortField === 'departureTime') {
      comparison = (a.departureTime || '').localeCompare(b.departureTime || '');
    } else if (sortField === 'arrivalTime') {
      comparison = (a.arrivalTime || '').localeCompare(b.arrivalTime || '');
    } else if (sortField === 'duration') {
      comparison = (a.duration || 0) - (b.duration || 0);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // 渲染排序图标
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="sort-icon neutral">▲</span>;
    }
    return sortOrder === 'asc' ? 
      <span className="sort-icon asc">▲</span> : 
      <span className="sort-icon desc">▼</span>;
  };

  return (
    <div className="train-list">
      {/* 查询结果提示信息 */}
      {sortedTrains.length > 0 && (
        <div className="train-list-info">
          <div className="train-list-summary">
            <span className="summary-route">北京北 → 上海 </span>
            <span className="summary-date">(11月13日 周四)</span>
            <span className="summary-count"> 共{sortedTrains.length}个车次</span>
          </div>
          <div className="train-list-hints">
            <label className="hint-checkbox">
              <input type="checkbox" />
              <span>显示已满和停止发售的车次</span>
            </label>
            <label className="hint-checkbox">
              <input type="checkbox" />
              <span>显示分段余票</span>
            </label>
            <label className="hint-checkbox">
              <input type="checkbox" />
              <span>显示全部预订车次</span>
            </label>
          </div>
        </div>
      )}
      
      <div className="train-list-container">
        <div className="train-list-header">
          <div className="train-list-header-cell align-left">车次</div>
          <div className="train-list-header-cell">
            出发站
            <br />
            到达站
          </div>
          <div 
            className="train-list-header-cell sortable"
            onClick={() => handleSort('departureTime')}
          >
            出发时间 {renderSortIcon('departureTime')}
            <br />
            到达时间 {renderSortIcon('arrivalTime')}
          </div>
          <div 
            className="train-list-header-cell sortable"
            onClick={() => handleSort('duration')}
          >
            历时 {renderSortIcon('duration')}
          </div>
          <div className="train-list-header-cell">
            商务座
            <br />
            特等座
          </div>
          <div className="train-list-header-cell">一等座</div>
          <div className="train-list-header-cell">
            二等座
            <br />
            二等包座
          </div>
          <div className="train-list-header-cell">
            软卧/动卧
            <br />
            一等卧
          </div>
          <div className="train-list-header-cell">
            硬卧/动卧
            <br />
            二等卧
          </div>
          <div className="train-list-header-cell">硬座</div>
          <div className="train-list-header-cell">备注</div>
        </div>
        {sortedTrains.length === 0 ? (
          <div className="train-list-empty">
            <div className="train-list-empty-icon">🚄</div>
            <div className="train-list-empty-text">暂无符合条件的车次</div>
            <div className="train-list-empty-hint">请尝试修改筛选条件或查询日期</div>
          </div>
        ) : (
          <div className="train-list-body">
            {sortedTrains.map((train) => (
              <TrainItem
                key={train.trainNo}
                train={train}
                onReserve={onReserve}
                isLoggedIn={isLoggedIn}
                queryTimestamp={queryTimestamp}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainList;

