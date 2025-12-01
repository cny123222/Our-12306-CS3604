const categories = ['主食', '套餐', '饮料', '小吃'];

const items = {
  主食: [
    { id: 'meal-001', name: '铁道盒饭', price: 35 },
    { id: 'meal-002', name: '牛肉饭', price: 42 },
  ],
  套餐: [
    { id: 'set-001', name: '双人套餐', price: 88 },
    { id: 'set-002', name: '家庭套餐', price: 128 },
  ],
  饮料: [
    { id: 'drink-001', name: '矿泉水', price: 5 },
    { id: 'drink-002', name: '可乐', price: 6 },
  ],
  小吃: [
    { id: 'snack-001', name: '卤蛋', price: 4 },
    { id: 'snack-002', name: '薯片', price: 8 },
  ],
};

const merchants = [
  { id: 'm-001', name: '车厢餐吧', rating: 4.6, deliveryScope: '全列配送' },
  { id: 'm-002', name: '高铁站自取点', rating: 4.4, deliveryScope: '到站自取' },
];

const merchantProducts = {
  'm-001': [
    { id: 'm1-001', name: '招牌便当', price: 40 },
    { id: 'm1-002', name: '时蔬套餐', price: 32 },
  ],
  'm-002': [
    { id: 'm2-001', name: '特产礼包', price: 68 },
    { id: 'm2-002', name: '伴手礼组合', price: 98 },
  ],
};

let orderSeq = 1000;

function getCategories() {
  return categories;
}

function getItemsByCategory(category) {
  return items[category] || [];
}

function getMerchants() {
  return merchants;
}

function getMerchantProductsById(id) {
  return merchantProducts[id] || [];
}

function createOrder(payload) {
  const { items: its, trainInfo, delivery } = payload || {};
  if (!trainInfo || !trainInfo.trainNo || !trainInfo.carNumber || !trainInfo.seatNumber) {
    const err = new Error('缺少乘车信息');
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(its) || its.length === 0) {
    const err = new Error('餐品为空');
    err.status = 400;
    throw err;
  }
  const totalPrice = its.reduce((sum, 
    { id, quantity }) => {
    const catalog = Object.values(items).flat().concat(Object.values(merchantProducts).flat());
    const found = catalog.find((x) => x.id === id);
    return sum + (found ? found.price * quantity : 0);
  }, 0);
  orderSeq += 1;
  const foodOrderId = `FOOD-${orderSeq}`;
  return {
    success: true,
    foodOrderId,
    summary: {
      items: its,
      totalPrice,
    },
    eta: '约30分钟',
    delivery,
  };
}

module.exports = {
  getCategories,
  getItemsByCategory,
  getMerchants,
  getMerchantProductsById,
  createOrder,
};

