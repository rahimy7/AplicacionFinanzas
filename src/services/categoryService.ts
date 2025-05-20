// src/services/categoryService.ts
import { supabase } from '../database/supabase';
import { Category, CategoryWithChildren, getCategories, addCategory, addSubcategory } from '../database/asyncStorageDB';

// Interfaz para la estructura de categorías en Supabase
interface SupabaseCategory {
  id: string;
  nombre: string;
  tipo: 'ingreso' | 'gasto';
  color: string;
  icono: string;
  categoriaPadreId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Función para obtener todas las categorías de Supabase
export const fetchCategoriesFromSupabase = async (): Promise<SupabaseCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('createdAt', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener categorías de Supabase:', error);
    return [];
  }
};

// Función para crear una categoría en Supabase
export const createCategoryInSupabase = async (
  category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SupabaseCategory | null> => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        nombre: category.nombre,
        tipo: category.tipo,
        color: category.color,
        icono: category.icono,
        categoriaPadreId: category.categoriaPadreId || null,
        createdAt: now,
        updatedAt: now
      }])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al crear categoría en Supabase:', error);
    return null;
  }
};

// Función para crear una subcategoría tanto localmente como en Supabase
export const createSubcategory = async (
  categoriaPadreId: string,
  subcategory: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'categoriaPadreId'>
): Promise<Category | null> => {
  try {
    // Primero crear en Supabase para obtener un ID
    const supabaseSubcategory = await createCategoryInSupabase({
      ...subcategory,
      categoriaPadreId
    });
    
    if (!supabaseSubcategory) {
      throw new Error('No se pudo crear la subcategoría en Supabase');
    }
    
    // Luego crear localmente con el mismo ID
    const localSubcategory: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = {
      nombre: supabaseSubcategory.nombre,
      tipo: supabaseSubcategory.tipo,
      color: supabaseSubcategory.color,
      icono: supabaseSubcategory.icono,
      categoriaPadreId,
      esSubcategoria: false
    };
    
    const newSubcategory = await addSubcategory(categoriaPadreId, localSubcategory);
    return newSubcategory;
  } catch (error) {
    console.error('Error al crear subcategoría:', error);
    return null;
  }
};

// Función para sincronizar categorías y subcategorías entre Supabase y el almacenamiento local
export const syncCategories = async (): Promise<number> => {
  try {
    // Obtener categorías de Supabase
    const supabaseCategories = await fetchCategoriesFromSupabase();
    
    // Obtener categorías locales
    const localCategories = await getCategories();
    
    // Crear mapa de categorías locales por ID
    const localCategoryMap = new Map(
      localCategories.map(category => [category.id, category])
    );
    
    let newCategoriesCount = 0;
    
    // Procesar categorías de Supabase
    for (const supabaseCat of supabaseCategories) {
      // Si no existe localmente, agregarla
      if (!localCategoryMap.has(supabaseCat.id)) {
        // Convertir a formato local
        const newCategory: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = {
          nombre: supabaseCat.nombre,
          tipo: supabaseCat.tipo,
          color: supabaseCat.color,
          icono: supabaseCat.icono,
          categoriaPadreId: supabaseCat.categoriaPadreId || undefined,
          esSubcategoria: false
        };
        
        await addCategory(newCategory);
        newCategoriesCount++;
      }
    }
    
    return newCategoriesCount;
  } catch (error) {
    console.error('Error al sincronizar categorías:', error);
    return 0;
  }
};

// Función para obtener categorías organizadas jerárquicamente (categorías y subcategorías)
export const getHierarchicalCategories = async (): Promise<CategoryWithChildren[]> => {
  try {
    // Obtener todas las categorías
    const allCategories = await getCategories();
    
    // Filtrar categorías principales (sin padre)
    const mainCategories = allCategories.filter(cat => !cat.categoriaPadreId);
    
    // Para cada categoría principal, añadir sus subcategorías
    const hierarchicalCategories = mainCategories.map(mainCat => {
      const children = allCategories.filter(cat => cat.categoriaPadreId === mainCat.id);
      
      return {
        ...mainCat,
        children: children.length > 0 ? children : undefined
      };
    });
    
    return hierarchicalCategories;
  } catch (error) {
    console.error('Error al obtener categorías jerárquicas:', error);
    return [];
  }
};

// Función para obtener solo las categorías de gasto organizadas jerárquicamente
export const getExpenseHierarchicalCategories = async (): Promise<CategoryWithChildren[]> => {
  const categories = await getHierarchicalCategories();
  return categories.filter(cat => cat.tipo === 'gasto');
};