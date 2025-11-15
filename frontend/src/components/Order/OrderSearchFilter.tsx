// 订单搜索筛选组件
import React, { useState } from 'react';
import DatePicker from '../DatePicker';
import './OrderSearchFilter.css';

interface OrderSearchFilterProps {
  onSearch: (startDate: string, endDate: string, keyword: string) => void;
}

const OrderSearchFilter: React.FC<OrderSearchFilterProps> = ({ onSearch }) => {
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

  return (
    <div className="order-search-filter">
      <div className="filter-group">
        <label className="filter-label">乘车日期：</label>
        <DatePicker
          value={startDate}
          onChange={setStartDate}
          minDate=""
          maxDate=""
        />
        <span className="date-separator">-</span>
        <DatePicker
          value={endDate}
          onChange={setEndDate}
          minDate=""
          maxDate=""
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">订单号/车次/姓名：</label>
        <input
          type="text"
          className="filter-input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="请输入订单号/车次/姓名"
        />
      </div>

      <button className="search-button" onClick={handleSearch}>
        查询
      </button>
    </div>
  );
};

export default OrderSearchFilter;

