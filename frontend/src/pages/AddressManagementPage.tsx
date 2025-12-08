// 地址管理页
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TrainListTopBar from '../components/TrainListTopBar';
import MainNavigation from '../components/MainNavigation';
import SideMenu from '../components/SideMenu';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import BottomNavigation from '../components/BottomNavigation';
import AddressListPanel, { Address } from '../components/Address/AddressListPanel';
import AddAddressPanel from '../components/Address/AddAddressPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import './AddressManagementPage.css';

const AddressManagementPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'add'>('list');
  const [addresses, setAddresses] = useState<Address[]>([]);

  // 获取地址列表
  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await axios.get('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(response.data.addresses);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      fetchAddresses();
    }
    
    // 监听storage事件，当其他标签页登录/登出时同步状态
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, [navigate]);

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

  const handleMy12306Click = () => {
    if (isLoggedIn) {
      navigate('/personal-info');
    } else {
      navigate('/login');
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
        navigate('/passengers');
        break;
      case 'address':
        // 已在当前页面
        break;
      default:
        break;
    }
  };

  // 获取用户名
  const username = isLoggedIn ? (localStorage.getItem('username') || localStorage.getItem('userId') || '用户') : '';

  const handleAddAddress = () => {
    setCurrentView('add');
  };

  const handleSaveAddress = async (addressData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post('/api/addresses', addressData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchAddresses(); // Refresh list
      setCurrentView('list');
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('保存地址失败');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('确定要删除该地址吗？')) return;
    
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`/api/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setAddresses(prev => prev.filter(addr => addr.id !== id));
    } catch (error) {
      console.error('Failed to delete address:', error);
      alert('删除地址失败');
    }
  };

  const handleCancelAdd = () => {
    setCurrentView('list');
  };

  return (
    <div className="address-management-page">
      <TrainListTopBar isLoggedIn={isLoggedIn} username={username} onMy12306Click={handleMy12306Click} />
      <MainNavigation
        isLoggedIn={isLoggedIn}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToPersonalCenter}
      />
      
      <BreadcrumbNavigation 
        path={['个人中心', '常用信息管理']}
        currentPage="地址管理"
      />
      
      <div className="main-content">
        <SideMenu 
          currentSection="address" 
          onMenuClick={handleMenuClick}
        />
        
        <div className="content-area">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
              <LoadingSpinner size="large" />
            </div>
          ) : currentView === 'list' ? (
            <AddressListPanel 
              addresses={addresses}
              onAddAddress={handleAddAddress}
              onDeleteAddress={handleDeleteAddress}
            />
          ) : (
            <AddAddressPanel onSave={handleSaveAddress} onCancel={handleCancelAdd} />
          )}
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default AddressManagementPage;
