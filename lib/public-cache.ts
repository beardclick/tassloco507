import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';

export function invalidatePublicCatalog() {
  revalidateTag('public-catalog');
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/producto/[slug]', 'page');
  revalidatePath('/categoria-producto/[[...slug]]', 'page');
}
