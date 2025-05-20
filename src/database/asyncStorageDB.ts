// src/database/asyncStorageDB.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tryToSyncPendingData } from './syncManager';

// Definir el tipo de periodo
export type PeriodType = 'quincenal-1' | 'quincenal-2' | 'mensual' | 'trimestral' | 'anual';

// Función de prorrateo de presupuestos
export const prorrateBudget = async (
  categoriaName: string, 
  totalBudget: number, 
  periodoTipo: PeriodType, 
  notas?: string
) => {
  try {
    const existingBudgets = await getBudgets();
    
    if (periodoTipo === 'quincenal-1' || periodoTipo === 'quincenal-2') {
      // No se necesita prorrateo para quincenas
      return;
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(currentMonth / 3);
    
    if (periodoTipo === 'mensual') {
      // Calcular fechas para cada quincena
      const q1Start = new Date(currentYear, currentMonth, 1);
      const q1End = new Date(currentYear, currentMonth, 15);
      const q2Start = new Date(currentYear, currentMonth, 16);
      const q2End = new Date(currentYear, currentMonth + 1, 0);
      
      // Verificar si ya existen presupuestos para esta categoría en este mes
      const q1Budget = existingBudgets.find(b => 
        b.categoria === categoriaName && 
        b.periodo === 'quincenal-1' &&
        new Date(b.fechaInicio).getMonth() === currentMonth &&
        new Date(b.fechaInicio).getFullYear() === currentYear
      );
      
      const q2Budget = existingBudgets.find(b => 
        b.categoria === categoriaName && 
        b.periodo === 'quincenal-2' &&
        new Date(b.fechaInicio).getMonth() === currentMonth &&
        new Date(b.fechaInicio).getFullYear() === currentYear
      );
      
      // Crear o actualizar presupuestos quincenales
      const montoQuincenal = totalBudget / 2;
      
      // Primera quincena
      if (q1Budget) {
        await updateBudget(q1Budget.id, {
          limite: montoQuincenal,
          notas: `Prorrateado de presupuesto mensual. ${notas || ''}`
        });
      } else {
        await addBudget({
          categoria: categoriaName,
          limite: montoQuincenal,
          actual: 0,
          periodo: 'quincenal-1',
          fechaInicio: q1Start.toISOString().split('T')[0],
          fechaFin: q1End.toISOString().split('T')[0],
          notas: `Prorrateado de presupuesto mensual. ${notas || ''}`
        });
      }
      
      // Segunda quincena
      if (q2Budget) {
        await updateBudget(q2Budget.id, {
          limite: montoQuincenal,
          notas: `Prorrateado de presupuesto mensual. ${notas || ''}`
        });
      } else {
        await addBudget({
          categoria: categoriaName,
          limite: montoQuincenal,
          actual: 0,
          periodo: 'quincenal-2',
          fechaInicio: q2Start.toISOString().split('T')[0],
          fechaFin: q2End.toISOString().split('T')[0],
          notas: `Prorrateado de presupuesto mensual. ${notas || ''}`
        });
      }
    } else if (periodoTipo === 'trimestral') {
      const quarterMonths = [
        currentQuarter * 3,
        currentQuarter * 3 + 1,
        currentQuarter * 3 + 2
      ];
      
      const montoQuincenal = totalBudget / 6; // Dividir entre 6 quincenas
      
      for (const monthIndex of quarterMonths) {
        const monthStart = new Date(currentYear, monthIndex, 1);
        const monthEnd1 = new Date(currentYear, monthIndex, 15);
        const monthStart2 = new Date(currentYear, monthIndex, 16);
        const monthEnd2 = new Date(currentYear, monthIndex + 1, 0);

        // Verificar si ya existen presupuestos para esta categoría en este mes
        const q1Budget = existingBudgets.find(b => 
          b.categoria === categoriaName && 
          b.periodo === 'quincenal-1' &&
          new Date(b.fechaInicio).getMonth() === monthIndex &&
          new Date(b.fechaInicio).getFullYear() === currentYear
        );
        
        const q2Budget = existingBudgets.find(b => 
          b.categoria === categoriaName && 
          b.periodo === 'quincenal-2' &&
          new Date(b.fechaInicio).getMonth() === monthIndex &&
          new Date(b.fechaInicio).getFullYear() === currentYear
        );
        
        // Primera quincena
        if (q1Budget) {
          await updateBudget(q1Budget.id, {
            limite: montoQuincenal,
            notas: `Prorrateado de presupuesto trimestral. ${notas || ''}`
          });
        } else {
          await addBudget({
            categoria: categoriaName,
            limite: montoQuincenal,
            actual: 0,
            periodo: 'quincenal-1',
            fechaInicio: monthStart.toISOString().split('T')[0],
            fechaFin: monthEnd1.toISOString().split('T')[0],
            notas: `Prorrateado de presupuesto trimestral. ${notas || ''}`
          });
        }
        
        // Segunda quincena
        if (q2Budget) {
          await updateBudget(q2Budget.id, {
            limite: montoQuincenal,
            notas: `Prorrateado de presupuesto trimestral. ${notas || ''}`
          });
        } else {
          await addBudget({
            categoria: categoriaName,
            limite: montoQuincenal,
            actual: 0,
            periodo: 'quincenal-2',
            fechaInicio: monthStart2.toISOString().split('T')[0],
            fechaFin: monthEnd2.toISOString().split('T')[0],
            notas: `Prorrateado de presupuesto trimestral. ${notas || ''}`
          });
        }
      }
    } else if (periodoTipo === 'anual') {
      const montoQuincenal = totalBudget / 24; // Dividir entre 24 quincenas (12 meses * 2 quincenas)
      
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthStart = new Date(currentYear, monthIndex, 1);
        const monthEnd1 = new Date(currentYear, monthIndex, 15);
        const monthStart2 = new Date(currentYear, monthIndex, 16);
        const monthEnd2 = new Date(currentYear, monthIndex + 1, 0);

        // Verificar si ya existen presupuestos para esta categoría en este mes
        const q1Budget = existingBudgets.find(b => 
          b.categoria === categoriaName && 
          b.periodo === 'quincenal-1' &&
          new Date(b.fechaInicio).getMonth() === monthIndex &&
          new Date(b.fechaInicio).getFullYear() === currentYear
        );
        
        const q2Budget = existingBudgets.find(b => 
          b.categoria === categoriaName && 
          b.periodo === 'quincenal-2' &&
          new Date(b.fechaInicio).getMonth() === monthIndex &&
          new Date(b.fechaInicio).getFullYear() === currentYear
        );
        
        // Primera quincena
        if (q1Budget) {
          await updateBudget(q1Budget.id, {
            limite: montoQuincenal,
            notas: `Prorrateado de presupuesto anual. ${notas || ''}`
          });
        } else {
          await addBudget({
            categoria: categoriaName,
            limite: montoQuincenal,
            actual: 0,
            periodo: 'quincenal-1',
            fechaInicio: monthStart.toISOString().split('T')[0],
            fechaFin: monthEnd1.toISOString().split('T')[0],
            notas: `Prorrateado de presupuesto anual. ${notas || ''}`
          });
        }
        
        // Segunda quincena
        if (q2Budget) {
          await updateBudget(q2Budget.id, {
            limite: montoQuincenal,
            notas: `Prorrateado de presupuesto anual. ${notas || ''}`
          });
        } else {
          await addBudget({
            categoria: categoriaName,
            limite: montoQuincenal,
            actual: 0,
            periodo: 'quincenal-2',
            fechaInicio: monthStart2.toISOString().split('T')[0],
            fechaFin: monthEnd2.toISOString().split('T')[0],
            notas: `Prorrateado de presupuesto anual. ${notas || ''}`
          });
        }
      }
    }
  } catch (error) {
    console.error('Error al prorratear presupuesto:', error);
    throw error;
  }
};


export interface Transaction {
  id: string;
  concepto: string;
  categoria: string;          // Name of main category (for backwards compatibility)
  categoriaId: string;        // ID of main category
  subcategoria?: string;      // Name of subcategory if applicable
  subcategoriaId?: string;    // ID of subcategory if applicable
  monto: number;
  fecha: string;
  cuenta: string;
  notas?: string;
  createdAt: number;
  updatedAt: number;
  syncStatus?: 'pending' | 'synced';
  cuentaId?: string;
}

export interface Budget {
  id: string;
  categoria: string;
  categoriaId?: string;
  subcategoria?: string;  // Añadir esta línea
  subcategoriaId?: string; // Añadir esta línea
  limite: number;
  actual: number;
  periodo: 'quincenal-1' | 'quincenal-2' | 'mensual' | 'trimestral' | 'anual';
  fechaInicio: string;
  fechaFin: string;
  notas?: string;
  recurrente?: boolean;
  frecuenciaRecurrencia?: 'mensual' | 'trimestral' | 'anual';
  fechaFinRecurrencia?: string;
  createdAt: number;
  updatedAt: number;
  syncStatus?: 'pending' | 'synced';
}


// Standardize on one naming convention, preferably:
export interface Category {
  id: string;
  nombre: string;
  tipo: 'ingreso' | 'gasto';
  color: string;
  icono: string;
  esSubcategoria: boolean;
  categoriaPadreId?: string;  // Stick with this naming for consistency
  createdAt: number;
  updatedAt: number;
}
// Claves para almacenamiento
const STORAGE_KEYS = {
  TRANSACTIONS: 'finanzas_transactions',
  CATEGORIES: 'finanzas_categories',
  SUBCATEGORIES: 'finanzas_subcategories', // Opcional: si quieres separar físicamente las categorías
  BUDGETS: 'finanzas_budgets',
  ACCOUNTS: 'finanzas_accounts',
  GOALS: 'finanzas_goals',
  USER_SETTINGS: 'finanzas_user_settings',
};

export const migrateTransactionsToUseIds = async (): Promise<void> => {
  try {
    // Obtener todas las transacciones y categorías
    const transactions = await getTransactions();
    const categories = await getCategories();
    
    // Crear mapas para búsqueda rápida
    const categoryByName = new Map<string, Category>();
    categories.forEach(cat => categoryByName.set(cat.nombre, cat));
    
    // Actualizar cada transacción
    const updatedTransactions = transactions.map(tx => {
      // Si ya tiene categoriaId, no necesita migración
      if (tx.categoriaId) return tx;
      
      // Buscar la categoría por nombre
      const category = categoryByName.get(tx.categoria);
      
      if (category) {
        // Si la categoría existe, actualizar la transacción
        const updatedTx = { ...tx };
        
        // Establecer categoriaId
        updatedTx.categoriaId = category.id;
        
        // Si es una subcategoría, establecer categoriaPadreId
        if (category.esSubcategoria && category.categoriaPadreId) {
          updatedTx.categoriaId = category.categoriaPadreId;
        }
        
        return updatedTx;
      }
      
      // Si no se encuentra la categoría, dejar la transacción como está
      return tx;
    });
    
    // Guardar las transacciones actualizadas
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
    
    console.log(`Migración completada: ${updatedTransactions.length} transacciones procesadas`);
  } catch (error) {
    console.error('Error al migrar transacciones:', error);
  }
};


// 2. Función para añadir una subcategoría - asegúrate de usar categoriaPadreId
export const addSubcategory = async (
  categoriaPadreId: string,
  subcategory: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'esSubcategoria' | 'categoriaPadreId'>
): Promise<Category> => {
  // Validar que la categoría padre existe
  const categories = await getCategories();
  const parentCategory = categories.find(cat => cat.id === categoriaPadreId);
  
  if (!parentCategory) {
    throw new Error('La categoría padre no existe');
  }
  
  // Crear la subcategoría con los valores correctos
  return addCategory({
    ...subcategory,
    esSubcategoria: true,  // Establecer explícitamente como subcategoría
    categoriaPadreId: categoriaPadreId, // Usar categoriaPadreIden lugar de categoriaPadreId
    tipo: parentCategory.tipo // Heredar el tipo de la categoría padre
  });
};

// 3. Función para añadir categoría - modificada para manejar correctamente los parámetros
export const addCategory = async (
  category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Category> => {
  try {
    const categories = await getCategories();
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([...categories, newCategory]));
    return newCategory;
  } catch (error) {
    console.error('Error al añadir categoría:', error);
    throw error;
  }
};

// 4. Función para obtener subcategorías - usar esSubcategoria y categoriaPadreId
export const getSubcategoriesBycategoriaPadreId = async (categoriaPadreId: string): Promise<Category[]> => {
  try {
    const categories = await getCategories();
    return categories.filter(cat => cat.esSubcategoria && cat.categoriaPadreId=== categoriaPadreId);
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    return [];
  }
};

// 5. Función para obtener categorías principales - usar esSubcategoria
export const getMainCategories = async (): Promise<Category[]> => {
  try {
    const categories = await getCategories();
    return categories.filter(cat => !cat.esSubcategoria);
  } catch (error) {
    console.error('Error al obtener categorías principales:', error);
    return [];
  }
};



export const handleRecurrentBudgets = async () => {
  const now = new Date();
  const budgets = await getBudgets();
  let newBudgetsCreated = 0;

  for (const budget of budgets) {
    // Verificar explícitamente si el presupuesto es recurrente
    if (budget.recurrente) {
      const lastBudgetDate = new Date(budget.fechaFin);
      const recurrenceEndDate = budget.fechaFinRecurrencia 
        ? new Date(budget.fechaFinRecurrencia) 
        : null;

      // Si ya estamos después de la fecha de fin de recurrencia, saltamos este presupuesto
      if (recurrenceEndDate && now > recurrenceEndDate) {
        console.log(`Presupuesto ${budget.categoria} ha terminado su recurrencia`);
        continue;
      }

      // Verificar que la frecuencia de recurrencia esté definida
      if (!budget.frecuenciaRecurrencia) {
        console.warn(`Presupuesto ${budget.categoria} marcado como recurrente pero sin frecuencia definida`);
        continue;
      }

      // Verificar si es momento de crear el siguiente presupuesto recurrente
      // Solo creamos uno nuevo si la fecha de fin del último es anterior a la fecha actual
      if (lastBudgetDate < now) {
        // Lógica para extender presupuestos recurrentes
        let newStartDate = new Date(lastBudgetDate);
        let newEndDate = new Date(lastBudgetDate);

        switch (budget.frecuenciaRecurrencia) {
          case 'mensual':
            newStartDate.setMonth(newStartDate.getMonth() + 1);
            newEndDate.setMonth(newEndDate.getMonth() + 1);
            break;
          case 'trimestral':
            newStartDate.setMonth(newStartDate.getMonth() + 3);
            newEndDate.setMonth(newEndDate.getMonth() + 3);
            break;
          case 'anual':
            newStartDate.setFullYear(newStartDate.getFullYear() + 1);
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            break;
          default:
            console.warn(`Frecuencia de recurrencia no válida para presupuesto ${budget.categoria}`);
            continue;
        }

        // Formatear fechas como strings YYYY-MM-DD
        const newStartDateStr = newStartDate.toISOString().split('T')[0];
        const newEndDateStr = newEndDate.toISOString().split('T')[0];

        // Verificar si ya existe un presupuesto para el siguiente período
        const existingNextPeriodBudget = budgets.find(b => 
          b.categoria === budget.categoria && 
          b.periodo === budget.periodo &&
          b.fechaInicio === newStartDateStr && 
          b.fechaFin === newEndDateStr
        );

        if (!existingNextPeriodBudget) {
          try {
            // Crear nuevo presupuesto recurrente
            const newBudget = await addBudget({
              categoria: budget.categoria,
              limite: budget.limite,
              actual: 0, // Reiniciar el valor actual
              periodo: budget.periodo,
              fechaInicio: newStartDateStr,
              fechaFin: newEndDateStr,
              notas: budget.notas,
              recurrente: true,
              frecuenciaRecurrencia: budget.frecuenciaRecurrencia,
              fechaFinRecurrencia: budget.fechaFinRecurrencia
            });

            console.log(`Nuevo presupuesto recurrente creado para ${newBudget.categoria}`);
            newBudgetsCreated++;

            // Si el presupuesto original tenía prorrateo, aplicarlo también al nuevo
            if (budget.periodo !== 'quincenal-1' && budget.periodo !== 'quincenal-2') {
              await prorrateBudget(budget.categoria, budget.limite, budget.periodo as PeriodType);
            }
          } catch (error) {
            console.error(`Error al crear presupuesto recurrente para ${budget.categoria}:`, error);
          }
        } else {
          console.log(`Ya existe un presupuesto para ${budget.categoria} en el siguiente período`);
        }
      }
    }
  }
  
  return newBudgetsCreated; // Devolver cuántos presupuestos se crearon (útil para actualizar UI)
};
export interface Account {
  id: string;
  nombre: string;
  tipo: 'efectivo' | 'banco' | 'tarjeta' | 'otro';
  saldo: number;
  moneda: string;
  color: string;
  icono: string;
  createdAt: number;
  updatedAt: number;
}

export interface Goal {
  id: string;
  nombre: string;
  objetivo: number;
  actual: number;
  fechaObjetivo: string;
  categoria: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  nombre: string;
  email: string;
  monedaPrincipal: string;
  temaOscuro: boolean;
  notificaciones: boolean;
  ultimaSincronizacion?: number;
}

// Función para inicializar la base de datos
// Modificar la función setupAsyncStorage en asyncStorageDB.ts

export const setupAsyncStorage = async () => {
  try {
    // Categorías predeterminadas
    const categoriesExists = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    
    if (!categoriesExists) {
      const defaultCategories: Category[] = [
        {
          id: '1',
          nombre: 'Alimentación',
          tipo: 'gasto',
          color: '#FF5252',
          icono: 'coffee',
          esSubcategoria: false, // Asegurar que esta propiedad esté definida
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          nombre: 'Vivienda',
          tipo: 'gasto',
          color: '#AA00FF',
          icono: 'home',
          esSubcategoria: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '3',
          nombre: 'Transporte',
          tipo: 'gasto',
          color: '#2962FF',
          icono: 'car',
          esSubcategoria: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '4',
          nombre: 'Entretenimiento',
          tipo: 'gasto',
          color: '#00B0FF',
          icono: 'film',
          esSubcategoria: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '5',
          nombre: 'Servicios',
          tipo: 'gasto',
          color: '#00C853',
          icono: 'zap',
          esSubcategoria: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '6',
          nombre: 'Salud',
          tipo: 'gasto',
          color: '#d50000',
          icono: 'thermometer',
          esSubcategoria: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '7',
          nombre: 'Salario',
          tipo: 'ingreso',
          color: '#00C853',
          icono: 'briefcase',
          esSubcategoria: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '8',
          nombre: 'Inversiones',
          tipo: 'ingreso',
          color: '#6200EA',
          icono: 'trending-up',
          esSubcategoria: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategories));
    } else {
      // Migrar categorías existentes para incluir esSubcategoria si no lo tienen
      const categories = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
      const updatedCategories = categories.map((cat: any) => ({
        ...cat,
        esSubcategoria: cat.esSubcategoria !== undefined ? cat.esSubcategoria : false
      }));
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updatedCategories));
    }
    
    // Cuentas predeterminadas
    const accountsExists = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    
    if (!accountsExists) {
      const defaultAccounts: Account[] = [
        {
          id: '1',
          nombre: 'Efectivo',
          tipo: 'efectivo',
          saldo: 500,
          moneda: 'DOP',
          color: '#00C853',
          icono: 'dollar-sign',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          nombre: 'Cuenta Corriente',
          tipo: 'banco',
          saldo: 2500,
          moneda: 'DOP',
          color: '#2962FF',
          icono: 'credit-card',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(defaultAccounts));
    }
    
    // Configuración de usuario predeterminada
    const settingsExists = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    
    if (!settingsExists) {
      const defaultSettings: UserSettings = {
        nombre: 'Familia López',
        email: 'familia@ejemplo.com',
        monedaPrincipal: 'DOP',
        temaOscuro: false,
        notificaciones: true,
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(defaultSettings));
    }
    
    // Migrar transacciones para usar categoriaId y categoriaPadreId
    await migrateTransactionsToUseIds();
    
    console.log('Base de datos AsyncStorage inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos AsyncStorage:', error);
  }
};
// CRUD para Transacciones
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    return [];
  }
};

export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  try {
    const transactions = await getTransactions();
    return transactions.find(tx => tx.id === id) || null;
  } catch (error) {
    console.error(`Error al obtener la transacción con id ${id}:`, error);
    return null;
  }
};

export const updateTransaction = async (id: string, updatedData: Partial<Transaction>): Promise<Transaction | null> => {
  try {
    const transactions = await getTransactions();
    const index = transactions.findIndex(tx => tx.id === id);
    
    if (index === -1) return null;
    
    transactions[index] = {
      ...transactions[index],
      ...updatedData,
      updatedAt: Date.now(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return transactions[index];
  } catch (error) {
    console.error(`Error al actualizar la transacción con id ${id}:`, error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const transactions = await getTransactions();
    const filteredTransactions = transactions.filter(tx => tx.id !== id);
    
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filteredTransactions));
    return true;
  } catch (error) {
    console.error(`Error al eliminar la transacción con id ${id}:`, error);
    return false;
  }
};

// CRUD para Categorías
export const getCategories = async (): Promise<Category[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return [];
  }
};

// CRUD para Presupuestos
export const getBudgets = async (): Promise<Budget[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error al obtener presupuestos:', error);
    return [];
  }
};

export const addBudget = async (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Budget> => {
  try {
    const budgets = await getBudgets();
    const newBudget: Budget = {
      ...budget,
      id: budget.id || Date.now().toString(), // Usar ID proporcionado o generar uno nuevo
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify([...budgets, newBudget]));
    return newBudget;
  } catch (error) {
    console.error('Error al añadir presupuesto:', error);
    throw error;
  }
};

// Devuelve las transacciones agrupadas por categoría
export const getTransactionsByCategory = async (): Promise<{ categoria: string; total: number }[]> => {
  try {
    const transactions = await getTransactions();
    
    // Agrupar transacciones por categoría y sumar los montos
    const groupedTransactions = transactions.reduce((acc, transaction) => {
      const { categoria, monto } = transaction;
      
      // Si la categoría ya existe, suma el monto (o resta si es negativo)
      if (acc[categoria]) {
        acc[categoria] += monto;
      } else {
        acc[categoria] = monto;
      }
      
      return acc;
    }, {} as Record<string, number>);
    
    // Convertir a array de objetos para facilitar su uso en componentes
    return Object.entries(groupedTransactions).map(([categoria, total]) => ({
      categoria,
      total: Math.abs(total), // Valor absoluto para visualización
    }));
  } catch (error) {
    console.error('Error al obtener transacciones por categoría:', error);
    return [];
  }
};

// Obtiene el balance del mes actual
export const getCurrentMonthBalance = async (): Promise<{ ingresos: number; gastos: number; balance: number }> => {
  try {
    const transactions = await getTransactions();
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filtrar transacciones del mes actual
    const currentMonthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.fecha);
      return txDate >= currentMonthStart && txDate <= now;
    });
    
    // Calcular ingresos y gastos
    const ingresos = currentMonthTransactions
      .filter(tx => tx.monto > 0)
      .reduce((sum, tx) => sum + tx.monto, 0);
      
    const gastos = currentMonthTransactions
      .filter(tx => tx.monto < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.monto), 0);
    
    return {
      ingresos,
      gastos,
      balance: ingresos - gastos,
    };
  } catch (error) {
    console.error('Error al calcular el balance del mes actual:', error);
    return { ingresos: 0, gastos: 0, balance: 0 };
  }
};

// Función para inicializar datos de ejemplo
export const loadSampleData = async () => {
  try {
    // Transacciones de ejemplo
    const sampleTransactions: Transaction[] = [
      {
        id: '1',
        concepto: 'Supermercado',
        categoria: 'Alimentación',
        categoriaId: '1', // Added categoriaId field
        monto: -120,
        fecha: '2025-02-25',
        cuenta: 'Efectivo',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '2',
        concepto: 'Sueldo',
        categoria: 'Salario',
        categoriaId: '7', // Added categoriaId field - assuming Salario has ID '7'
        monto: 3250,
        fecha: '2025-02-24',
        cuenta: 'Cuenta Corriente',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '3',
        concepto: 'Netflix',
        categoria: 'Entretenimiento',
        categoriaId: '4', // Added categoriaId field - assuming Entretenimiento has ID '4'
        monto: -15.99,
        fecha: '2025-02-23',
        cuenta: 'Cuenta Corriente',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '4',
        concepto: 'Gasolina',
        categoria: 'Transporte',
        categoriaId: '3', // Added categoriaId field - assuming Transporte has ID '3'
        monto: -45,
        fecha: '2025-02-22',
        cuenta: 'Efectivo',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '5',
        concepto: 'Luz',
        categoria: 'Servicios',
        categoriaId: '5', // Added categoriaId field - assuming Servicios has ID '5'
        monto: -85.40,
        fecha: '2025-02-21',
        cuenta: 'Cuenta Corriente',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(sampleTransactions));
    
    console.log('Datos de ejemplo cargados correctamente');
  } catch (error) {
    console.error('Error al cargar datos de ejemplo:', error);
  }
};
export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Transaction> => {
  try {
    const transactions = await getTransactions();
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'pending', // Marcar como pendiente de sincronización
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([...transactions, newTransaction]));
    
    // Actualizar presupuesto asociado si es un gasto
    if (newTransaction.monto < 0) {
      await updateBudgetWithTransaction(newTransaction);
    }
    
    // Intentar sincronizar inmediatamente si hay conexión
    tryToSyncPendingData();
    
    return newTransaction;
  } catch (error) {
    console.error('Error al añadir transacción:', error);
    throw error;
  }
};

// Agregar esta función al archivo src/database/asyncStorageDB.ts

export const updateBudget = async (
  id: string, 
  updatedData: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Budget | null> => {
  try {
    const budgets = await getBudgets();
    const index = budgets.findIndex(budget => budget.id === id);
    
    if (index === -1) return null;
    
    // Actualizar el presupuesto
    budgets[index] = {
      ...budgets[index],
      ...updatedData,
      updatedAt: Date.now()
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    return budgets[index];
  } catch (error) {
    console.error('Error al actualizar el presupuesto:', error);
    throw error;
  }
};

// Actualiza el presupuesto basado en una nueva transacción
export const updateBudgetWithTransaction = async (transaction: Transaction): Promise<void> => {
  if (transaction.monto >= 0) return; // Solo procesar gastos (montos negativos)
  
  try {
    const budgets = await getBudgets();
    const transactionDate = new Date(transaction.fecha);
    const transactionCategory = transaction.categoria;
    
    // Encontrar los presupuestos que coincidan con la categoría y fecha
    const matchingBudgets = budgets.filter(budget => {
      // Comprobar si coincide la categoría
      if (budget.categoria !== transactionCategory) return false;
      
      // Comprobar si la fecha de la transacción está dentro del periodo del presupuesto
      const startDate = new Date(budget.fechaInicio);
      const endDate = new Date(budget.fechaFin);
      
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    // Si no hay presupuestos que coincidan, salir
    if (matchingBudgets.length === 0) return;
    
    // Actualizar cada presupuesto que coincida
    const updatedBudgets = budgets.map(budget => {
      if (matchingBudgets.find(match => match.id === budget.id)) {
        // Sumar el valor absoluto del monto (ya que es negativo para gastos)
        return {
          ...budget,
          actual: budget.actual + Math.abs(transaction.monto),
          updatedAt: Date.now()
        };
      }
      return budget;
    });
    
    // Guardar los presupuestos actualizados
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updatedBudgets));
    
  } catch (error) {
    console.error('Error al actualizar presupuesto con transacción:', error);
  }
};

// Añade esta función al archivo src/database/asyncStorageDB.ts

// CRUD para Cuentas
export const getAccounts = async (): Promise<Account[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    return [];
  }
};

export const addAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> => {
  try {
    const accounts = await getAccounts();
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify([...accounts, newAccount]));
    return newAccount;
  } catch (error) {
    console.error('Error al añadir cuenta:', error);
    throw error;
  }
};

export const clearLocalDatabase = async () => {
  try {
    // Eliminar todos los datos de AsyncStorage
    await AsyncStorage.clear();
    console.log('Base de datos local limpiada completamente');
  } catch (error) {
    console.error('Error al limpiar la base de datos local:', error);
    throw error;
  }
};

export const getCategoriesByType = async (type: 'parent' | 'child' | 'all'): Promise<Category[]> => {
  try {
    const allCategories = await getCategories();
    
    if (type === 'all') {
      return allCategories;
    } else if (type === 'parent') {
      return allCategories.filter(cat => !cat.categoriaPadreId);
    } else {
      return allCategories.filter(cat => cat.categoriaPadreId);
    }
  } catch (error) {
    console.error('Error al obtener categorías por tipo:', error);
    return [];
  }
};

// src/database/asyncStorageDB.ts - Añadir estas dos funciones

// Interfaz para categorías con sus hijos (subcategorías)
export interface CategoryWithChildren extends Category {
  children?: Category[];
}

// Función para obtener categorías con sus subcategorías
export const getCategoriesWithChildren = async (): Promise<CategoryWithChildren[]> => {
  try {
    // Obtener todas las categorías
    const allCategories = await getCategories();
    
    // Filtrar solo categorías principales (no subcategorías)
    const mainCategories = allCategories.filter(cat => !cat.esSubcategoria);
    
    // Convertir categorías principales a formato con hijos
    const categoriesWithChildren: CategoryWithChildren[] = await Promise.all(
      mainCategories.map(async (mainCategory) => {
        // Buscar subcategorías para esta categoría principal
        const subcategories = allCategories.filter(
          cat => cat.esSubcategoria && cat.categoriaPadreId=== mainCategory.id
        );
        
        // Devolver la categoría con sus subcategorías como hijos
        return {
          ...mainCategory,
          children: subcategories.length > 0 ? subcategories : undefined
        };
      })
    );
    
    return categoriesWithChildren;
  } catch (error) {
    console.error('Error al obtener categorías con hijos:', error);
    return [];
  }
};

// Función para obtener presupuestos agrupados por categoría principal
export const getBudgetsByMainCategory = async (): Promise<{ [key: string]: Budget[] }> => {
  try {
    const budgets = await getBudgets();
    const categories = await getCategories();
    
    // Crear un mapa para buscar la categoría padre de cada categoría
    const categoryMap = new Map<string, Category>();
    categories.forEach(cat => categoryMap.set(cat.id, cat));
    
    // Organizar presupuestos por categoría principal
    const result: { [key: string]: Budget[] } = {};
    
    for (const budget of budgets) {
      let categoryId = budget.categoriaId;
      let mainCategoryId = categoryId;
      
      // Si el presupuesto está asociado a una subcategoría, encontrar su categoría principal
      if (budget.subcategoriaId) {
        const subcategory = categoryMap.get(budget.subcategoriaId);
        if (subcategory?.categoriaPadreId) {
          mainCategoryId = subcategory.categoriaPadreId;
        }
      } else if (budget.categoriaId) {
        // Verificar si la categoría es principal o subcategoría
        const category = categoryMap.get(budget.categoriaId);
        if (category?.esSubcategoria && category.categoriaPadreId) {
          mainCategoryId = category.categoriaPadreId;
        }
      }
      
      // Si se encontró una categoría principal, agrupar el presupuesto
      if (mainCategoryId) {
        const mainCategory = categoryMap.get(mainCategoryId);
        if (mainCategory) {
          const categoryName = mainCategory.nombre;
          
          if (!result[categoryName]) {
            result[categoryName] = [];
          }
          
          result[categoryName].push(budget);
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error al obtener presupuestos por categoría principal:', error);
    return {};
  }
};
// Función para obtener subcategorías de una categoría padre
export const getSubcategories = async (categoriaPadreId: string): Promise<Category[]> => {
  try {
    const allCategories = await getCategories();
    return allCategories.filter(cat => cat.categoriaPadreId === categoriaPadreId);
  } catch (error) {
    console.error(`Error al obtener subcategorías para ${categoriaPadreId}:`, error);
    return [];
  }
};


export const getTransactionsBySubcategory = async (subcategoryId: string): Promise<Transaction[]> => {
  try {
    const allTransactions = await getTransactions();
    return allTransactions.filter(tx => tx.subcategoriaId === subcategoryId);
  } catch (error) {
    console.error(`Error getting transactions for subcategory ${subcategoryId}:`, error);
    return [];
  }
};

export const getTransactionsByMainCategory = async (categoryId: string): Promise<Transaction[]> => {
  try {
    const allTransactions = await getTransactions();
    return allTransactions.filter(tx => 
      tx.categoriaId === categoryId || 
      (tx.categoria === categoryId) // For backwards compatibility
    );
  } catch (error) {
    console.error(`Error getting transactions for category ${categoryId}:`, error);
    return [];
  }
};

export const getSubcategoryExpenseTotals = async (categoryId: string): Promise<{[key: string]: number}> => {
  try {
    // Get all subcategories for this category
    const subcategories = await getSubcategoriesByParentId(categoryId);
    
    // Get all transactions
    const transactions = await getTransactions();
    
    // Calculate totals for each subcategory
    const totals: {[key: string]: number} = {};
    
    // Initialize totals for each subcategory
    subcategories.forEach(subcat => {
      totals[subcat.id] = 0;
    });
    
    // Sum transaction amounts for each subcategory
    transactions.forEach(tx => {
      if (tx.subcategoriaId && totals[tx.subcategoriaId] !== undefined) {
        // Only count expenses (negative amounts)
        if (tx.monto < 0) {
          totals[tx.subcategoriaId] += Math.abs(tx.monto);
        }
      }
    });
    
    return totals;
  } catch (error) {
    console.error(`Error getting expense totals for category ${categoryId}:`, error);
    return {};
  }
};


// Función modificada para obtener presupuestos agrupados por categorías principales
export const getBudgetsByParentCategory = async (): Promise<{ [key: string]: Budget[] }> => {
  try {
    const budgets = await getBudgets();
    const categories = await getCategories();
    
    // Crear un mapa para buscar la categoría padre de cada categoría
    const categoryMap = new Map<string, Category>();
    categories.forEach(cat => categoryMap.set(cat.nombre, cat));
    
    // Organizar presupuestos por categoría padre
    const result: { [key: string]: Budget[] } = {};
    
    for (const budget of budgets) {
      const category = categoryMap.get(budget.categoria);
      
      if (!category) continue;
      
      // Determinar la categoría principal
      const parentName = category.categoriaPadreId 
        ? categories.find(c => c.id === category.categoriaPadreId)?.nombre 
        : category.nombre;
      
      if (parentName) {
        if (!result[parentName]) {
          result[parentName] = [];
        }
        result[parentName].push(budget);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error al obtener presupuestos por categoría principal:', error);
    return {};
  }
};

// Función para configurar datos de ejemplo con subcategorías
export const setupSampleSubcategories = async () => {
  try {
    // Verificar si ya existen categorías
    const existingCategories = await getCategories();
    if (existingCategories.length > 0) {
      // Ya hay categorías, no crear duplicados
      return;
    }
    
    // Categorías principales
    const parentCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        nombre: 'Alimentación',
        tipo: 'gasto',
        color: '#FF5252',
        icono: 'coffee',
        esSubcategoria: false
      },
      {
        nombre: 'Transporte',
        tipo: 'gasto',
        color: '#2962FF',
        icono: 'car',
        esSubcategoria: false
      },
      {
        nombre: 'Entretenimiento',
        tipo: 'gasto',
        color: '#00B0FF',
        icono: 'film',
        esSubcategoria: false
      },
      {
        nombre: 'Salario',
        tipo: 'ingreso',
        color: '#00C853',
        icono: 'briefcase',
        esSubcategoria: false
      }
    ];
    
    // Crear categorías principales primero
    const createdParents = [];
    for (const cat of parentCategories) {
      const newCat = await addCategory(cat);
      createdParents.push(newCat);
    }
    
    // Subcategorías para Alimentación
    const alimentacionParent = createdParents.find(c => c.nombre === 'Alimentación');
    if (alimentacionParent) {
      const alimentacionSubs = [
        {
          nombre: 'Compra casa',
          tipo: 'gasto' as const,
          color: '#FF7043',
          icono: 'shopping-cart',
          categoriaPadreId: alimentacionParent.id,
          esSubcategoria: true
        },
        {
          nombre: 'Merienda',
          tipo: 'gasto' as const,
          color: '#FFCA28',
          icono: 'coffee',
          categoriaPadreId: alimentacionParent.id,
          esSubcategoria: true
        },
        {
          nombre: 'Restaurantes',
          tipo: 'gasto' as const,
          color: '#EC407A',
          icono: 'utensils',
          categoriaPadreId: alimentacionParent.id,
          esSubcategoria: true
        }
      ];
      
      for (const sub of alimentacionSubs) {
        await addCategory(sub);
      }
    }
    
    // Subcategorías para Transporte
    const transporteParent = createdParents.find(c => c.nombre === 'Transporte');
    if (transporteParent) {
      const transporteSubs = [
        {
          nombre: 'Gasolina',
          tipo: 'gasto' as const,
          color: '#26A69A',
          icono: 'droplet',
          categoriaPadreId: transporteParent.id,
          esSubcategoria: true
        },
        {
          nombre: 'Transporte público',
          tipo: 'gasto' as const,
          color: '#5C6BC0',
          icono: 'bus',
          categoriaPadreId: transporteParent.id,
          esSubcategoria: true
        },
        {
          nombre: 'Mantenimiento',
          tipo: 'gasto' as const,
          color: '#7E57C2',
          icono: 'tool',
          categoriaPadreId: transporteParent.id,
          esSubcategoria: true
        }
      ];
      
      for (const sub of transporteSubs) {
        await addCategory(sub);
      }
    }
    
    // Subcategorías para Entretenimiento
    const entretenimientoParent = createdParents.find(c => c.nombre === 'Entretenimiento');
    if (entretenimientoParent) {
      const entretenimientoSubs = [
        {
          nombre: 'Cine',
          tipo: 'gasto' as const,
          color: '#42A5F5',
          icono: 'film',
          categoriaPadreId: entretenimientoParent.id,
          esSubcategoria: true
        },
        {
          nombre: 'Streaming',
          tipo: 'gasto' as const,
          color: '#AB47BC',
          icono: 'tv',
          categoriaPadreId: entretenimientoParent.id,
          esSubcategoria: true
        },
        {
          nombre: 'Salidas',
          tipo: 'gasto' as const,
          color: '#66BB6A',
          icono: 'users',
          categoriaPadreId: entretenimientoParent.id,
          esSubcategoria: true
        }
      ];
      
      for (const sub of entretenimientoSubs) {
        await addCategory(sub);
      }
    }
    
    console.log('Datos de ejemplo de subcategorías configurados con éxito');
  } catch (error) {
    console.error('Error al configurar datos de ejemplo de subcategorías:', error);
  }
};


export const getSubcategoriesByParentId = async (parentId: string): Promise<Category[]> => {
  try {
    const allCategories = await getCategories();
    
    // Filtrar las categorías que son subcategorías y tienen el parentId especificado
    return allCategories.filter(
      category => category.esSubcategoria && category.categoriaPadreId=== parentId
    );
  } catch (error) {
    console.error(`Error al obtener subcategorías para categoría ${parentId}:`, error);
    return [];
  }
};
// Exportar esta interfaz
export interface CategoryWithChildren extends Category {
  children?: Category[];
}

/**
 * Migra las transacciones existentes para incluir tanto categoriaId como subcategoriaId
 */
export const migrateTransactionsToNewFormat = async (): Promise<void> => {
  try {
    // Obtener todas las transacciones y categorías
    const transactions = await getTransactions();
    const categories = await getCategories();
    
    // Crear mapas para búsquedas rápidas
    const categoryByName = new Map<string, Category>();
    const categoryById = new Map<string, Category>();
    categories.forEach(cat => {
      categoryByName.set(cat.nombre, cat);
      categoryById.set(cat.id, cat);
    });
    
    // Procesar cada transacción
    const updatedTransactions = transactions.map(tx => {
      const updated = { ...tx };
      
      // Omitir transacciones que ya tienen el formato adecuado
      if (tx.categoriaId && (tx.subcategoriaId || !tx.subcategoria)) {
        return tx;
      }
      
      // Intentar encontrar categoría por ID primero
      if (tx.categoriaId) {
        const category = categoryById.get(tx.categoriaId);
        if (category) {
          // Verificar si es una subcategoría
          if (category.esSubcategoria && category.categoriaPadreId) {
            // Es una subcategoría - actualizar al nuevo formato
            const parentCategory = categoryById.get(category.categoriaPadreId);
            if (parentCategory) {
              updated.subcategoriaId = category.id;
              updated.subcategoria = category.nombre;
              updated.categoriaId = parentCategory.id;
              updated.categoria = parentCategory.nombre;
            }
          } else {
            // Ya es una categoría principal, solo asegurarse de que categoria esté establecido
            updated.categoria = category.nombre;
          }
        }
      } 
      // Intentar encontrar por nombre de categoría
      else if (tx.categoria) {
        const category = categoryByName.get(tx.categoria);
        if (category) {
          if (category.esSubcategoria && category.categoriaPadreId) {
            // Es una subcategoría - actualizar al nuevo formato
            const parentCategory = categoryById.get(category.categoriaPadreId);
            if (parentCategory) {
              updated.subcategoriaId = category.id;
              updated.subcategoria = category.nombre;
              updated.categoriaId = parentCategory.id;
              updated.categoria = parentCategory.nombre;
            }
          } else {
            // Es una categoría principal
            updated.categoriaId = category.id;
            updated.categoria = category.nombre;
          }
        }
      }
      
      return updated;
    });
    
    // Guardar transacciones actualizadas
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
    
    console.log(`Migración completada: ${updatedTransactions.length} transacciones procesadas`);
  } catch (error) {
    console.error('Error al migrar transacciones:', error);
  }
};

/**
 * Migra los presupuestos para incluir tanto categoriaId como subcategoriaId
 */
export const migrateBudgetsToNewFormat = async (): Promise<void> => {
  try {
    // Obtener todos los presupuestos y categorías
    const budgets = await getBudgets();
    const categories = await getCategories();
    
    // Crear mapas para búsquedas rápidas
    const categoryByName = new Map<string, Category>();
    const categoryById = new Map<string, Category>();
    categories.forEach(cat => {
      categoryByName.set(cat.nombre, cat);
      categoryById.set(cat.id, cat);
    });
    
    // Procesar cada presupuesto
    const updatedBudgets = budgets.map(budget => {
      const updated = { ...budget };
      
      // Omitir presupuestos que ya tienen el formato adecuado
      if (budget.categoriaId && (!budget.subcategoria || budget.subcategoriaId)) {
        return budget;
      }
      
      // Intentar encontrar categoría por nombre primero
      if (budget.categoria && !budget.categoriaId) {
        const category = categoryByName.get(budget.categoria);
        if (category) {
          // Agregar el ID de categoría
          updated.categoriaId = category.id;
          
          // Manejar subcategoría si está presente
          if (budget.subcategoria) {
            // Buscar la subcategoría por nombre dentro de las subcategorías de la categoría padre
            const subcategories = categories.filter(
              cat => cat.esSubcategoria && cat.categoriaPadreId=== category.id
            );
            
            const subcategory = subcategories.find(sc => sc.nombre === budget.subcategoria);
            if (subcategory) {
              updated.subcategoriaId = subcategory.id;
            }
          }
        }
      }
      
      return updated;
    });
    
    // Guardar presupuestos actualizados
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updatedBudgets));
    
    console.log(`Migración de presupuestos completada: ${updatedBudgets.length} presupuestos procesados`);
  } catch (error) {
    console.error('Error al migrar presupuestos:', error);
  }
};

