import { HomepageSettingsForm } from '@/components/admin/HomepageSettingsForm';
import { getHomepageSettings } from '@/lib/homepage-settings';

export const dynamic = 'force-dynamic';

export default async function HomepageAdminPage() {
  const settings = await getHomepageSettings();

  return (
    <>
      <h1 className="admin-title">Homepage</h1>
      <HomepageSettingsForm settings={settings} />
    </>
  );
}
