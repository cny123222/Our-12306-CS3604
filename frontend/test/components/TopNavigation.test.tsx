import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TopNavigation from '../../src/components/TopNavigation'

describe('TopNavigation - 顶部导航组件', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    )
  }

  it('应该渲染Logo区域', () => {
    renderWithRouter(<TopNavigation />)
    
    // 验证Logo区域存在
    const logo = screen.getByAltText(/12306.*logo/i) || screen.getByRole('img')
    expect(logo).toBeInTheDocument()
  })

  it('应该显示"欢迎登录12306"文字', () => {
    renderWithRouter(<TopNavigation />)
    
    // 验证欢迎文字存在
    expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
  })

  it('应该支持Logo点击跳转到首页', () => {
    renderWithRouter(<TopNavigation />)
    
    // 查找Logo链接
    const logoLink = screen.getByRole('link', { name: /12306/i }) || 
                     screen.getAllByRole('link')[0]
    
    // 验证链接指向首页
    expect(logoLink).toHaveAttribute('href', '/') || 
    expect(logoLink).toHaveAttribute('href', '/home')
  })

  it('应该显示Logo图片', () => {
    renderWithRouter(<TopNavigation />)
    
    // 验证Logo图片存在
    const logoImage = screen.getByAltText(/logo/i) || screen.getByRole('img')
    expect(logoImage).toBeInTheDocument()
    
    // 验证图片src包含logo相关路径
    if (logoImage.getAttribute('src')) {
      expect(logoImage.getAttribute('src')).toMatch(/logo/i)
    }
  })

  it('应该包含中国铁路12306相关文字', () => {
    renderWithRouter(<TopNavigation />)
    
    // 验证包含12306相关文字
    const text = screen.getByText(/12306/i)
    expect(text).toBeInTheDocument()
  })

  it('应该有正确的布局结构', () => {
    const { container } = renderWithRouter(<TopNavigation />)
    
    // 验证包含导航元素
    const nav = container.querySelector('nav') || container.querySelector('header')
    expect(nav).toBeInTheDocument()
  })
})

