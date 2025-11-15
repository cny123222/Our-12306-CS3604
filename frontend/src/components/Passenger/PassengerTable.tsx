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
        <tbody>
          {passengers.map((passenger, index) => (
            <tr key={passenger.id}>
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(passenger.id)}
                  onChange={() => handleSelectOne(passenger.id)}
                />
              </td>
              <td className="index-cell">{index + 1}</td>
              <td className="name-cell">{maskName(passenger.name)}</td>
              <td className="id-type-cell">{passenger.idCardType || passenger.id_card_type}</td>
              <td className="id-number-cell">{maskIdCard(passenger.idCardNumber || passenger.id_card_number)}</td>
              <td className="phone-cell">
                {passenger.phone ? maskPhone(passenger.phone) : (passenger.phoneNumber ? maskPhone(passenger.phoneNumber) : '-')}
              </td>
              <td className="verification-cell">
                <span className="verification-badge">
                  <span className="verification-icon">✓</span>
                </span>
              </td>
              <td className="action-cell">
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

