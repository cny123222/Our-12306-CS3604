import React, { useState, useEffect } from 'react';
import './TrainFilterPanel.css';

interface TrainFilterPanelProps {
  onFilterChange: (filters: any) => void;
  departureStations: string[];
  arrivalStations: string[];
  seatTypes: string[];
  departureDate?: string; // 添加出发日期用于生成日期标签
}

/**
 * 车次信息筛选区域组件
 */
const TrainFilterPanel: React.FC<TrainFilterPanelProps> = ({
  onFilterChange,
  departureStations,
  arrivalStations,
  seatTypes,
  departureDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTrainTypes, setSelectedTrainTypes] = useState<string[]>([]);
  const [selectedDepartureStations, setSelectedDepartureStations] = useState<string[]>([]);
  const [selectedArrivalStations, setSelectedArrivalStations] = useState<string[]>([]);
  const [selectedSeatTypes, setSelectedSeatTypes] = useState<string[]>([]);
  const [departureTimeRange, setDepartureTimeRange] = useState<string>('00:00--24:00');
  
  // 生成日期标签（前后各7天）
  const generateDateTabs = () => {
    const tabs = [];
    const baseDate = departureDate ? new Date(departureDate) : new Date();
    
    for (let i = -1; i <= 14; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekDay = weekDays[date.getDay()];
      
      tabs.push({
        date: dateStr,
        display: `${month}-${day}`,
        weekDay: weekDay,
      });
    }
    
    return tabs;
  };

  const dateTabs = generateDateTabs();

  // 初始化选中的日期
  useEffect(() => {
    if (departureDate) {
      setSelectedDate(departureDate);
    }
  }, [departureDate]);

  // 定义所有车次类型
  const trainTypeOptions = [
    { key: 'GC', label: 'GC-高铁/城际', types: ['G', 'C'] },
    { key: 'D', label: 'D-动车', types: ['D'] },
    { key: 'Z', label: 'Z-直达', types: ['Z'] },
    { key: 'T', label: 'T-特快', types: ['T'] },
    { key: 'K', label: 'K-快速', types: ['K'] },
    { key: 'OTHER', label: '其他', types: ['OTHER'] },
    { key: 'FUXING', label: '复兴号', types: ['FUXING'] },
    { key: 'SMART', label: '智能动车组', types: ['SMART'] },
  ];

  // 定义席别类型
  const seatTypeOptions = [
    '商务座', '一等座', '二等座', '软卧', '软座', '二等卧', '一等卧', '硬卧', '硬座'
  ];

  // 处理车次类型变化
  const handleTrainTypeToggle = (types: string[]) => {
    let newTypes = [...selectedTrainTypes];
    const allSelected = types.every(t => newTypes.includes(t));
    
    if (allSelected) {
      newTypes = newTypes.filter(t => !types.includes(t));
    } else {
      types.forEach(t => {
        if (!newTypes.includes(t)) {
          newTypes.push(t);
        }
      });
    }
    
    setSelectedTrainTypes(newTypes);
    triggerFilterChange({ trainTypes: newTypes });
  };

  // 处理车次类型全选
  const handleTrainTypesSelectAll = () => {
    const allTypes = trainTypeOptions.flatMap(opt => opt.types);
    if (selectedTrainTypes.length === allTypes.length) {
      setSelectedTrainTypes([]);
      triggerFilterChange({ trainTypes: [] });
    } else {
      setSelectedTrainTypes(allTypes);
      triggerFilterChange({ trainTypes: allTypes });
    }
  };

  // 处理出发站变化
  const handleDepartureStationToggle = (station: string) => {
    let newStations = [...selectedDepartureStations];
    if (newStations.includes(station)) {
      newStations = newStations.filter(s => s !== station);
    } else {
      newStations.push(station);
    }
    setSelectedDepartureStations(newStations);
    triggerFilterChange({ departureStations: newStations });
  };

  // 处理出发站全选
  const handleDepartureStationsSelectAll = () => {
    if (selectedDepartureStations.length === departureStations.length) {
      setSelectedDepartureStations([]);
      triggerFilterChange({ departureStations: [] });
    } else {
      setSelectedDepartureStations([...departureStations]);
      triggerFilterChange({ departureStations: [...departureStations] });
    }
  };

  // 处理到达站变化
  const handleArrivalStationToggle = (station: string) => {
    let newStations = [...selectedArrivalStations];
    if (newStations.includes(station)) {
      newStations = newStations.filter(s => s !== station);
    } else {
      newStations.push(station);
    }
    setSelectedArrivalStations(newStations);
    triggerFilterChange({ arrivalStations: newStations });
  };

  // 处理到达站全选
  const handleArrivalStationsSelectAll = () => {
    if (selectedArrivalStations.length === arrivalStations.length) {
      setSelectedArrivalStations([]);
      triggerFilterChange({ arrivalStations: [] });
    } else {
      setSelectedArrivalStations([...arrivalStations]);
      triggerFilterChange({ arrivalStations: [...arrivalStations] });
    }
  };

  // 处理席别变化
  const handleSeatTypeToggle = (type: string) => {
    let newTypes = [...selectedSeatTypes];
    if (newTypes.includes(type)) {
      newTypes = newTypes.filter(t => t !== type);
    } else {
      newTypes.push(type);
    }
    setSelectedSeatTypes(newTypes);
    triggerFilterChange({ seatTypes: newTypes });
  };

  // 处理席别全选
  const handleSeatTypesSelectAll = () => {
    if (selectedSeatTypes.length === seatTypeOptions.length) {
      setSelectedSeatTypes([]);
      triggerFilterChange({ seatTypes: [] });
    } else {
      setSelectedSeatTypes([...seatTypeOptions]);
      triggerFilterChange({ seatTypes: [...seatTypeOptions] });
    }
  };

  // 触发筛选变化
  const triggerFilterChange = (updates: any) => {
    onFilterChange({
      trainTypes: updates.trainTypes !== undefined ? updates.trainTypes : selectedTrainTypes,
      departureStations: updates.departureStations !== undefined ? updates.departureStations : selectedDepartureStations,
      arrivalStations: updates.arrivalStations !== undefined ? updates.arrivalStations : selectedArrivalStations,
      seatTypes: updates.seatTypes !== undefined ? updates.seatTypes : selectedSeatTypes,
    });
  };

  return (
    <div className="train-filter-panel">
      {/* 日期筛选标签行 */}
      <div className="date-filter-tabs">
        {dateTabs.map((tab) => (
          <button
            key={tab.date}
            className={`date-tab ${selectedDate === tab.date ? 'active' : ''}`}
            onClick={() => setSelectedDate(tab.date)}
          >
            <div className="date-tab-date">{tab.display}</div>
          </button>
        ))}
      </div>

      {/* 筛选条件面板 */}
      <div className="filter-panel-container">
        {/* 车次类型行 */}
        <div className="filter-row">
          <div className="filter-label">车次类型：</div>
          <button className="filter-all-btn" onClick={handleTrainTypesSelectAll}>
            全部
          </button>
          <div className="filter-options">
            {trainTypeOptions.map((option) => (
              <label key={option.key} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={option.types.every(t => selectedTrainTypes.includes(t))}
                  onChange={() => handleTrainTypeToggle(option.types)}
                />
                <span className="checkbox-label">{option.label}</span>
              </label>
            ))}
          </div>
          <div className="filter-time-select">
            <span className="time-label">发车时间：</span>
            <select
              value={departureTimeRange}
              onChange={(e) => setDepartureTimeRange(e.target.value)}
              className="time-dropdown"
            >
              <option value="00:00--24:00">00:00--24:00</option>
              <option value="00:00--06:00">00:00--06:00</option>
              <option value="06:00--12:00">06:00--12:00</option>
              <option value="12:00--18:00">12:00--18:00</option>
              <option value="18:00--24:00">18:00--24:00</option>
            </select>
          </div>
        </div>

        {/* 出发车站行 */}
        {departureStations.length > 0 && (
          <div className="filter-row">
            <div className="filter-label">出发车站：</div>
            <button className="filter-all-btn" onClick={handleDepartureStationsSelectAll}>
              全部
            </button>
            <div className="filter-options">
              {departureStations.map((station) => (
                <label key={station} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedDepartureStations.includes(station)}
                    onChange={() => handleDepartureStationToggle(station)}
                  />
                  <span className="checkbox-label">{station}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 到达车站行 */}
        {arrivalStations.length > 0 && (
          <div className="filter-row">
            <div className="filter-label">到达车站：</div>
            <button className="filter-all-btn" onClick={handleArrivalStationsSelectAll}>
              全部
            </button>
            <div className="filter-options">
              {arrivalStations.map((station) => (
                <label key={station} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedArrivalStations.includes(station)}
                    onChange={() => handleArrivalStationToggle(station)}
                  />
                  <span className="checkbox-label">{station}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 车次席别行 */}
        <div className="filter-row">
          <div className="filter-label">车次席别：</div>
          <button className="filter-all-btn" onClick={handleSeatTypesSelectAll}>
            全部
          </button>
          <div className="filter-options">
            {seatTypeOptions.map((type) => (
              <label key={type} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedSeatTypes.includes(type)}
                  onChange={() => handleSeatTypeToggle(type)}
                />
                <span className="checkbox-label">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 筛选清除按钮 */}
        <div className="filter-summary">
          <button className="clear-filters-btn" onClick={() => {
            setSelectedTrainTypes([]);
            setSelectedDepartureStations([]);
            setSelectedArrivalStations([]);
            setSelectedSeatTypes([]);
            triggerFilterChange({ trainTypes: [], departureStations: [], arrivalStations: [], seatTypes: [] });
          }}>
            <span className="clear-icon">↻</span> 筛选
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainFilterPanel;

