import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './FoodServicePage.css';
import TrainListTopBar from '../components/TrainListTopBar';
import MainNavigation from '../components/MainNavigation';
import BottomNavigation from '../components/BottomNavigation';
import { getCategories, getItems, getMerchants, getMerchantProducts, placeOrder } from '../services/foodService';

type Item = { id: string; name: string; price: number; image?: string; sales?: number; delivery?: string };
type Merchant = { id: string; name: string; rating?: number; deliveryScope?: string };

const FoodServicePage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'食品' | '商家产品' | '商旅服务'>('食品');
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [items, setItems] = useState<Item[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantProducts, setMerchantProducts] = useState<Record<string, Item[]>>({});
  const [cart, setCart] = useState<Record<string, number>>({});
  const [trainInfo, setTrainInfo] = useState<{ trainNo: string; carNumber: string; seatNumber: string }>({ trainNo: '', carNumber: '', seatNumber: '' });
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('authToken'));
    const last = localStorage.getItem('lastOrderTrainInfo');
    const selected = localStorage.getItem('foodSelectedTrainInfo');
    if (last) {
      try {
        const parsed = JSON.parse(last);
        setTrainInfo({
          trainNo: parsed.trainNo || '',
          carNumber: parsed.carNumber || '',
          seatNumber: parsed.seatNumber || '',
        });
      } catch {}
    }
    if (selected) {
      try {
        const parsed = JSON.parse(selected);
        setTrainInfo({
          trainNo: parsed.trainNo || '',
          carNumber: parsed.carNumber || '',
          seatNumber: parsed.seatNumber || '',
        });
      } catch {}
    }
    const state: any = location.state || {};
    if (state.trainInfo) {
      setTrainInfo({
        trainNo: state.trainInfo.trainNo || '',
        carNumber: state.trainInfo.carNumber || '',
        seatNumber: state.trainInfo.seatNumber || '',
      });
    }
    if (state.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const catData = await getCategories();
        if (cancelled) return;
        const list = Array.isArray(catData) ? catData : catData.categories;
        setCategories(list || []);
        const first = (list && list[0]) || '';
        setCurrentCategory(first);
        if (first) {
          const itemData = await getItems(first);
          if (!cancelled) setItems(itemData.items || itemData || []);
        }
        const ms = await getMerchants();
        if (!cancelled) setMerchants(ms.merchants || ms || []);
      } catch (e: any) {
        setMessage(e.message || '加载失败');
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[id]) return next;
      next[id] = next[id] - 1;
      if (next[id] <= 0) delete next[id];
      return next;
    });
  };

  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const allItems = [...items, ...Object.values(merchantProducts).flat()];
    const found = allItems.find((it) => it.id === id);
    return sum + (found ? found.price * qty : 0);
  }, 0);

  const handleSubmit = async () => {
    setMessage('');
    if (!trainInfo.trainNo || !trainInfo.carNumber || !trainInfo.seatNumber) {
      setMessage('请填写车次/车厢/座位信息');
      return;
    }
    if (Object.keys(cart).length === 0) {
      setMessage('请先加入餐品');
      return;
    }
    setIsSubmitting(true);
    try {
      const itemsPayload = Object.entries(cart).map(([id, quantity]) => ({ id, quantity }));
      const resp = await placeOrder({
        items: itemsPayload,
        trainInfo,
        delivery: { type: '到座' },
      });
      if (resp && resp.success) {
        setCart({});
        setMessage(`下单成功，订单号：${resp.foodOrderId}`);
      } else {
        setMessage('下单失败');
      }
    } catch (e: any) {
      setMessage(e.message || '下单失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadMerchantProducts = async (id: string) => {
    try {
      const data = await getMerchantProducts(id);
      setMerchantProducts((prev) => ({ ...prev, [id]: data.products || data || [] }));
    } catch (e: any) {
      setMessage(e.message || '加载商家产品失败');
    }
  };

  return (
    <div className="food-service-page">
      <TrainListTopBar isLoggedIn={isLoggedIn} username={localStorage.getItem('username') || ''} onMy12306Click={() => {}} />
      <MainNavigation isLoggedIn={isLoggedIn} onLoginClick={() => {}} onRegisterClick={() => {}} onPersonalCenterClick={() => {}} />

      <main className="food-service-main">
        <div className="breadcrumb">餐饮服务</div>

        <div className="train-info-form">
          <input
            aria-label="车次"
            placeholder="车次"
            value={trainInfo.trainNo}
            onChange={(e) => setTrainInfo({ ...trainInfo, trainNo: e.target.value })}
          />
          <input
            aria-label="车厢"
            placeholder="车厢"
            value={trainInfo.carNumber}
            onChange={(e) => setTrainInfo({ ...trainInfo, carNumber: e.target.value })}
          />
          <input
            aria-label="座位"
            placeholder="座位"
            value={trainInfo.seatNumber}
            onChange={(e) => setTrainInfo({ ...trainInfo, seatNumber: e.target.value })}
          />
        </div>

        <div className="food-tabs">
          <button className={activeTab === '食品' ? 'active' : ''} onClick={() => setActiveTab('食品')}>食品</button>
          <button className={activeTab === '商家产品' ? 'active' : ''} onClick={() => setActiveTab('商家产品')}>商家产品</button>
          <button className={activeTab === '商旅服务' ? 'active' : ''} onClick={() => setActiveTab('商旅服务')}>商旅服务</button>
        </div>

        {activeTab === '食品' && (
          <section className="food-section">
            <div className="categories">
              {categories.map((c) => (
                <button key={c} className={currentCategory === c ? 'selected' : ''} onClick={async () => {
                  setCurrentCategory(c);
                  try {
                    const data = await getItems(c);
                    setItems(data.items || data || []);
                  } catch (e: any) {
                    setMessage(e.message || '加载商品失败');
                  }
                }}>{c}</button>
              ))}
            </div>
            <div className="food-list">
              {items.map((it) => (
                <div key={it.id} className="food-card">
                  <div className="food-name">{it.name}</div>
                  <div className="food-price">¥{it.price}</div>
                  <div className="food-actions">
                    <button onClick={() => addToCart(it.id)}>加入餐篮</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === '商家产品' && (
          <section className="merchant-section">
            <div className="merchant-list">
              {merchants.map((m) => (
                <div key={m.id} className="merchant-card">
                  <div className="merchant-name">{m.name}</div>
                  <button onClick={() => loadMerchantProducts(m.id)}>查看产品</button>
                  <div className="merchant-products">
                    {(merchantProducts[m.id] || []).map((p) => (
                      <div key={p.id} className="food-card">
                        <div className="food-name">{p.name}</div>
                        <div className="food-price">¥{p.price}</div>
                        <div className="food-actions">
                          <button onClick={() => addToCart(p.id)}>加入餐篮</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === '商旅服务' && (
          <section className="service-section">
            <div className="service-list">
              <div className="service-card">
                <div className="service-name">到站自取</div>
                <div className="service-desc">到站合作点自取特色餐饮</div>
              </div>
              <div className="service-card">
                <div className="service-name">伴手礼</div>
                <div className="service-desc">地方特产专区</div>
              </div>
            </div>
          </section>
        )}

        <div className="cart-summary">
          <div className="cart-total">合计：¥{totalPrice}</div>
          <button className="submit-button" disabled={isSubmitting} onClick={handleSubmit}>立即下单</button>
          {message && <div className="message" role="alert">{message}</div>}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default FoodServicePage;
