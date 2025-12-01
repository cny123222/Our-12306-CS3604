import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BusinessTravelServicePage from '../../src/pages/BusinessTravelServicePage';
import FoodServicePage from '../../src/pages/FoodServicePage';

describe('商旅服务选择页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((k: string) => (k === 'authToken' ? 'test-token' : null)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
      writable: true,
    });
  });

  it('表单校验与去订餐跳转', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/business-travel' }] }>
        <Routes>
          <Route path="/business-travel" element={<BusinessTravelServicePage />} />
          <Route path="/food" element={<FoodServicePage />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText('车次'), 'G123');
    await userEvent.type(screen.getByPlaceholderText('出发站'), '北京南');
    await userEvent.type(screen.getByPlaceholderText('到达站'), '上海虹桥');
    await userEvent.type(screen.getByPlaceholderText('车厢'), '3');
    await userEvent.type(screen.getByPlaceholderText('座位'), '12A');

    const button = screen.getByRole('button', { name: '去订餐' });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByLabelText('车次')).toHaveValue('G123');
    });
  });

  it('进入商家跳转到商家产品分栏', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/business-travel' }] }>
        <Routes>
          <Route path="/business-travel" element={<BusinessTravelServicePage />} />
          <Route path="/food" element={<FoodServicePage />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText('车次'), 'G999');
    await userEvent.type(screen.getByPlaceholderText('出发站'), '杭州东');
    await userEvent.type(screen.getByPlaceholderText('到达站'), '宁波');

    const radio = screen.getByLabelText('到站自取');
    await userEvent.click(radio);

    const button = screen.getByRole('button', { name: '进入商家' });
    await userEvent.click(button);

    await waitFor(() => {
      const tabBtn = screen.getByRole('button', { name: '商家产品' });
      expect(tabBtn).toBeInTheDocument();
    });
  });
});
