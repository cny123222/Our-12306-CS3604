export async function getCategories() {
  const res = await fetch('/api/food/categories');
  if (!res.ok) throw new Error('获取分类失败');
  return res.json();
}

export async function getItems(category: string) {
  const url = `/api/food/items?category=${encodeURIComponent(category)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('获取商品失败');
  return res.json();
}

export async function getMerchants() {
  const res = await fetch('/api/food/merchants');
  if (!res.ok) throw new Error('获取商家失败');
  return res.json();
}

export async function getMerchantProducts(id: string) {
  const res = await fetch(`/api/food/merchant/${id}/products`);
  if (!res.ok) throw new Error('获取商家产品失败');
  return res.json();
}

export async function placeOrder(payload: {
  items: Array<{ id: string; quantity: number }>;
  trainInfo: { trainNo: string; carNumber: string; seatNumber: string };
  delivery: { type: '到座' | '到站自取'; station?: string };
}) {
  const res = await fetch('/api/food/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '下单失败');
  }
  return res.json();
}

