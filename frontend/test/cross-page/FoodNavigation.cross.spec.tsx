import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithRouter, setupLocalStorageMock, cleanupTest, mockAuthenticatedUser } from './test-utils';
import SuccessfulPurchasePage from '../../src/pages/SuccessfulPurchasePage';
import FoodServicePage from '../../src/pages/FoodServicePage';

describe('购票成功页到餐饮服务页导航', () => {
  beforeEach(() => {
    cleanupTest();
    setupLocalStorageMock();
    mockAuthenticatedUser();
  });

  it('点击“餐饮·特产”跳转到餐饮服务页', async () => {
    const mock = vi.fn();
    global.fetch = mock as any;

    mock
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        trainInfo: { trainNo: 'G123', departureStation: '北京南', arrivalStation: '上海虹桥', departureTime: '08:00', arrivalTime: '12:00' },
        passengers: [{ sequence: 1, name: '张三', seatType: '二等座', carNumber: '3', seatNumber: '12A' }],
        totalPrice: 553,
      }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ categories: ['主食'] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [{ id: 'meal-001', name: '铁道盒饭', price: 35 }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ merchants: [] }) });

    await renderWithRouter({
      routes: [
        { path: '/purchase-success/:orderId', element: <SuccessfulPurchasePage /> },
        { path: '/food', element: <FoodServicePage /> },
      ],
      initialEntries: [{ pathname: '/purchase-success/abcd1234' }],
    });

    const btn = await screen.findByRole('button', { name: '餐饮·特产' });
    await userEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText('餐饮服务')).toBeInTheDocument();
    });
  });
});
