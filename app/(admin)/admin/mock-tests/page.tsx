import { redirect } from 'next/navigation';
import { requireAdmin } from '@/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import { MockTestsManager } from '@/components/admin/cms/MockTestsManager';

export default async function MockTestsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/login');
  }

  return (
    <AdminLayout>
      <MockTestsManager />
    </AdminLayout>
  );
}
