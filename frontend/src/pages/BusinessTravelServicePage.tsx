import React, { useEffect, useState } from 'react';
import './BusinessTravelServicePage.css';
import TrainListTopBar from '../components/TrainListTopBar';
import MainNavigation from '../components/MainNavigation';
import BottomNavigation from '../components/BottomNavigation';
import { useNavigate } from 'react-router-dom';

const BusinessTravelServicePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [trainNo, setTrainNo] = useState('');
  const [departureStation, setDepartureStation] = useState('');
  const [arrivalStation, setArrivalStation] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [deliveryType, setDeliveryType] = useState<'到座' | '到站自取'>('到座');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('authToken'));
  }, []);

  const validate = () => {
    if (!trainNo || !departureStation || !arrivalStation) {
      setMessage('请填写车次和出发/到达站');
      return false;
    }
    if (deliveryType === '到座' && (!carNumber || !seatNumber)) {
      setMessage('到座配送需填写车厢与座位');
      return false;
    }
    setMessage('');
    return true;
  };

  const navigateToFood = (tab: '食品' | '商家产品') => {
    if (!validate()) return;
    const trainInfo = { trainNo, carNumber, seatNumber };
    const state = { trainInfo, deliveryType, activeTab: tab };
    try {
      localStorage.setItem('foodSelectedTrainInfo', JSON.stringify(trainInfo));
    } catch {}
    navigate('/food', { state });
  };

  return (
    <div className="business-travel-page">
      <TrainListTopBar isLoggedIn={isLoggedIn} username={localStorage.getItem('username') || ''} onMy12306Click={() => {}} />
      <MainNavigation isLoggedIn={isLoggedIn} onLoginClick={() => {}} onRegisterClick={() => {}} onPersonalCenterClick={() => {}} />
      <main className="business-travel-main">
        <div className="breadcrumb">商旅服务</div>
        <div className="bts-form">
          <div className="form-row">
            <input aria-label="车次" placeholder="车次" value={trainNo} onChange={(e) => setTrainNo(e.target.value)} />
            <input aria-label="出发站" placeholder="出发站" value={departureStation} onChange={(e) => setDepartureStation(e.target.value)} />
            <input aria-label="到达站" placeholder="到达站" value={arrivalStation} onChange={(e) => setArrivalStation(e.target.value)} />
          </div>
          <div className="form-row">
            <label>
              <input type="radio" name="delivery" checked={deliveryType === '到座'} onChange={() => setDeliveryType('到座')} /> 到座配送
            </label>
            <label>
              <input type="radio" name="delivery" checked={deliveryType === '到站自取'} onChange={() => setDeliveryType('到站自取')} /> 到站自取
            </label>
          </div>
          {deliveryType === '到座' && (
            <div className="form-row">
              <input aria-label="车厢" placeholder="车厢" value={carNumber} onChange={(e) => setCarNumber(e.target.value)} />
              <input aria-label="座位" placeholder="座位" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
            </div>
          )}
        </div>
        <div className="bts-actions">
          <button onClick={() => navigateToFood('食品')}>去订餐</button>
          <button onClick={() => navigateToFood('商家产品')}>进入商家</button>
        </div>
        {message && <div className="message" role="alert">{message}</div>}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default BusinessTravelServicePage;

