import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/apiClient';

vi.mock('../lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('../lib/apiClient')>('../lib/apiClient');
  return { ...actual, api: { ...actual.api, session: vi.fn() } };
});

const Probe = () => {
  const { user, profile, loading } = useAuth();
  if (loading) return <p>loading</p>;
  return <p>{user ? `signed-in:${profile?.status}` : 'no-session'}</p>;
};

describe('AuthProvider', () => {
  it('renders consumers without throwing and exposes an empty session (audit F-01)', async () => {
    vi.mocked(api.session).mockResolvedValue({ user: null, profile: null });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('no-session')).toBeTruthy());
  });

  it('exposes the membership status so a pending account sees the approval screen', async () => {
    vi.mocked(api.session).mockResolvedValue({
      user: { id: 'u1', email: 'guru@sekolah.edu.my', name: 'Guru' },
      profile: { id: 'u1', email: 'guru@sekolah.edu.my', name: 'Guru', role: 'teacher', status: 'pending' },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('signed-in:pending')).toBeTruthy());
  });
});
