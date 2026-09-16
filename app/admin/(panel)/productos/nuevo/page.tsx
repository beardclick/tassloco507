import { flattenCategories } from '@/lib/admin';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function NuevoProductoPage() {
  return (
    <div>
      <h1 className="admin-title">Nuevo producto</h1>
      <ProductForm categories={await flattenCategories()} />
    </div>
  );
}
