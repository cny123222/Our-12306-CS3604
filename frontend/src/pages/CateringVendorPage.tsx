import HomeTopBar from '../components/HomeTopBar'
import MainNavigation from '../components/MainNavigation'
import BottomNavigation from '../components/BottomNavigation'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import './CateringVendorPage.css'

function resolveBrandImage(brand: string) {
  try {
    if (brand.includes('永和大王')) return new URL('../../../requirements/07-餐饮特产页/永和大王.jpg', import.meta.url).href
    if (brand.includes('麦当劳')) return new URL('../../../requirements/07-餐饮特产页/麦当劳.jpg', import.meta.url).href
    if (brand.includes('老娘舅')) return new URL('../../../requirements/07-餐饮特产页/老娘舅.jpg', import.meta.url).href
    if (brand.includes('康师傅')) return new URL('../../../requirements/07-餐饮特产页/康师傅.jpg', import.meta.url).href
    if (brand.includes('德克士')) return new URL('../../../requirements/07-餐饮特产页/德克士.jpg', import.meta.url).href
    if (brand.includes('真功夫')) return new URL('../../../requirements/07-餐饮特产页/真功夫.jpg', import.meta.url).href
  } catch {}
  return '/images/广告.png'
}

export default function CateringVendorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state || {}) as any
  const vendorName: string = state?.name || '商家名称（站店）'
  const minPrice: number = state?.minPrice ?? 0
  const deliveryFee: number = state?.deliveryFee ?? 8
  const departDate: string = state?.date || ''
  const brandImg = resolveBrandImage(vendorName)
  const isLaoNiangJiu = vendorName.includes('老娘舅')
  const isMcdonalds = vendorName.includes('麦当劳')
  const isKangshifu = vendorName.includes('康师傅')
  const isDicos = vendorName.includes('德克士')
  const isZhenGongfu = vendorName.includes('真功夫')
  const contactPhone = isMcdonalds
    ? '021-34688815'
    : isLaoNiangJiu
    ? '15800835487'
    : isKangshifu
    ? '021-64969056'
    : isDicos
    ? '021-64969050'
    : isZhenGongfu
    ? '15901816438'
    : '021-51511025'
  const businessHours = (isMcdonalds || isKangshifu || isDicos)
    ? '营业时间：09:30-20:00'
    : (isLaoNiangJiu || isZhenGongfu ? '营业时间：10:00-20:00' : '营业时间：09:30-19:30')

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    setIsLoggedIn(!!token)
  }, [])
  const username = useMemo(() => {
    return isLoggedIn ? (localStorage.getItem('username') || localStorage.getItem('userId') || '用户') : ''
  }, [isLoggedIn])
  const handleMy12306Click = () => navigate(isLoggedIn ? '/personal-info' : '/login')
  const handleNavigateToLogin = () => navigate('/login')
  const handleNavigateToRegister = () => navigate('/register')
  const handleNavigateToPersonalCenter = () => navigate(isLoggedIn ? '/personal-info' : '/login')

  const p1_yhdw = new URL('../../../requirements/07-餐饮特产页/永和大王/特惠地瓜丸.jpg', import.meta.url).href
  const p2_yhdw = new URL('../../../requirements/07-餐饮特产页/永和大王/蜂蜜柚子饮.jpg', import.meta.url).href
  const p3_yhdw = new URL('../../../requirements/07-餐饮特产页/永和大王/咖喱牛腩饭柚子饮套餐.jpg', import.meta.url).href
  const p4_yhdw = new URL('../../../requirements/07-餐饮特产页/永和大王/双人超值套餐A.jpg', import.meta.url).href
  const lnj1 = new URL('../../../requirements/07-餐饮特产页/老娘舅/新台式卤肉饭.jpg', import.meta.url).href
  const lnj2 = new URL('../../../requirements/07-餐饮特产页/老娘舅/绍兴梅干菜烧肉套餐.jpg', import.meta.url).href
  const lnj3 = new URL('../../../requirements/07-餐饮特产页/老娘舅/鱼香肉丝套餐.jpg', import.meta.url).href
  const mcd1 = new URL('../../../requirements/07-餐饮特产页/麦当劳/只爱甜的便民套餐乘运款.jpg', import.meta.url).href
  const mcd2 = new URL('../../../requirements/07-餐饮特产页/麦当劳/麦麦脆汁鸡（鸡腿）1块.jpg', import.meta.url).href
  const mcd3 = new URL('../../../requirements/07-餐饮特产页/麦当劳/香芋派.jpg', import.meta.url).href
  const mcd4 = new URL('../../../requirements/07-餐饮特产页/麦当劳/鸡牛双堡双人餐乘运款.jpg', import.meta.url).href
  const ksf1 = new URL('../../../requirements/07-餐饮特产页/康师傅/嫩煎厚切牛肉杂粮饭.jpg', import.meta.url).href
  const ksf2 = new URL('../../../requirements/07-餐饮特产页/康师傅/蒲烧鳗鱼杂粮饭.jpg', import.meta.url).href
  const ksf3 = new URL('../../../requirements/07-餐饮特产页/康师傅/嫩煎厚切牛肉杂粮饭可乐两件套.jpg', import.meta.url).href
  const ksf4 = new URL('../../../requirements/07-餐饮特产页/康师傅/蒲烧鳗鱼杂粮饭可乐两件套.jpg', import.meta.url).href
  const dks1 = new URL('../../../requirements/07-餐饮特产页/德克士/左宗棠鸡味炸鸡饭套餐.jpg', import.meta.url).href
  const dks2 = new URL('../../../requirements/07-餐饮特产页/德克士/经典脆爽双鸡堡套餐.jpg', import.meta.url).href
  const dks3 = new URL('../../../requirements/07-餐饮特产页/德克士/经典脆爽双鸡煲.jpg', import.meta.url).href
  const dks4 = new URL('../../../requirements/07-餐饮特产页/德克士/脆皮鸡腿堡套餐（柠香）.jpg', import.meta.url).href
  const zgf1 = new URL('../../../requirements/07-餐饮特产页/真功夫/阳光番茄牛腩饭+元气乌鸡汤+田园彩豆.jpg', import.meta.url).href
  const zgf2 = new URL('../../../requirements/07-餐饮特产页/真功夫/鲜辣排骨饭+香滑蒸蛋+田园彩豆.jpg', import.meta.url).href
  const zgf3 = new URL('../../../requirements/07-餐饮特产页/真功夫/香汁排骨饭+乌鸡汤+田园彩豆.jpg', import.meta.url).href

  const products = isMcdonalds
    ? [
        { id: 'mcd1', name: '只爱甜的便民套餐乘运款', price: 25.0, img: mcd1 },
        { id: 'mcd2', name: '麦麦脆汁鸡(鸡腿)1块', price: 16.0, img: mcd2 },
        { id: 'mcd3', name: '香芋派', price: 9.0, img: mcd3 },
        { id: 'mcd4', name: '鸡牛双堡双人餐乘运款', price: 90.0, img: mcd4 },
      ]
    : isLaoNiangJiu
    ? [
        { id: 'lnj1', name: '新台式卤肉饭', price: 28.0, img: lnj1 },
        { id: 'lnj2', name: '绍兴梅干菜烧肉套餐', price: 48.0, img: lnj2 },
        { id: 'lnj3', name: '鱼香肉丝套餐', price: 39.0, img: lnj3 },
      ]
    : isKangshifu
    ? [
        { id: 'ksf1', name: '嫩煎厚切牛肉杂粮饭', price: 52.0, img: ksf1 },
        { id: 'ksf2', name: '蒲烧鳗鱼杂粮饭', price: 57.0, img: ksf2 },
        { id: 'ksf3', name: '嫩煎厚切牛肉杂粮饭可乐两件套', price: 65.0, img: ksf3 },
        { id: 'ksf4', name: '蒲烧鳗鱼杂粮饭可乐两件套', price: 70.0, img: ksf4 },
      ]
    : isDicos
    ? [
        { id: 'dks1', name: '左宗棠鸡味炸鸡饭套餐', price: 55.0, img: dks1 },
        { id: 'dks2', name: '经典脆爽双鸡堡套餐', price: 36.0, img: dks2 },
        { id: 'dks3', name: '经典脆爽双鸡堡', price: 18.0, img: dks3 },
        { id: 'dks4', name: '脆皮鸡腿堡套餐（柠香）', price: 51.0, img: dks4 },
      ]
    : isZhenGongfu
    ? [
        { id: 'zgf1', name: '阳光番茄牛腩饭+元气乌鸡汤+田园彩豆', price: 53.0, img: zgf1 },
        { id: 'zgf2', name: '鲜辣排骨饭+香滑蒸蛋+田园彩豆', price: 46.0, img: zgf2 },
        { id: 'zgf3', name: '香汁排骨饭+乌鸡汤+田园彩豆', price: 53.0, img: zgf3 },
      ]
    : [
        { id: 'it1', name: '特惠地瓜丸', price: 2.9, img: p1_yhdw },
        { id: 'it2', name: '蜂蜜柚子饮', price: 14.9, img: p2_yhdw },
        { id: 'it3', name: '咖喱牛腩饭柚子饮套餐', price: 58.9, img: p3_yhdw },
        { id: 'it4', name: '双人超值套餐A', price: 99.0, img: p4_yhdw },
      ]

  return (
    <div>
      <HomeTopBar isLoggedIn={isLoggedIn} username={username} onMy12306Click={handleMy12306Click} />
      <MainNavigation
        isLoggedIn={isLoggedIn}
        onLoginClick={handleNavigateToLogin}
        onRegisterClick={handleNavigateToRegister}
        onPersonalCenterClick={handleNavigateToPersonalCenter}
      />

      <div className="vendor-page">
        <div className="breadcrumb">商旅服务 ＞ 餐饮特产 ＞ {vendorName}</div>

        <div className="vendor-header">
          <div className="vh-left">
            <img className="vendor-logo" src={brandImg} alt={vendorName} />
            <div className="vh-info">
              <div className="vendor-title-strong">{vendorName}</div>
              <div className="vendor-stars">★★★★★</div>
              <div className="vendor-contact">{contactPhone}　{businessHours}</div>
            </div>
          </div>
          <div className="vh-right">
            <div className="vh-right-item">
              <div className="vh-right-label">起送费</div>
              <div className="vh-right-value">￥{minPrice.toFixed(2)}</div>
            </div>
            <div className="vh-right-sep"></div>
            <div className="vh-right-item">
              <div className="vh-right-label">配送费</div>
              <div className="vh-right-value">￥{deliveryFee.toFixed(2)}</div>
            </div>
            <div className="vh-right-sep"></div>
            <div className="vh-right-col">
              <div className="vh-right-row">
                <div className="vh-right-label">下单截止</div>
                <div className="vh-right-value">{departDate || '--'} 09:00</div>
              </div>
              <div className="vh-right-row">
                <div className="vh-right-label">退单截止</div>
                <div className="vh-right-value">{departDate || '--'} 09:00</div>
              </div>
            </div>
          </div>
        </div>

        <div className="vendor-tabs">
          <span className="tab active">所有商品</span>
          <span className="tab">平价</span>
          <span className="tab">商家</span>
        </div>

        <div className="vendor-categories">
          <div className="vendor-cat-items">
            {(
              isMcdonalds
                ? ['全部','新品','热销','单人四件套','单人三件套','双人分享餐','小食组合','单品小食','便民套餐']
                : isLaoNiangJiu
                ? ['全部','新品','热销','热销推荐','商务套餐','超值套餐','饮料套餐','副食小吃','再来一碗','甜品饮料','便民套餐']
                : isKangshifu
                ? ['全部','新品','热销','开发票联系','面条米饭单点','私房饮品任选','私房小食任选','臻味私房套餐','私房大大套餐','私房米饭套餐','私房捞面套餐','至尊金牌套餐','单独加面加饭']
                : isDicos
                ? ['全部','新品','热销','饮料自选','发票请联系','汉堡单点','德意饭庄','炸鸡','小食','汉堡套餐','一桶美味']
                : isZhenGongfu
                ? ['全部','新品','热销','真功夫营养套餐含蒸蛋','真功夫营养套餐含汤']
                : ['全部','新品','热销','咖喱饭','饮料','套餐','小吃']
            ).map((c, idx) => (
              <span key={c} className={`cat-item ${idx===0?'active':''}`}>{c}</span>
            ))}
          </div>
        </div>

        <div className="vendor-products">
          {products.map(p => (
            <div key={p.id} className="product-item">
              <img src={p.img} alt={p.name} />
              <div className="pi-right">
                <div className="pi-name">{p.name}</div>
                <div className="pi-price">￥{p.price.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
