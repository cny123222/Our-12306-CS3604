// 乘客管理页
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainListTopBar from '../components/TrainListTopBar';
import MainNavigation from '../components/MainNavigation';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('authToken');
      setIsLoggedIn(!!token);
      if (!token) {
        console.log('未登录，跳转到登录页');
        navigate('/login');
        return false;
      }
      return true;
    };
    
    if (checkLoginStatus()) {
      fetchPassengers();
    }
    
    // 监听storage事件，当其他标签页登录/登出时同步状态
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, [navigate]);

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
      setError(''); // 清除之前的错误
      const token = localStorage.getItem('authToken');
      
      console.log('=== 乘客列表加载开始 ===');
      console.log('Token存在:', !!token);
      
      if (!token) {
        console.log('Token不存在，跳转登录页');
        navigate('/login');
        return;
      }
      
      const response = await fetch('/api/passengers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('API响应状态:', response.status);

      if (response.status === 401) {
        // Token失效，跳转到登录页
        console.log('Token失效(401)，跳转登录页');
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('获取到乘客数据:', data);
        setPassengers(data.passengers || []);
        setFilteredPassengers(data.passengers || []);
        console.log('乘客列表设置成功，数量:', (data.passengers || []).length);
      } else {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        setError(`获取乘客列表失败: ${response.status}`);
      }
    } catch (err) {
      console.error('获取乘客列表异常:', err);
      setError('获取乘客列表失败');
    } finally {
      setIsLoading(false);
      console.log('=== 乘客列表加载结束 ===');
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
      const token = localStorage.getItem('authToken');
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
      const token = localStorage.getItem('authToken');
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
      const token = localStorage.getItem('authToken');
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

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  const handleNavigateToPersonalCenter = () => {
    if (isLoggedIn) {
      navigate('/personal-info');
    } else {
      navigate('/login');
    }
  };

  // 获取用户名
  const username = isLoggedIn ? (localStorage.getItem('username') || localStorage.getItem('userId') || '用户') : '';

  return (
    <div className="passenger-management-page">
      <TrainListTopBar isLoggedIn={isLoggedIn} username={username} />
      <MainNavigation
        isLoggedIn={isLoggedIn}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToPersonalCenter}
      />

      <div className="main-content">
        <SideMenu currentSection="passengers" onMenuClick={handleMenuClick} />

        <div className="content-area">
          <BreadcrumbNavigation
            path={['个人中心', '常用信息管理']}
            currentPage="乘车人"
          />

          {isLoading && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              加载中...
            </div>
          )}

          {error && !isLoading && (
            <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!isLoading && !error && currentView === 'list' && (
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

