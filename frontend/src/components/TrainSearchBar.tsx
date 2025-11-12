import React, { useState } from 'react';
import './TrainSearchBar.css';
import StationInput from './StationInput';
import DatePicker from './DatePicker';
import { searchTrains } from '../services/trainService';

interface TrainSearchBarProps {
  initialDepartureStation: string;
  initialArrivalStation: string;
  initialDepartureDate: string;
  onSearch: (params: any) => void;
}

/**
 * 车次搜索和查询区域组件
 */
const TrainSearchBar: React.FC<TrainSearchBarProps> = ({
  initialDepartureStation,
  initialArrivalStation,
  initialDepartureDate,
  onSearch,
}) => {
  const [departureStation, setDepartureStation] = useState(initialDepartureStation);
  const [arrivalStation, setArrivalStation] = useState(initialArrivalStation);
  // 如果没有提供初始日期，使用当前日期
  const [departureDate, setDepartureDate] = useState(
    initialDepartureDate || new Date().toISOString().split('T')[0]
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // 实现查询功能
  const handleSearch = async () => {
    const newErrors: { [key: string]: string } = {};

    // 验证输入
    if (!departureStation || departureStation.trim() === '') {
      newErrors.departureStation = '请输入出发地';
      setErrors(newErrors);
      return;
    }

    if (!arrivalStation || arrivalStation.trim() === '') {
      newErrors.arrivalStation = '请输入到达地';
      setErrors(newErrors);
      return;
    }

    // 清除之前的错误
    setErrors({});
    setIsLoading(true);

    try {
      // 调用车次搜索API
      const result = await searchTrains(
        departureStation,
        arrivalStation,
        departureDate
      );

      if (!result.success) {
        throw new Error(result.error || '查询失败');
      }

      // API调用成功，通过回调传递搜索参数
      onSearch({
        departureStation,
        arrivalStation,
        departureDate,
      });
      setIsLoading(false);
    } catch (error: any) {
      setErrors({ general: error.message || '查询失败，请稍后重试' });
      setIsLoading(false);
    }
  };

  // 交换出发地和到达地
  const handleSwapStations = () => {
    const temp = departureStation;
    setDepartureStation(arrivalStation);
    setArrivalStation(temp);
  };

  return (
    <div className="train-search-bar">
      <div className="search-bar-container">
        <div className="search-field">
          <label className="search-field-label">出发地</label>
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
        
        <button 
          className="swap-stations-btn" 
          onClick={handleSwapStations}
          aria-label="交换出发地和到达地"
        >
          ⇅
        </button>
        
        <div className="search-field">
          <label className="search-field-label">到达地</label>
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
          <label className="search-field-label">出发日期</label>
          <DatePicker
            value={departureDate}
            onChange={setDepartureDate}
            minDate={new Date().toISOString().split('T')[0]}
            maxDate=""
          />
        </div>
        
        <button className="search-submit-btn" onClick={handleSearch} disabled={isLoading}>
          {isLoading ? '查询中...' : '查询'}
        </button>
      </div>
      {errors.general && <div className="search-error-message">{errors.general}</div>}
    </div>
  );
};

export default TrainSearchBar;

