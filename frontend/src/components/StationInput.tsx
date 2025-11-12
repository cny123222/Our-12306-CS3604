import React, { useState } from 'react';
import './StationInput.css';

interface StationInputProps {
  value: string;
  placeholder: string;
  type: 'departure' | 'arrival';
  onChange: (value: string) => void;
  onSelect: (station: string) => void;
}

/**
 * 站点输入组件
 * 骨架实现：仅包含组件结构，不实现真实逻辑
 */
const StationInput: React.FC<StationInputProps> = ({
  value,
  placeholder,
  type,
  onChange,
  onSelect,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // TODO: 实现站点搜索和推荐
  const handleFocus = () => {
    // TODO: 显示所有站点列表
    setShowSuggestions(true);
  };

  // TODO: 实现站点输入处理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    // TODO: 实时搜索站点
  };

  // TODO: 实现站点选择
  const handleSelectStation = (station: string) => {
    onSelect(station);
    setShowSuggestions(false);
  };

  return (
    <div className="station-input">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="station-input-field"
      />
      {showSuggestions && (
        <div className="suggestions-dropdown">
          {isLoading && <div className="suggestion-item loading">加载中...</div>}
          {!isLoading && suggestions.length === 0 && (
            <div className="suggestion-item empty">暂无匹配站点</div>
          )}
          {!isLoading &&
            suggestions.map((station, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSelectStation(station)}
              >
                {station}
              </div>
            ))}
        </div>
      )}
      {error && <div className="input-error">{error}</div>}
    </div>
  );
};

export default StationInput;

