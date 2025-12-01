import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import FoodServicePage from '../../src/pages/FoodServicePage';

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('餐饮服务页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((k: string) => (k === 'authToken' ? 'test-token' : k === 'lastOrderTrainInfo' ? JSON.stringify({ trainNo: 'G123', carNumber: '3', seatNumber: '12A' }) : null)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
      writable: true,
    });

    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ categories: ['主食', '饮料'] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [{ id: 'meal-001', name: '铁道盒饭', price: 35 }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ merchants: [{ id: 'm-001', name: '车厢餐吧' }] }) });
  });

  it('渲染基本UI元素与分栏', async () => {
    render(
      <MemoryRouter>
        <FoodServicePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('餐饮服务')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '食品' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '商家产品' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '商旅服务' })).toBeInTheDocument();
      expect(screen.getByText('铁道盒饭')).toBeInTheDocument();
    });
  });

  it('加入餐篮并下单成功', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ foodOrderId: 'FOOD-1001', success: true, summary: { totalPrice: 35 } }) });

    render(
      <MemoryRouter>
        <FoodServicePage />
      </MemoryRouter>
    );

    const addBtn = await screen.findByRole('button', { name: '加入餐篮' });
    await userEvent.click(addBtn);

    const submit = screen.getByRole('button', { name: '立即下单' });
    await userEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/下单成功/);
    });
  });
});

