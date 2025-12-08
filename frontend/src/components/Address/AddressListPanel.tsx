import React from 'react';
import './AddressListPanel.css';

export interface Address {
  id: string;
  recipient: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  street: string;
  surrounding?: string;
  detailAddress: string;
  isDefault: boolean;
}

interface AddressListPanelProps {
  addresses: Address[];
  onAddAddress: () => void;
  onDeleteAddress: (id: string) => void;
}

const AddressListPanel: React.FC<AddressListPanelProps> = ({ addresses, onAddAddress, onDeleteAddress }) => {
  return (
    <div className="address-list-panel">
      {/* Table Header */}
      <div className="address-table-header">
        <div className="header-item index">序号</div>
        <div className="header-item recipient">收件人</div>
        <div className="header-item address">地址</div>
        <div className="header-item phone">手机</div>
        <div className="header-item is-default">是否默认</div>
        <div className="header-item action">操作</div>
      </div>

      {/* Add Button Row */}
      <div className="add-address-row">
        <button className="add-address-btn" onClick={onAddAddress}>
          <span className="plus-icon">⊕</span> 增加
        </button>
      </div>

      {/* Address List */}
      <div className="address-list">
        {addresses.map((address, index) => (
          <div key={address.id} className="address-row">
            <div className="row-item index">{index + 1}</div>
            <div className="row-item recipient">{address.recipient}</div>
            <div className="row-item address-detail">
              {`${address.province}${address.city}${address.district}${address.street}${address.surrounding || ''}${address.detailAddress}`}
            </div>
            <div className="row-item phone">{address.phone}</div>
            <div className="row-item is-default">
              {address.isDefault ? (
                <span className="default-tag">取消默认</span>
              ) : (
                <span className="set-default-btn">设为默认</span>
              )}
            </div>
            <div className="row-item action">
              <button className="icon-btn delete-btn" onClick={() => onDeleteAddress(address.id)} title="删除">
                🗑️
              </button>
              <button className="icon-btn edit-btn" title="编辑">
                ✏️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Warm Tips */}
      <div className="warm-tips-section">
        <div className="tips-title">温馨提示</div>
        <div className="tips-content">
          <p>1.您最多可添加20个车票快递地址，对已支付的地址30天内不可删除与修改。</p>
          <p>2.请您准确完整的填写收件地址、收件人姓名、手机号码等信息，并保持电话畅通，以免耽误接收车票。</p>
        </div>
      </div>
    </div>
  );
};

export default AddressListPanel;
