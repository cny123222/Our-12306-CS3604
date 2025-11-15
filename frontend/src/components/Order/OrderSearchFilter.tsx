// 订单搜索筛选组件
import React, { useState } from 'react';
import DatePicker from '../DatePicker';
import './OrderSearchFilter.css';

interface OrderSearchFilterProps {
  onSearch: (startDate: string, endDate: string, keyword: string) => void;
  variant?: 'history' | 'unpaid';  // 区分历史订单和未出行订单
}

const OrderSearchFilter: React.FC<OrderSearchFilterProps> = ({ 
  onSearch,
  variant = 'history' 
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [keyword, setKeyword] = useState('');

  // 设置默认日期范围（近15天）
  React.useEffect(() => {
    const today = new Date();
    const fifteenDaysAgo = new Date(today);
    fifteenDaysAgo.setDate(today.getDate() - 15);

    setStartDate(fifteenDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const handleSearch = () => {
    onSearch(startDate, endDate, keyword);
  };

  const handleClear = () => {
    setKeyword('');
  };

  // 计算日期范围（过去30天到未来30天）
  const getDateRange = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() - 30);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    
    return {
      minDate: minDate.toISOString().split('T')[0],
      maxDate: maxDate.toISOString().split('T')[0]
    };
  };

  const dateRange = getDateRange();

  // 历史订单：显示完整查询栏（一行显示）
  if (variant === 'history') {
    return (
      <div className="order-search-filter history-filter">
        <div className="filter-row single-row">
          <div className="filter-group date-group">
            <label className="filter-label">乘车日期</label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              minDate={dateRange.minDate}
              maxDate={dateRange.maxDate}
            />
            <span className="date-separator">-</span>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              minDate={dateRange.minDate}
              maxDate={dateRange.maxDate}
            />
          </div>

          <div className="filter-group keyword-group">
            <label className="filter-label">订单号/车次/姓名</label>
            <input
              type="text"
              className="filter-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="请输入订单号/车次/姓名"
            />
            {keyword && (
              <button className="clear-button" onClick={handleClear}>
                ✕
              </button>
            )}
          </div>

          <button className="order-search-button" onClick={handleSearch}>
            查询
          </button>
        </div>
      </div>
    );
  }

  // 未出行订单：显示带下拉框的查询栏
  return (
    <div className="order-search-filter unpaid-filter">
      <div className="filter-row single-row">
        <div className="filter-group dropdown-group">
          <select className="filter-dropdown">
            <option value="order-date">按订票日期查询</option>
          </select>
        </div>

        <div className="filter-group date-group">
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            minDate={dateRange.minDate}
            maxDate={dateRange.maxDate}
          />
          <span className="date-separator">-</span>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            minDate={dateRange.minDate}
            maxDate={dateRange.maxDate}
          />
        </div>

        <div className="filter-group keyword-group">
          <label className="filter-label">订单号/车次/姓名</label>
          <input
            type="text"
            className="filter-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="请输入订单号/车次/姓名"
          />
          {keyword && (
            <button className="clear-button" onClick={handleClear}>
              ✕
            </button>
          )}
        </div>

        <button className="order-search-button" onClick={handleSearch}>
          查询
        </button>
      </div>
    </div>
  );
};

export default OrderSearchFilter;

