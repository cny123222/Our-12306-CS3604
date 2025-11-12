import React, { useState } from 'react';
import './TrainSearchForm.css';
import StationInput from './StationInput';
import DatePicker from './DatePicker';

interface TrainSearchFormProps {
  onNavigateToTrainList: (params: any) => void;
}

/**
 * 车票查询表单组件
 * 骨架实现：仅包含组件结构，不实现真实逻辑
 */
const TrainSearchForm: React.FC<TrainSearchFormProps> = ({ onNavigateToTrainList }) => {
  const [departureStation, setDepartureStation] = useState('');
  const [arrivalStation, setArrivalStation] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHighSpeed, setIsHighSpeed] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // TODO: 实现交换出发地和到达地
  const handleSwapStations = () => {
    // TODO: 交换逻辑
  };

  // TODO: 实现查询功能
  const handleSearch = () => {
    // TODO: 验证输入
    // TODO: 调用API查询
    // TODO: 跳转到车次列表页
  };

  return (
    <div className="train-search-form">
      <div className="search-form-container">
        <div className="form-row">
          <StationInput
            value={departureStation}
            placeholder="出发地"
            type="departure"
            onChange={setDepartureStation}
            onSelect={setDepartureStation}
          />
        </div>
        <div className="form-row">
          <button className="swap-button" onClick={handleSwapStations} aria-label="交换出发地和到达地">
            ⇅
          </button>
        </div>
        <div className="form-row">
          <StationInput
            value={arrivalStation}
            placeholder="到达地"
            type="arrival"
            onChange={setArrivalStation}
            onSelect={setArrivalStation}
          />
        </div>
        <div className="form-row">
          <DatePicker
            value={departureDate}
            onChange={setDepartureDate}
            minDate={new Date().toISOString().split('T')[0]}
            maxDate=""
          />
        </div>
        <div className="form-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isHighSpeed}
              onChange={(e) => setIsHighSpeed(e.target.checked)}
            />
            <span>高铁/动车</span>
          </label>
        </div>
        <div className="form-row">
          <button className="search-button" onClick={handleSearch}>
            查询
          </button>
        </div>
        {errors.general && <div className="error-message">{errors.general}</div>}
      </div>
    </div>
  );
};

export default TrainSearchForm;

