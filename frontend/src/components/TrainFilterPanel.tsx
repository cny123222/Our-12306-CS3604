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

  // 实现筛选逻辑
  const handleTrainTypeChange = (type: string) => {
    let newTypes = [...selectedTrainTypes];
    if (type === 'GC') {
      const hasG = newTypes.includes('G');
      const hasC = newTypes.includes('C');
      if (hasG || hasC) {
        newTypes = newTypes.filter(t => t !== 'G' && t !== 'C');
      } else {
        newTypes.push('G', 'C');
      }
    } else if (type === 'D') {
      if (newTypes.includes('D')) {
        newTypes = newTypes.filter(t => t !== 'D');
      } else {
        newTypes.push('D');
      }
    }
    setSelectedTrainTypes(newTypes);
    onFilterChange({
      trainTypes: newTypes,
      departureStations: selectedDepartureStations,
      arrivalStations: selectedArrivalStations,
      seatTypes: selectedSeatTypes,
    });
  };

  const handleDepartureStationChange = (station: string) => {
    let newStations = [...selectedDepartureStations];
    if (newStations.includes(station)) {
      newStations = newStations.filter(s => s !== station);
    } else {
      newStations.push(station);
    }
    setSelectedDepartureStations(newStations);
    onFilterChange({
      trainTypes: selectedTrainTypes,
      departureStations: newStations,
      arrivalStations: selectedArrivalStations,
      seatTypes: selectedSeatTypes,
    });
  };

  const handleArrivalStationChange = (station: string) => {
    let newStations = [...selectedArrivalStations];
    if (newStations.includes(station)) {
      newStations = newStations.filter(s => s !== station);
    } else {
      newStations.push(station);
    }
    setSelectedArrivalStations(newStations);
    onFilterChange({
      trainTypes: selectedTrainTypes,
      departureStations: selectedDepartureStations,
      arrivalStations: newStations,
      seatTypes: selectedSeatTypes,
    });
  };

  const handleSeatTypeChange = (type: string) => {
    let newTypes = [...selectedSeatTypes];
    if (newTypes.includes(type)) {
      newTypes = newTypes.filter(t => t !== type);
    } else {
      newTypes.push(type);
    }
    setSelectedSeatTypes(newTypes);
    onFilterChange({
      trainTypes: selectedTrainTypes,
      departureStations: selectedDepartureStations,
      arrivalStations: selectedArrivalStations,
      seatTypes: newTypes,
    });
  };

  const handleClearFilters = () => {
    setSelectedTrainTypes(['G', 'C', 'D']);
    setSelectedDepartureStations([]);
    setSelectedArrivalStations([]);
    setSelectedSeatTypes([]);
    onFilterChange({
      trainTypes: ['G', 'C', 'D'],
      departureStations: [],
      arrivalStations: [],
      seatTypes: [],
    });
  };

  const hasFilters = 
    selectedDepartureStations.length > 0 || 
    selectedArrivalStations.length > 0 || 
    selectedSeatTypes.length > 0 ||
    selectedTrainTypes.length !== 3;

  return (
    <div className="train-filter-panel">
      <div className="filter-panel-container">
        <div className="filter-group">
          <div className="filter-label">车次类型</div>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="checkbox"
                checked={selectedTrainTypes.includes('G') || selectedTrainTypes.includes('C')}
                onChange={() => handleTrainTypeChange('GC')}
              />
              <span className="filter-option-label">GC-高铁/城际</span>
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={selectedTrainTypes.includes('D')}
                onChange={() => handleTrainTypeChange('D')}
              />
              <span className="filter-option-label">D-动车</span>
            </label>
            <button 
              className="filter-clear-btn" 
              onClick={handleClearFilters}
              disabled={!hasFilters}
            >
              清除筛选
            </button>
          </div>
        </div>

        {departureStations.length > 0 && (
          <div className="filter-group">
            <div className="filter-label">出发车站</div>
            <div className="filter-options">
              {departureStations.map((station) => (
                <label key={station} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedDepartureStations.includes(station)}
                    onChange={() => handleDepartureStationChange(station)}
                  />
                  <span className="filter-option-label">{station}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {arrivalStations.length > 0 && (
          <div className="filter-group">
            <div className="filter-label">到达车站</div>
            <div className="filter-options">
              {arrivalStations.map((station) => (
                <label key={station} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedArrivalStations.includes(station)}
                    onChange={() => handleArrivalStationChange(station)}
                  />
                  <span className="filter-option-label">{station}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="filter-group">
          <div className="filter-label">车次席别</div>
          <div className="filter-options">
            {['商务座', '一等座', '二等座', '软卧', '硬卧'].map((type) => (
              <label key={type} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedSeatTypes.includes(type)}
                  onChange={() => handleSeatTypeChange(type)}
                />
                <span className="filter-option-label">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainFilterPanel;

