import { MOCK_PRODUCTS } from '@/constants/mocks';
import { supabase } from '@/lib/supabase';

export const StoreAPI = {
  getProducts: async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, image, category')
        .order('name');

      if (error) throw error;
      return data && data.length > 0 ? data : MOCK_PRODUCTS;
    } catch (error) {
      console.warn('[StoreAPI] Error fetching products, using mocks:', error);
      return MOCK_PRODUCTS;
    }
  },
};
