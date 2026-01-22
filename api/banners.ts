
import { supabase } from '@/lib/supabase';

export interface Banner {
  id: number;
  title: string;
  short_description: string | null;
  long_description: string | null;
  tag: string | null; // 'PROMO', 'EVENTO', 'NOTICIA', 'URGENTE', 'NUEVO', 'INFO'
  expiration_date: string | null;
  external_link: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

export const BannersAPI = {
  getBanners: async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Banner[];
  },
};
