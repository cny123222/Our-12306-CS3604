const express = require('express');
const router = express.Router();
const foodService = require('../services/foodService');

router.get('/categories', (req, res) => {
  const data = foodService.getCategories();
  res.json({ categories: data });
});

router.get('/items', (req, res) => {
  const { category } = req.query;
  const data = foodService.getItemsByCategory(category || '');
  res.json({ items: data });
});

router.get('/merchants', (req, res) => {
  const data = foodService.getMerchants();
  res.json({ merchants: data });
});

router.get('/merchant/:id/products', (req, res) => {
  const data = foodService.getMerchantProductsById(req.params.id);
  res.json({ products: data });
});

router.post('/orders', (req, res) => {
  try {
    const result = foodService.createOrder(req.body || {});
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || '下单失败' });
  }
});

module.exports = router;

