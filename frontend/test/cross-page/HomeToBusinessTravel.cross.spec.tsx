import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HomePage from '../../src/pages/HomePage';
import BusinessTravelServicePage from '../../src/pages/BusinessTravelServicePage';
import { renderWithRouter, setupLocalStorageMock, cleanupTest } from './test-utils';

describe('首页到商旅服务选择页导航', () => {
  beforeEach(() => {
    cleanupTest();
    setupLocalStorageMock();
  });

  it('点击主导航“商旅服务”跳转到/business-travel', async () => {
    await renderWithRouter({
      initialEntries: ['/'],
      routes: [
        { path: '/', element: <HomePage /> },
        { path: '/business-travel', element: <BusinessTravelServicePage /> },
      ],
    });

    const link = screen.getByRole('link', { name: /商旅服务/i });
    await userEvent.click(link);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('车次')).toBeInTheDocument();
    });
  });
});
