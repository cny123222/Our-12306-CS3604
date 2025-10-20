import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import './App.css';

function App() {
  const handleLoginSuccess = (userInfo: any, accessToken: string) => {
    console.log('登录成功:', userInfo);
    console.log('访问令牌:', accessToken);
    // TODO: 处理登录成功后的逻辑，比如跳转到首页
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              <LoginPage 
                onLoginSuccess={handleLoginSuccess}
                onNavigateToRegister={() => console.log('跳转到注册页')}
                onNavigateToForgotPassword={() => console.log('跳转到忘记密码页')}
                onNavigateToHome={() => console.log('跳转到首页')}
              />
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;