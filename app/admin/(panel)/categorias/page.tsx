import Link from 'next/link';
import { flattenCategories } from '@/lib/admin';
import { getCategoryById } from '@/lib/db';
import { getCategoryProductCount } from '@/lib/catalog';
import { DeleteCategoryButton } from '@/components/admin/DeleteCategoryButton';

export const dynamic = 'force-dynamic';

export default async function AdminCategorias() {
  const options = await flattenCategories();
  const cats = await Promise.all(
    options.map(async (c) => {
      const cat = await getCategoryById(c.id);
      const count = cat ? await getCategoryProductCount(cat) : 0;
      const parentName = cat?.parent ? (await getCategoryById(cat.parent))?.name : undefined;
      return { ...c, count, parentName };
    }),
  );

  return (
    <div>
      <div className="admin-card__head" style={{ marginBottom: 16 }}>
        <h1 className="admin-title" style={{ margin: 0 }}>
          Categorías
        </h1>
        <Link href="/admin/categorias/nueva" className="btn btn--red">
          + Nueva categoría
        </Link>
      </div>

      <div className="admin-card">
        {cats.length === 0 ? (
          <p className="admin-empty">No hay categorías.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Padre</th>
                <th>Productos</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id}>
                  <td style={{ paddingLeft: 12 + c.depth * 18 }}>
                    <strong>{c.name}</strong>
                  </td>
                  <td className="admin-muted">{c.parentName ?? '—'}</td>
                  <td>{c.count}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link href={`/admin/categorias/${c.id}`} className="admin-link">
                      Editar
                    </Link>{' '}
                    <DeleteCategoryButton id={c.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
