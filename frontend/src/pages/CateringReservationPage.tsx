import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import HomeTopBar from '../components/HomeTopBar'
import MainNavigation from '../components/MainNavigation'
import BottomNavigation from '../components/BottomNavigation'
import StationInput from '../components/StationInput'
import './CateringReservationPage.css'
import { getTrainDetails } from '../services/trainService'

const CateringReservationPage = () => {
  const navigate = useNavigate()
  const location = useLocation() as any
  const init = location.state || {}
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [date, setDate] = useState<string>(init.date || '')
  const [trainNo, setTrainNo] = useState(init.trainNo || '')
  const [trainNoInput, setTrainNoInput] = useState(init.trainNo || '')
  const [departureStation, setDepartureStation] = useState(init.departureStation || '')
  const [arrivalStation, setArrivalStation] = useState(init.arrivalStation || '')
  const [onlyReservable, setOnlyReservable] = useState(false)
  const lastFetchKeyRef = useRef<string | null>(null)
  const [trainDepartTime, setTrainDepartTime] = useState<string>('')
  const [trainArrivalTime, setTrainArrivalTime] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    setIsLoggedIn(!!token)
    if (!date) {
      const d = new Date()
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      setDate(`${yyyy}-${mm}-${dd}`)
    }
  }, [])

  useEffect(() => {
    const fetchStationsByTrain = async () => {
      if (!trainNo || trainNo.trim().length < 2) return
      const key = `${trainNo.trim()}|${date}`
      if (lastFetchKeyRef.current === key) return
      lastFetchKeyRef.current = key
      const details = await getTrainDetails(trainNo.trim(), date)
      if (details.success && details.train && details.train.route) {
        setDepartureStation(details.train.route.origin || '')
        setArrivalStation(details.train.route.destination || '')
        setTrainDepartTime(details.train.route.departureTime || '')
        setTrainArrivalTime(details.train.route.arrivalTime || '')
      }
    }
    fetchStationsByTrain()
  }, [trainNo, date])

  const username = useMemo(() => {
    return isLoggedIn ? (localStorage.getItem('username') || localStorage.getItem('userId') || '用户') : ''
  }, [isLoggedIn])

  const handleMy12306Click = () => {
    navigate(isLoggedIn ? '/personal-info' : '/login')
  }

  const handleNavigateToLogin = () => navigate('/login')
  const handleNavigateToRegister = () => navigate('/register')
  const handleNavigateToPersonalCenter = () => navigate(isLoggedIn ? '/personal-info' : '/login')

  const img15 = new URL('../../../requirements/07-餐饮特产页/列车自营商品-15元.jpg', import.meta.url).href
  const img30 = new URL('../../../requirements/07-餐饮特产页/列车自营商品-30元.jpg', import.meta.url).href
  const img40 = new URL('../../../requirements/07-餐饮特产页/列车自营商品-40元.jpg', import.meta.url).href

  const trainProducts = [
    { id: 'p15', name: '15元冷链餐', price: 15, img: img15 },
    { id: 'p30', name: '30元冷链餐', price: 30, img: img30 },
    { id: 'p40', name: '40元冷链餐', price: 40, img: img40 },
  ]

  const imgYongHe = new URL('../../../requirements/07-餐饮特产页/永和大王.jpg', import.meta.url).href
  const imgMaiDangLao = new URL('../../../requirements/07-餐饮特产页/麦当劳.jpg', import.meta.url).href
  const imgLaoNiangJiu = new URL('../../../requirements/07-餐饮特产页/老娘舅.jpg', import.meta.url).href
  const imgKangShiFu = new URL('../../../requirements/07-餐饮特产页/康师傅.jpg', import.meta.url).href
  const imgDeKeShi = new URL('../../../requirements/07-餐饮特产页/德克士.jpg', import.meta.url).href
  const imgZhenGongFu = new URL('../../../requirements/07-餐饮特产页/真功夫.jpg', import.meta.url).href

  const vendorsDeparture = useMemo(() => [
    { id: 'vd1', name: `永和大王（${departureStation}站店）`, status: 'open', minPrice: 0, deliveryFee: 8, img: imgYongHe },
    { id: 'vd2', name: `老娘舅（${departureStation}站店）`, status: 'closed', minPrice: 0, deliveryFee: 8, img: imgLaoNiangJiu },
    { id: 'vd3', name: `麦当劳（${departureStation}站店）`, status: 'closed', minPrice: 0, deliveryFee: 8, img: imgMaiDangLao },
  ], [departureStation])

  const vendorsArrival = useMemo(() => [
    { id: 'va1', name: `康师傅（${arrivalStation}站店）`, status: 'open', minPrice: 0, deliveryFee: 8, img: imgKangShiFu },
    { id: 'va2', name: `德克士（${arrivalStation}站店）`, status: 'closed', minPrice: 0, deliveryFee: 8, img: imgDeKeShi },
    { id: 'va3', name: `真功夫（${arrivalStation}站店）`, status: 'closed', minPrice: 0, deliveryFee: 8, img: imgZhenGongFu },
  ], [arrivalStation])

  const filterVendors = (list: any[]) => {
    if (!onlyReservable) return list
    return list.filter(v => v.status === 'open')
  }

  const handleSearch = () => {
    setTrainNo(trainNoInput)
  }

  return (
    <div className="catering-reserve-page">
      <HomeTopBar isLoggedIn={isLoggedIn} username={username} onMy12306Click={handleMy12306Click} />
      <MainNavigation
        isLoggedIn={isLoggedIn}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToPersonalCenter}
      />
      <div className="reserve-search-wrapper">
        <div className="search-panel">
          <div className="search-top-row">
            <div className="field-group">
              <span className="field-label">乘车日期</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="field-input" />
            </div>
            <div className="field-group">
              <span className="field-label">车次</span>
              <input type="text" placeholder="G10" value={trainNoInput} onChange={e => setTrainNoInput(e.target.value)} className="field-input" />
            </div>
            <div className="field-group">
              <span className="field-label">乘车站</span>
              <div className="field-input">
                <StationInput value={departureStation} placeholder="乘车站" type="departure" onChange={setDepartureStation} onSelect={setDepartureStation} />
              </div>
            </div>
            <div className="field-group">
              <span className="field-label">到达站</span>
              <div className="field-input">
                <StationInput value={arrivalStation} placeholder="到达站" type="arrival" onChange={setArrivalStation} onSelect={setArrivalStation} />
              </div>
            </div>
            <div className="field-group query">
              <button className="query-btn" onClick={handleSearch}>查询</button>
            </div>
          </div>
          <div className="search-divider"></div>
          <div className="search-bottom-row">
            <div className="distribution-left">
              <span className="distribution-label">配送站：</span>
              <button className="btn-all">全部</button>
              {departureStation && (
                <label className="distribution-option">
                  <input type="checkbox" /> {departureStation}
                </label>
              )}
              {arrivalStation && (
                <label className="distribution-option">
                  <input type="checkbox" /> {arrivalStation}
                </label>
              )}
            </div>
            <label className="reserve-checkbox right">
              <input type="checkbox" checked={onlyReservable} onChange={e => setOnlyReservable(e.target.checked)} />
              显示可预订商家
            </label>
          </div>
        </div>
      </div>

      <div className="section-title-row">列车自营商品</div>
      <div className="section-divider"></div>
      <div className="product-grid">
        {trainProducts.map(p => (
          <div key={p.id} className="product-card">
            <div className="product-image-wrapper">
              <img className="product-image" src={p.img} alt={p.name} />
              <div className="product-image-overlay"></div>
            </div>
            <div className="product-right">
              <div className="product-right-name">{p.name}</div>
              <div className="product-right-price">￥{p.price.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>

      {departureStation && (
        <div className="vendor-section">
          <div className="vendor-title">{departureStation}（开车日期：{date} 开车时间：{trainDepartTime || '--:--'}）</div>
          <div className="vendor-divider"></div>
          <div className="vendor-grid">
            {filterVendors(vendorsDeparture).map(v => (
              <div
                key={v.id}
                className={`vendor-card ${v.status === 'closed' ? 'closed' : ''}`}
                onClick={() => navigate('/catering/vendor', { state: { name: v.name, station: departureStation, minPrice: v.minPrice, deliveryFee: v.deliveryFee, date, departTime: trainDepartTime } })}
              >
                <img src={v.img} alt={v.name} />
                <div className="vendor-info">
                  <div className="vendor-name">{v.name}</div>
                  <div className="vendor-meta">起送：￥{v.minPrice.toFixed(2)}｜配送费：￥{v.deliveryFee.toFixed(2)}</div>
                </div>
                {v.status === 'closed' && <div className="vendor-status">休息中</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {arrivalStation && (
        <div className="vendor-section">
          <div className="vendor-title">{arrivalStation}（开车日期：{date} 开车时间：{trainArrivalTime || '--:--'}）</div>
          <div className="vendor-divider"></div>
          <div className="vendor-grid">
            {filterVendors(vendorsArrival).map(v => (
              <div
                key={v.id}
                className={`vendor-card ${v.status === 'closed' ? 'closed' : ''}`}
                onClick={() => navigate('/catering/vendor', { state: { name: v.name, station: arrivalStation, minPrice: v.minPrice, deliveryFee: v.deliveryFee, date, departTime: trainDepartTime } })}
              >
                <img src={v.img} alt={v.name} />
                <div className="vendor-info">
                  <div className="vendor-name">{v.name}</div>
                  <div className="vendor-meta">起送：￥{v.minPrice.toFixed(2)}｜配送费：￥{v.deliveryFee.toFixed(2)}</div>
                </div>
                {v.status === 'closed' && <div className="vendor-status">休息中</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}

export default CateringReservationPage
