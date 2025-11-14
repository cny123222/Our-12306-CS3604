// 乘车人列表展示面板组件
import React, { useState } from 'react';
import PassengerTable from './PassengerTable';
import './PassengerListPanel.css';

interface PassengerListPanelProps {
  passengers: any[];
  onAdd: () => void;
  onEdit: (passenger: any) => void;
  onDelete: (passengerId: string) => void;
  onSearch: (keyword: string) => void;
}

const PassengerListPanel: React.FC<PassengerListPanelProps> = ({
  passengers,
  onAdd,
  onEdit,
  onDelete,
  onSearch
}) => {
  const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = () => {
    onSearch(searchKeyword);
  };

  const handleBatchDelete = async () => {
    if (selectedPassengers.length === 0) {
      alert('请选择要删除的乘客');
      return;
    }
    if (!confirm(`确定要删除选中的${selectedPassengers.length}个乘客吗？`)) return;

    for (const id of selectedPassengers) {
      await onDelete(id);
    }
    setSelectedPassengers([]);
  };

  return (
    <div className="passenger-list-panel">
      <div className="search-section">
        <div className="search-group">
          <label className="search-label">姓名：</label>
          <input
            type="text"
            className="search-input"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="请输入乘客姓名"
          />
          <button className="search-button" onClick={handleSearch}>
            查询
          </button>
        </div>
      </div>

      <div className="table-section">
        <div className="table-actions">
          <button className="add-button" onClick={onAdd}>
            <span className="add-icon">+</span> 添加
          </button>
          <button className="batch-delete-button" onClick={handleBatchDelete}>
            批量删除
          </button>
        </div>

        <PassengerTable
          passengers={passengers}
          selectedIds={selectedPassengers}
          onSelect={setSelectedPassengers}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

export default PassengerListPanel;

