import { getOrderNotificationEmails } from '@/lib/notification-settings';
import { NotificationForm } from '@/components/admin/NotificationForm';

export const dynamic = 'force-dynamic';

export default async function NotificacionesPage() {
  const emails = await getOrderNotificationEmails();

  return (
    <div>
      <h1 className="admin-title">Notificaciones</h1>
      <NotificationForm emails={emails} />
    </div>
  );
}
