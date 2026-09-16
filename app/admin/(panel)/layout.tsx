import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE, verifyToken } from '@/lib/auth';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!verifyToken(token)) redirect('/admin/login');

  return <AdminShell>{children}</AdminShell>;
}
