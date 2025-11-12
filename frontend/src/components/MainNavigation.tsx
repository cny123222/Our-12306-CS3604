import React from 'react'
import './MainNavigation.css'

const MainNavigation: React.FC = () => {
  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <a href="/" className="nav-item">首页</a>
        <a href="/tickets" className="nav-item">车票</a>
        <a href="/group-service" className="nav-item">团组服务</a>
        <a href="/member-service" className="nav-item">会员服务</a>
        <a href="/station-service" className="nav-item">站车服务</a>
        <a href="/business-service" className="nav-item">商旅服务</a>
        <a href="/travel-guide" className="nav-item">出行指南</a>
        <a href="/info-query" className="nav-item">信息查询</a>
      </div>
    </nav>
  )
}

export default MainNavigation

