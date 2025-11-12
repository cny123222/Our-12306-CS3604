import React, { useState } from 'react';
import './TrainSearchBar.css';
import StationInput from './StationInput';
import DatePicker from './DatePicker';

interface TrainSearchBarProps {
  initialDepartureStation: string;
  initialArrivalStation: string;
  initialDepartureDate: string;
  onSearch: (params: any) => void;
}

/**
 * 车次搜索和查询区域组件
 * 骨架实现：仅包含组件结构，不实现真实逻辑
 */
const TrainSearchBar: React.FC<TrainSearchBarProps> = ({
  initialDepartureStation,
  initialArrivalStation,
  initialDepartureDate,
  onSearch,
}) => {
  const [departureStation, setDepartureStation] = useState(initialDepartureStation);
  const [arrivalStation, setArrivalStation] = useState(initialArrivalStation);
  const [departureDate, setDepartureDate] = useState(initialDepartureDate);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // TODO: 实现查询功能
  const handleSearch = () => {
    // TODO: 验证输入
    // TODO: 调用API查询
    // TODO: 更新车次列表
  };

  return (
    <div className="train-search-bar">
      <div className="search-fields">
        <div className="search-field">
          <StationInput
            value={departureStation}
            placeholder="简拼/全拼/汉字"
            type="departure"
            onChange={setDepartureStation}
            onSelect={setDepartureStation}
          />
          {errors.departureStation && (
            <div className="field-error">{errors.departureStation}</div>
          )}
        </div>
        <div className="search-field">
          <StationInput
            value={arrivalStation}
            placeholder="简拼/全拼/汉字"
            type="arrival"
            onChange={setArrivalStation}
            onSelect={setArrivalStation}
          />
          {errors.arrivalStation && <div className="field-error">{errors.arrivalStation}</div>}
        </div>
        <div className="search-field">
          <DatePicker
            value={departureDate}
            onChange={setDepartureDate}
            minDate={new Date().toISOString().split('T')[0]}
            maxDate=""
          />
        </div>
        <div className="search-field">
          <button className="search-button" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? '查询中...' : '查询'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainSearchBar;

