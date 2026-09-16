import { notFound } from 'next/navigation';
import { getCategoryById } from '@/lib/db';
import { flattenCategories } from '@/lib/admin';
import { CategoryForm } from '@/components/admin/CategoryForm';

export const dynamic = 'force-dynamic';

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategoryById(Number(id));
  if (!category) notFound();

  return (
    <div>
      <h1 className="admin-title">Editar categoría</h1>
      <CategoryForm category={category} categories={await flattenCategories()} />
    </div>
  );
}
