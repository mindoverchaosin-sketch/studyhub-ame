import { redirect } from 'next/navigation';
import { requireAdmin } from '@/auth';import { MockTestsManager } from '@/components/admin/cms/MockTestsManager';

export default async function MockTestsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/login');
  }

  return (
    <MockTestsManager />
  );
}
