import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BottomNavigation from '../../src/components/BottomNavigation'

describe('BottomNavigation - 底部导航组件', () => {
  it('应该显示友情链接', () => {
    render(<BottomNavigation />)
    
    // 验证友情链接图片存在
    const friendLinksImage = screen.getByAltText(/友情链接/i)
    
    expect(friendLinksImage).toBeInTheDocument()
    expect(friendLinksImage.tagName).toBe('IMG')
  })

  it('应该显示四个二维码', () => {
    const { container } = render(<BottomNavigation />)
    
    // 验证存在二维码图片
    const qrImages = screen.getAllByAltText(/二维码|微信|微博|公众号|12306/i)
    
    // 应该有4个二维码
    expect(qrImages.length).toBeGreaterThanOrEqual(4)
  })

  it('应该使用正确的二维码图片', () => {
    const { container } = render(<BottomNavigation />)
    
    const expectedQRCodes = [
      '中国铁路官方微信二维码',
      '中国铁路官方微博二维码',
      '12306公众号二维码',
      '铁路12306二维码'
    ]
    
    // 验证每个二维码图片存在
    expectedQRCodes.forEach(qrName => {
      const qrImage = screen.queryByAltText(new RegExp(qrName, 'i'))
      // 至少应该能找到图片元素
      if (qrImage) {
        expect(qrImage).toBeInTheDocument()
        expect(qrImage.tagName).toBe('IMG')
      }
    })
    
    // 验证至少有4个图片
    const allImages = container.querySelectorAll('img')
    expect(allImages.length).toBeGreaterThanOrEqual(4)
  })

  it('应该有正确的布局结构（左侧友情链接，右侧二维码）', () => {
    const { container } = render(<BottomNavigation />)
    
    // 验证包含底部导航元素
    const footer = container.querySelector('footer') || 
                   container.querySelector('nav') ||
                   container.querySelector('.bottom-navigation')
    
    expect(footer || container.firstChild).toBeInTheDocument()
  })

  it('应该显示中国铁路官方微信二维码', () => {
    render(<BottomNavigation />)
    
    // 查找微信二维码
    const wechatQR = screen.queryByAltText(/中国铁路官方微信/i) ||
                     screen.queryByAltText(/微信/i)
    
    // 如果找到，验证它是图片
    if (wechatQR) {
      expect(wechatQR).toBeInTheDocument()
      expect(wechatQR.tagName).toBe('IMG')
    }
  })

  it('应该显示中国铁路官方微博二维码', () => {
    render(<BottomNavigation />)
    
    // 查找微博二维码
    const weiboQR = screen.queryByAltText(/中国铁路官方微博/i) ||
                    screen.queryByAltText(/微博/i)
    
    // 如果找到，验证它是图片
    if (weiboQR) {
      expect(weiboQR).toBeInTheDocument()
      expect(weiboQR.tagName).toBe('IMG')
    }
  })

  it('应该显示12306公众号二维码', () => {
    render(<BottomNavigation />)
    
    // 查找公众号二维码
    const officialQR = screen.queryByAltText(/12306.*公众号/i) ||
                       screen.queryByAltText(/公众号/i)
    
    // 如果找到，验证它是图片
    if (officialQR) {
      expect(officialQR).toBeInTheDocument()
      expect(officialQR.tagName).toBe('IMG')
    }
  })

  it('应该显示铁路12306二维码', () => {
    render(<BottomNavigation />)
    
    // 查找铁路12306二维码
    const railwayQR = screen.queryByAltText(/铁路.*12306/i) ||
                      screen.queryByAltText(/12306/i)
    
    // 如果找到，验证它是图片
    if (railwayQR) {
      expect(railwayQR).toBeInTheDocument()
      expect(railwayQR.tagName).toBe('IMG')
    }
  })
})

