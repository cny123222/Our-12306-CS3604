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

