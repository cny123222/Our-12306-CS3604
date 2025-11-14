/**
 * 乘客管理页
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PassengerManagementPage.css';
import TopNavigation from '../components/TopNavigation';
import BottomNavigation from '../components/BottomNavigation';
import SideMenu from '../components/PersonalInfo/SideMenu';
import AddPassengerModal from '../components/PersonalInfo/AddPassengerModal';
import EditPassengerModal from '../components/PersonalInfo/EditPassengerModal';

interface Passenger {
  id: number;
  name: string;
  idCardType: string;
  idCardNumber: string;
  phone: string;
  discountType: string;
  createdAt: string;
}

const PassengerManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPassengers, setSelectedPassengers] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('/api/passengers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data) {
        setPassengers(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch passengers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToHome = () => {
    navigate('/');
  };

  const handleMenuClick = (section: string) => {
    if (section === 'train-order') {
      navigate('/personal/orders');
    } else if (section === 'view-personal-info') {
      navigate('/personal/info');
    } else if (section === 'phone-verification') {
      navigate('/personal/phone-verification');
    }
  };

  const handleSearch = () => {
    // 搜索功能在fetchPassengers中实现
    console.log('Searching for:', searchKeyword);
  };

  const handleCheckboxChange = (passengerId: number) => {
    setSelectedPassengers(prev => {
      if (prev.includes(passengerId)) {
        return prev.filter(id => id !== passengerId);
      } else {
        return [...prev, passengerId];
      }
    });
  };

  const handleDelete = async (passengerId: number) => {
    if (!window.confirm('您确定要删除选中的乘车人吗？')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.delete(`/api/passengers/${passengerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('删除成功');
      fetchPassengers();
    } catch (err: any) {
      console.error('Failed to delete passenger:', err);
      alert(err.response?.data?.error || '删除失败');
    }
  };

  const handleEdit = (passenger: Passenger) => {
    setEditingPassenger(passenger);
    setShowEditModal(true);
  };

  const handleBatchDelete = async () => {
    if (selectedPassengers.length === 0) {
      alert('请先选择要删除的乘客');
      return;
    }

    if (!window.confirm('您确定要删除选中的乘车人吗？')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // 依次删除选中的乘客
      for (const passengerId of selectedPassengers) {
        await axios.delete(`/api/passengers/${passengerId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      alert('删除成功');
      setSelectedPassengers([]);
      fetchPassengers();
    } catch (err: any) {
      console.error('Failed to batch delete passengers:', err);
      alert(err.response?.data?.error || '删除失败');
    }
  };

  const filteredPassengers = passengers.filter(p =>
    !searchKeyword || p.name.includes(searchKeyword)
  );

  const maskName = (name: string) => {
    if (name.length <= 1) return name;
    return name[0] + '*'.repeat(name.length - 1);
  };

  const maskIdCard = (idCard: string) => {
    if (idCard.length <= 8) return idCard;
    return idCard.substring(0, 4) + '*'.repeat(idCard.length - 8) + idCard.substring(idCard.length - 4);
  };

  const maskPhone = (phone: string) => {
    if (phone.length <= 7) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
  };

  return (
    <div className="passenger-management-page">
      <TopNavigation onLogoClick={handleNavigateToHome} showWelcomeLogin={true} />

      <div className="breadcrumb">
        <span className="breadcrumb-text">当前位置：个人中心&gt;常用信息管理&gt;</span>
        <span className="breadcrumb-current">乘车人</span>
      </div>

      <div className="main-content">
        <SideMenu currentSection="passenger-management" onMenuClick={handleMenuClick} />

        <div className="passenger-list-panel">
          {/* 搜索区域 */}
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="请输入乘客姓名"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button className="search-button" onClick={handleSearch}>
              查询
            </button>
          </div>

          {/* 乘客列表表格 */}
          <div className="passenger-table-container">
            <div className="table-actions">
              <button className="add-button" onClick={() => setShowAddModal(true)}>
                <span className="icon-add">+</span> 添加
              </button>
              <button className="batch-delete-button" onClick={handleBatchDelete}>
                <span className="icon-delete">🗑</span> 批量删除
              </button>
            </div>

            {isLoading ? (
              <div className="loading">加载中...</div>
            ) : filteredPassengers.length === 0 ? (
              <div className="empty-message">暂无乘客</div>
            ) : (
              <table className="passenger-table">
                <thead>
                  <tr>
                    <th></th>
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
                  {filteredPassengers.map((passenger, index) => (
                    <tr key={passenger.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedPassengers.includes(passenger.id)}
                          onChange={() => handleCheckboxChange(passenger.id)}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td>{maskName(passenger.name)}</td>
                      <td>{passenger.idCardType}</td>
                      <td>{maskIdCard(passenger.idCardNumber)}</td>
                      <td>{maskPhone(passenger.phone)}</td>
                      <td>
                        <span className="status-icon verified">✓</span>
                      </td>
                      <td>
                        <button className="delete-icon-button" onClick={() => handleDelete(passenger.id)} title="删除">
                          🗑
                        </button>
                        <button className="edit-icon-button" onClick={() => handleEdit(passenger)} title="编辑">
                          ✏
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation />

      {/* 添加乘客Modal */}
      {showAddModal && (
        <AddPassengerModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (passengerData) => {
            const token = localStorage.getItem('authToken');
            if (!token) {
              navigate('/login');
              return;
            }

            await axios.post('/api/passengers', passengerData, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            alert('添加成功!');
            fetchPassengers();
          }}
        />
      )}

      {/* 编辑乘客Modal */}
      {showEditModal && editingPassenger && (
        <EditPassengerModal
          passenger={editingPassenger}
          onClose={() => {
            setShowEditModal(false);
            setEditingPassenger(null);
          }}
          onUpdate={async (passengerId, updateData) => {
            const token = localStorage.getItem('authToken');
            if (!token) {
              navigate('/login');
              return;
            }

            await axios.put(`/api/passengers/${passengerId}`, updateData, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            fetchPassengers();
          }}
        />
      )}
    </div>
  );
};

export default PassengerManagementPage;

