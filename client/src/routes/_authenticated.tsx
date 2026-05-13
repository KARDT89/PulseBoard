import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { authApi } from '../api/auth.api';
// import Nav from '../components/app/nav';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    try {
      const { data } = await authApi.getMe();
      return { user: data.data.user };
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <div className="min-h-screen bg-background">
      {/* <Nav /> */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  ),
});