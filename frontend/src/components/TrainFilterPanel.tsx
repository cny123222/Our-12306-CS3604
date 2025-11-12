import React, { useState } from 'react';
import './TrainFilterPanel.css';

interface TrainFilterPanelProps {
  onFilterChange: (filters: any) => void;
  departureStations: string[];
  arrivalStations: string[];
  seatTypes: string[];
}

/**
 * 车次信息筛选区域组件
 * 骨架实现：仅包含组件结构，不实现真实逻辑
 */
const TrainFilterPanel: React.FC<TrainFilterPanelProps> = ({
  onFilterChange,
  departureStations,
  arrivalStations,
  seatTypes,
}) => {
  const [selectedTrainTypes, setSelectedTrainTypes] = useState<string[]>(['G', 'C', 'D']);
  const [selectedDepartureStations, setSelectedDepartureStations] = useState<string[]>([]);
  const [selectedArrivalStations, setSelectedArrivalStations] = useState<string[]>([]);
  const [selectedSeatTypes, setSelectedSeatTypes] = useState<string[]>([]);

  // TODO: 实现筛选逻辑
  const handleTrainTypeChange = (type: string) => {
    // TODO: 更新车次类型筛选
  };

  const handleDepartureStationChange = (station: string) => {
    // TODO: 更新出发站筛选
  };

  const handleArrivalStationChange = (station: string) => {
    // TODO: 更新到达站筛选
  };

  const handleSeatTypeChange = (type: string) => {
    // TODO: 更新席别筛选
  };

  return (
    <div className="train-filter-panel">
      <div className="filter-section">
        <h3 className="filter-title">车次类型</h3>
        <div className="filter-options">
          <label className="filter-option">
            <input
              type="checkbox"
              checked={selectedTrainTypes.includes('G') || selectedTrainTypes.includes('C')}
              onChange={() => handleTrainTypeChange('GC')}
            />
            <span>GC-高铁/城际</span>
          </label>
          <label className="filter-option">
            <input
              type="checkbox"
              checked={selectedTrainTypes.includes('D')}
              onChange={() => handleTrainTypeChange('D')}
            />
            <span>D-动车</span>
          </label>
        </div>
      </div>

      {departureStations.length > 0 && (
        <div className="filter-section">
          <h3 className="filter-title">出发车站</h3>
          <div className="filter-options">
            {departureStations.map((station) => (
              <label key={station} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedDepartureStations.includes(station)}
                  onChange={() => handleDepartureStationChange(station)}
                />
                <span>{station}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {arrivalStations.length > 0 && (
        <div className="filter-section">
          <h3 className="filter-title">到达车站</h3>
          <div className="filter-options">
            {arrivalStations.map((station) => (
              <label key={station} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedArrivalStations.includes(station)}
                  onChange={() => handleArrivalStationChange(station)}
                />
                <span>{station}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="filter-section">
        <h3 className="filter-title">车次席别</h3>
        <div className="filter-options">
          {['商务座', '一等座', '二等座', '软卧', '硬卧'].map((type) => (
            <label key={type} className="filter-option">
              <input
                type="checkbox"
                checked={selectedSeatTypes.includes(type)}
                onChange={() => handleSeatTypeChange(type)}
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainFilterPanel;

