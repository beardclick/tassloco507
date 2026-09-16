import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/db';
import { flattenCategories } from '@/lib/admin';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(Number(id));
  if (!product) notFound();

  return (
    <div>
      <h1 className="admin-title">Editar producto</h1>
      <ProductForm product={product} categories={flattenCategories()} />
    </div>
  );
}
