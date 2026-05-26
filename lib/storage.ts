import { supabase } from './supabase';

/**
 * Upload an image file to the public `uploads` bucket and return its CDN URL.
 * Throws on Supabase errors — caller should wrap in try/catch.
 */
export async function uploadImage(file: File): Promise<string> {
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(path, file, { cacheControl: '31536000', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return data.publicUrl;
}
