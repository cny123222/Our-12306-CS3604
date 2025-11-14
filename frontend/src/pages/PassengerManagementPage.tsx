// 乘客管理页
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavigation from '../components/TopNavigation';
import SideMenu from '../components/SideMenu';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import BottomNavigation from '../components/BottomNavigation';
import PassengerListPanel from '../components/Passenger/PassengerListPanel';
import AddPassengerPanel from '../components/Passenger/AddPassengerPanel';
import EditPassengerPanel from '../components/Passenger/EditPassengerPanel';
import './PassengerManagementPage.css';

const PassengerManagementPage = () => {
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState<any[]>([]);
  const [filteredPassengers, setFilteredPassengers] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingPassenger, setEditingPassenger] = useState<any>(null);

  useEffect(() => {
    fetchPassengers();
  }, []);

  useEffect(() => {
    if (searchKeyword) {
      setFilteredPassengers(
        passengers.filter((p) =>
          p.name.toLowerCase().includes(searchKeyword.toLowerCase())
        )
      );
    } else {
      setFilteredPassengers(passengers);
    }
  }, [searchKeyword, passengers]);

  const fetchPassengers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token') || 'valid-test-token';
      const response = await fetch('/api/passengers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPassengers(data.passengers || []);
        setFilteredPassengers(data.passengers || []);
      }
    } catch (err) {
      setError('获取乘客列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuClick = (section: string) => {
    switch (section) {
      case 'train-orders':
        navigate('/orders');
        break;
      case 'personal-info':
        navigate('/personal-info');
        break;
      case 'phone-verification':
        navigate('/phone-verification');
        break;
      case 'passengers':
        // 已在当前页面
        break;
    }
  };

  const handleAdd = () => {
    setCurrentView('add');
  };

  const handleEdit = (passenger: any) => {
    setEditingPassenger(passenger);
    setCurrentView('edit');
  };

  const handleDelete = async (passengerId: string) => {
    if (!confirm('确定要删除该乘客吗？')) return;

    try {
      const token = localStorage.getItem('token') || 'valid-test-token';
      const response = await fetch(`/api/passengers/${passengerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchPassengers();
      } else {
        alert('删除失败');
      }
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleAddSubmit = async (passengerData: any) => {
    try {
      const token = localStorage.getItem('token') || 'valid-test-token';
      const response = await fetch('/api/passengers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passengerData)
      });

      if (response.ok) {
        await fetchPassengers();
        setCurrentView('list');
      } else {
        const data = await response.json();
        alert(data.error || '添加失败');
      }
    } catch (err) {
      alert('添加失败');
    }
  };

  const handleEditSubmit = async (passengerData: any) => {
    try {
      const token = localStorage.getItem('token') || 'valid-test-token';
      const response = await fetch(`/api/passengers/${editingPassenger.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passengerData)
      });

      if (response.ok) {
        await fetchPassengers();
        setCurrentView('list');
        setEditingPassenger(null);
      } else {
        alert('更新失败');
      }
    } catch (err) {
      alert('更新失败');
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setEditingPassenger(null);
  };

  return (
    <div className="passenger-management-page">
      <TopNavigation onLogoClick={() => navigate('/')} />

      <div className="main-content">
        <SideMenu currentSection="passengers" onMenuClick={handleMenuClick} />

        <div className="content-area">
          <BreadcrumbNavigation
            path={['个人中心', '常用信息管理']}
            currentPage="乘车人"
          />

          {currentView === 'list' && (
            <PassengerListPanel
              passengers={filteredPassengers}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSearch={setSearchKeyword}
            />
          )}

          {currentView === 'add' && (
            <AddPassengerPanel
              onSubmit={handleAddSubmit}
              onCancel={handleCancel}
            />
          )}

          {currentView === 'edit' && editingPassenger && (
            <EditPassengerPanel
              passenger={editingPassenger}
              onSubmit={handleEditSubmit}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PassengerManagementPage;

