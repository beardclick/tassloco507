// Crea el bucket público de imágenes en Supabase Storage.
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await sb.storage.createBucket('product-images', { public: true });
if (error) {
  if (/already exists|duplicate/i.test(error.message)) {
    console.log('Bucket "product-images" ya existe.');
  } else {
    console.error('Error creando el bucket:', error.message);
    process.exit(1);
  }
} else {
  console.log('Bucket "product-images" creado (público):', data?.name);
}
