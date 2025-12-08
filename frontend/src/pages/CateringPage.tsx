import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HomeTopBar from '../components/HomeTopBar'
import MainNavigation from '../components/MainNavigation'
import BottomNavigation from '../components/BottomNavigation'
import StationInput from '../components/StationInput'
import './CateringPage.css'

const CateringPage = () => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [date, setDate] = useState<string>('')
  const [trainNo, setTrainNo] = useState('')
  const [departureStation, setDepartureStation] = useState('')
  const [arrivalStation, setArrivalStation] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    setIsLoggedIn(!!token)
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setDate(`${yyyy}-${mm}-${dd}`)
  }, [])

  const username = useMemo(() => {
    return isLoggedIn ? (localStorage.getItem('username') || localStorage.getItem('userId') || '用户') : ''
  }, [isLoggedIn])

  const handleMy12306Click = () => {
    if (isLoggedIn) {
      navigate('/personal-info')
    } else {
      navigate('/login')
    }
  }

  const handleNavigateToLogin = () => navigate('/login')
  const handleNavigateToRegister = () => navigate('/register')
  const handleNavigateToPersonalCenter = () => navigate(isLoggedIn ? '/personal-info' : '/login')

  const handleSearch = () => {
    navigate('/catering/reserve', {
      state: { date, trainNo, departureStation, arrivalStation }
    })
  }

  return (
    <div className="catering-page">
      <HomeTopBar isLoggedIn={isLoggedIn} username={username} onMy12306Click={handleMy12306Click} />
      <MainNavigation
        isLoggedIn={isLoggedIn}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToPersonalCenter}
      />
      <div className="catering-hero">
        <div className="catering-hero-content">
          <div className="catering-hero-title">带有温度的旅途配餐，享受星级的体验，</div>
          <div className="catering-hero-title">家乡的味道</div>
          <div className="catering-search-bar">
            <div className="catering-col w210">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="catering-input date" />
            </div>
            <div className="catering-col w210">
              <input type="text" placeholder="车次" value={trainNo} onChange={e => setTrainNo(e.target.value)} className="catering-input train" />
            </div>
            <div className="catering-col w210">
              <StationInput value={departureStation} placeholder="乘车站" type="departure" onChange={setDepartureStation} onSelect={setDepartureStation} />
            </div>
            <div className="catering-col w210">
              <StationInput value={arrivalStation} placeholder="到达站" type="arrival" onChange={setArrivalStation} onSelect={setArrivalStation} />
            </div>
            <div className="catering-col w137">
              <button className="catering-search-button" onClick={handleSearch}>搜索</button>
            </div>
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}

export default CateringPage
