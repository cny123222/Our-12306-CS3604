// 乘客信息表格组件
import React from 'react';
import './PassengerTable.css';

interface PassengerTableProps {
  passengers: any[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onEdit: (passenger: any) => void;
  onDelete: (passengerId: string) => void;
}

const PassengerTable: React.FC<PassengerTableProps> = ({
  passengers,
  selectedIds,
  onSelect,
  onEdit,
  onDelete
}) => {
  const maskName = (name: string) => {
    if (name.length <= 1) return name;
    return name[0] + '*'.repeat(name.length - 1);
  };

  const maskIdCard = (idCard: string) => {
    if (idCard.length <= 8) return idCard;
    const start = idCard.substring(0, 4);
    const end = idCard.substring(idCard.length - 4);
    return `${start}${'*'.repeat(idCard.length - 8)}${end}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length <= 7) return phone;
    const start = phone.substring(0, 3);
    const end = phone.substring(phone.length - 4);
    return `${start}****${end}`;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelect(passengers.map((p) => p.id));
    } else {
      onSelect([]);
    }
  };

  const handleSelectOne = (passengerId: string) => {
    if (selectedIds.includes(passengerId)) {
      onSelect(selectedIds.filter((id) => id !== passengerId));
    } else {
      onSelect([...selectedIds, passengerId]);
    }
  };

  return (
    <div className="passenger-table-container">
      <table className="passenger-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={passengers.length > 0 && selectedIds.length === passengers.length}
                onChange={handleSelectAll}
              />
            </th>
            <th>序号</th>
            <th>姓名</th>
            <th>证件类型</th>
            <th>证件号码</th>
            <th>手机/电话</th>
            <th>核验状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {passengers.map((passenger, index) => (
            <tr key={passenger.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(passenger.id)}
                  onChange={() => handleSelectOne(passenger.id)}
                />
              </td>
              <td>{index + 1}</td>
              <td>{maskName(passenger.name)}</td>
              <td>{passenger.id_card_type}</td>
              <td>{maskIdCard(passenger.id_card_number)}</td>
              <td>{maskPhone(passenger.phone)}</td>
              <td>
                <span className="verification-icon">✓</span>
                <span className="verification-text">已通过核验</span>
              </td>
              <td>
                <button
                  className="action-button edit-button"
                  onClick={() => onEdit(passenger)}
                  title="编辑"
                >
                  ✎
                </button>
                <button
                  className="action-button delete-button"
                  onClick={() => onDelete(passenger.id)}
                  title="删除"
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {passengers.length === 0 && (
        <div className="empty-state">暂无乘客信息</div>
      )}
    </div>
  );
};

export default PassengerTable;

