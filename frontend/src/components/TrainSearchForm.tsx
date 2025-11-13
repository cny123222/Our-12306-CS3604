import React, { useState } from 'react';
import './TrainSearchForm.css';
import StationInput from './StationInput';
import DatePicker from './DatePicker';
import { validateStation } from '../services/stationService';

interface TrainSearchFormProps {
  onNavigateToTrainList: (params: any) => void;
}

/**
 * 车票查询表单组件
 */
const TrainSearchForm: React.FC<TrainSearchFormProps> = ({ onNavigateToTrainList }) => {
  const [departureStation, setDepartureStation] = useState('');
  const [arrivalStation, setArrivalStation] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHighSpeed, setIsHighSpeed] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 实现交换出发地和到达地
  const handleSwapStations = () => {
    const temp = departureStation;
    setDepartureStation(arrivalStation);
    setArrivalStation(temp);
  };

  // 实现查询功能
  const handleSearch = async () => {
    const newErrors: { [key: string]: string } = {};

    // 验证出发地
    if (!departureStation || departureStation.trim() === '') {
      newErrors.departure = '请选择出发地';
      setErrors({ ...newErrors, general: '请选择出发地' });
      return;
    }

    // 验证到达地
    if (!arrivalStation || arrivalStation.trim() === '') {
      newErrors.arrival = '请选择到达地';
      setErrors({ ...newErrors, general: '请选择到达地' });
      return;
    }

    // 验证出发地是否合法
    const departureResult = await validateStation(departureStation);
    if (!departureResult.valid) {
      // Check if this is a network error
      if (departureResult.error === '验证站点失败，请稍后重试') {
        setErrors({
          general: '查询失败，请稍后重试'
        });
        return;
      }
      setErrors({
        departure: departureResult.error || '无法匹配该出发地',
        general: departureResult.error || '无法匹配该出发地'
      });
      return;
    }

    // 验证到达地是否合法
    const arrivalResult = await validateStation(arrivalStation);
    if (!arrivalResult.valid) {
      // Check if this is a network error
      if (arrivalResult.error === '验证站点失败，请稍后重试') {
        setErrors({
          general: '查询失败，请稍后重试'
        });
        return;
      }
      setErrors({
        arrival: arrivalResult.error || '无法匹配该到达地',
        general: arrivalResult.error || '无法匹配该到达地'
      });
      return;
    }

    // 所有验证通过，跳转到车次列表页
    setErrors({});
    onNavigateToTrainList({
      departureStation,
      arrivalStation,
      departureDate,
      isHighSpeed
    });
  };

  return (
    <div className="train-search-form">
      {/* 左侧三栏 - 横向显示文字 */}
      <div className="form-sidebar">
        <button className="sidebar-tab active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="8" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>车票</span>
        </button>
        <button className="sidebar-tab">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>常用查询</span>
        </button>
        <button className="sidebar-tab">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill="currentColor"/>
          </svg>
          <span>订餐</span>
        </button>
      </div>
      
      <div className="search-form-container">
        {/* 车票内四个选项卡 - 只有下方蓝线 */}
        <div className="form-tabs">
          <button className="form-tab-button active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>单程</span>
          </button>
          <button className="form-tab-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l-5 9h10l-5-9zm0 20l5-9H7l5 9z" fill="currentColor"/>
            </svg>
            <span>往返</span>
          </button>
          <button className="form-tab-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
            </svg>
            <span>中转换乘</span>
          </button>
          <button className="form-tab-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="currentColor"/>
            </svg>
            <span>退改签</span>
          </button>
        </div>
        
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

