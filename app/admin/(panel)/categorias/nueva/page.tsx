import { flattenCategories } from '@/lib/admin';
import { CategoryForm } from '@/components/admin/CategoryForm';

export const dynamic = 'force-dynamic';

export default function NuevaCategoriaPage() {
  return (
    <div>
      <h1 className="admin-title">Nueva categoría</h1>
      <CategoryForm categories={flattenCategories()} />
    </div>
  );
}
