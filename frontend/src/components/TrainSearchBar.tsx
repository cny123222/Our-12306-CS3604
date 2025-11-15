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
  const [tripType, setTripType] = useState<'single' | 'round'>('single'); // 单程/往返
  const [ticketType, setTicketType] = useState<'normal' | 'student'>('normal'); // 普通/学生
  const [departureStation, setDepartureStation] = useState(initialDepartureStation);
  const [arrivalStation, setArrivalStation] = useState(initialArrivalStation);
  // 如果没有提供初始日期，使用今天作为默认日期
  const [departureDate, setDepartureDate] = useState(
    initialDepartureDate || new Date().toISOString().split('T')[0]
  );
  // 返程日期默认为今天
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
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
        {/* 单程/往返选择 */}
        <div className="trip-type-selector">
          <label className="radio-option">
            <input
              type="radio"
              name="tripType"
              value="single"
              checked={tripType === 'single'}
              onChange={() => setTripType('single')}
            />
            <span className="radio-label">单程</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="tripType"
              value="round"
              checked={tripType === 'round'}
              onChange={() => setTripType('round')}
            />
            <span className="radio-label">往返</span>
          </label>
        </div>

        {/* 竖线分隔 */}
        <div className="vertical-divider-blue"></div>

        {/* 出发地 */}
        <div className="search-field-inline">
          <label className="search-field-label-inline">出发地</label>
          <StationInput
            value={departureStation}
            placeholder="北京北"
            type="departure"
            onChange={setDepartureStation}
            onSelect={setDepartureStation}
          />
          {errors.departureStation && (
            <div className="field-error">{errors.departureStation}</div>
          )}
        </div>
        
        {/* 交换按钮 - 蓝色icon */}
        <button 
          className="swap-stations-btn" 
          onClick={handleSwapStations}
          aria-label="交换出发地和到达地"
        >
          <img src="/images/转换2.svg" alt="交换" className="swap-icon" />
        </button>
        
        {/* 到达地 */}
        <div className="search-field-inline">
          <label className="search-field-label-inline">目的地</label>
          <StationInput
            value={arrivalStation}
            placeholder="上海"
            type="arrival"
            onChange={setArrivalStation}
            onSelect={setArrivalStation}
          />
          {errors.arrivalStation && <div className="field-error">{errors.arrivalStation}</div>}
        </div>
        
        {/* 出发日期 */}
        <div className="search-field-inline">
          <label className="search-field-label-inline">出发日</label>
          <DatePicker
            value={departureDate}
            onChange={setDepartureDate}
            minDate={new Date().toISOString().split('T')[0]}
            maxDate=""
          />
        </div>
        
        {/* 返程日期 - 灰色禁用 */}
        <div className="search-field-inline">
          <label className="search-field-label-inline return-label">返程日</label>
          <DatePicker
            value={returnDate}
            onChange={setReturnDate}
            minDate={new Date().toISOString().split('T')[0]}
            maxDate=""
            disabled={true}
          />
        </div>

        {/* 竖线分隔 */}
        <div className="vertical-divider-blue"></div>
        
        {/* 普通/学生选择 */}
        <div className="ticket-type-selector">
          <label className="radio-option">
            <input
              type="radio"
              name="ticketType"
              value="normal"
              checked={ticketType === 'normal'}
              onChange={() => setTicketType('normal')}
            />
            <span className="radio-label">普通</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="ticketType"
              value="student"
              checked={ticketType === 'student'}
              onChange={() => setTicketType('student')}
            />
            <span className="radio-label">学生</span>
          </label>
        </div>
        
        {/* 查询按钮 */}
        <button className="search-submit-btn" onClick={handleSearch} disabled={isLoading}>
          查询
        </button>
      </div>
      {errors.general && <div className="search-error-message">{errors.general}</div>}
    </div>
  );
};

export default TrainSearchBar;

