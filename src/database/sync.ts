// src/database/sync.ts
import { supabase } from './supabase';

import { 
  getTransactions, 
  addTransaction, 
  getBudgets, 
  addBudget, 
  updateBudget
} from './asyncStorageDB';

export const syncBudgetsWithSupabase = async () => {
  try {
    const { data: remoteBudgets, error } = await supabase
      .from('budgets')
      .select('*')
      .order('createdAt', { ascending: true });
    
    if (error) {
      console.error('Error al obtener presupuestos de Supabase:', error);
      return;
    }

    const localBudgets = await getBudgets();
    
    let newBudgetsCount = 0;

    for (const remoteBudget of remoteBudgets || []) {
      // Buscar si ya existe un presupuesto local con el mismo ID
      const existingBudget = localBudgets.find(b => b.id === remoteBudget.id);
      
      if (!existingBudget) {
        try {
          await addBudget({
            id: remoteBudget.id, // Mantener el ID original
            categoria: remoteBudget.categoria,
            limite: remoteBudget.limite,
            actual: remoteBudget.actual || 0,
            periodo: remoteBudget.periodo,
            fechaInicio: remoteBudget.fechaInicio,
            fechaFin: remoteBudget.fechaFin,
            notas: remoteBudget.notas || '',
            recurrente: remoteBudget.recurrente || false,
            frecuenciaRecurrencia: remoteBudget.frecuenciaRecurrencia,
            fechaFinRecurrencia: remoteBudget.fechaFinRecurrencia
          });
          
          newBudgetsCount++;
        } catch (addError) {
          console.error('Error al añadir presupuesto individual:', addError);
        }
      } else {
        // Si ya existe, actualizar el presupuesto local con los datos remotos
        await updateBudget(remoteBudget.id, {
          categoria: remoteBudget.categoria,
          limite: remoteBudget.limite,
          actual: remoteBudget.actual || existingBudget.actual,
          periodo: remoteBudget.periodo,
          fechaInicio: remoteBudget.fechaInicio,
          fechaFin: remoteBudget.fechaFin,
          notas: remoteBudget.notas || existingBudget.notas,
          recurrente: remoteBudget.recurrente || existingBudget.recurrente,
          frecuenciaRecurrencia: remoteBudget.frecuenciaRecurrencia || existingBudget.frecuenciaRecurrencia,
          fechaFinRecurrencia: remoteBudget.fechaFinRecurrencia || existingBudget.fechaFinRecurrencia
        });
      }
    }
    
    console.log(`Sincronización de presupuestos completada. Nuevos presupuestos: ${newBudgetsCount}`);
  } catch (err) {
    console.error('Error durante la sincronización de presupuestos:', err);
  }
};

export const uploadLocalBudgetsToSupabase = async () => {
  try {
    // Obtener presupuestos locales
    const localBudgets = await getBudgets();
    
    // Obtener IDs de presupuestos remotos
    const { data: remoteBudgets } = await supabase.from('budgets').select('id');
    
    // Crear un mapa de IDs remotos para verificar duplicados
    const remoteIds = new Set((remoteBudgets || []).map(budget => budget.id));
    
    // Filtrar presupuestos que no existen en Supabase o necesitan actualización
    const budgetsToUpload = localBudgets.filter(budget => 
      !remoteIds.has(budget.id)
    ).map(budget => ({
      id: budget.id,
      categoria: budget.categoria,
      limite: budget.limite,
      actual: budget.actual,
      periodo: budget.periodo,
      fechaInicio: budget.fechaInicio,
      fechaFin: budget.fechaFin,
      notas: budget.notas,
      recurrente: budget.recurrente,
      frecuenciaRecurrencia: budget.frecuenciaRecurrencia,
      fechaFinRecurrencia: budget.fechaFinRecurrencia,
      createdAt: new Date(budget.createdAt).toISOString(),
      updatedAt: new Date(budget.updatedAt).toISOString()
    }));
    
    if (budgetsToUpload.length === 0) {
      console.log('No hay nuevos presupuestos para subir');
      return;
    }
    
    // Subir presupuestos a Supabase
    const { error } = await supabase.from('budgets').upsert(budgetsToUpload, {
      onConflict: 'id'
    });
    
    if (error) {
      console.error('Error al subir presupuestos a Supabase:', error);
      return;
    }
    
    console.log(`${budgetsToUpload.length} presupuestos subidos a Supabase`);
  } catch (err) {
    console.error('Error durante la subida de presupuestos:', err);
  }
};

// Actualizar la función de sincronización principal
export const syncWithSupabase = async () => {
  try {
    // Sincronizar transacciones (bajada)
    await syncTransactionsWithSupabase();
    
    // Sincronizar presupuestos (bajada)
    await syncBudgetsWithSupabase();
    
    // Subir transacciones locales (subida)
    await uploadLocalTransactionsToSupabase();
    
    // Subir presupuestos locales (subida)
    await uploadLocalBudgetsToSupabase();
  } catch (error) {
    console.error('Error en sincronización general:', error);
  }
};

// Función para subir transacciones locales a Supabase
export const uploadLocalTransactionsToSupabase = async () => {
  try {
    // Obtener transacciones locales pendientes de sincronizar
    const localTransactions = await getTransactions();
    const pendingTransactions = localTransactions.filter(tx => tx.syncStatus === 'pending');
    
    if (pendingTransactions.length === 0) {
      console.log('No hay nuevas transacciones para subir');
      return;
    }
    
    // Transformar para formato de Supabase
    const transactionsToUpload = pendingTransactions.map(tx => ({
      id: tx.id,
      concepto: tx.concepto,
      categoria: tx.categoria,
      monto: tx.monto,
      fecha: tx.fecha,
      cuenta: tx.cuenta,
      notas: tx.notas,
      createdAt: new Date(tx.createdAt).toISOString(),
      updatedAt: new Date(tx.updatedAt).toISOString()
    }));
    
    // Subir transacciones a Supabase
    const { error } = await supabase.from('transacciones').insert(transactionsToUpload);
    
    if (error) {
      console.error('Error al subir transacciones a Supabase:', error);
      return;
    }
    
    console.log(`${transactionsToUpload.length} transacciones subidas a Supabase`);
    return true;
  } catch (err) {
    console.error('Error durante la subida de transacciones:', err);
    return false;
  }
};  

// Función para sincronizar transacciones desde Supabase
export const syncTransactionsWithSupabase = async () => {
  try {
    // Obtener transacciones de Supabase
    const { data: remoteTransactions, error } = await supabase.from('transacciones').select('*');
    
    if (error) {
      console.log('Error al sincronizar con Supabase:', error);
      return;
    }

    // Obtener transacciones locales
    const localTransactions = await getTransactions();
    
    // Crear un mapa de IDs locales para verificar duplicados
    const localIds = new Set(localTransactions.map(tx => tx.id));
    
    // Procesar transacciones remotas que no existen localmente
// Procesar transacciones remotas que no existen localmente
for (const remoteTx of remoteTransactions || []) {
  // Solo insertar si no existe localmente
  if (!localIds.has(remoteTx.id)) {
    await addTransaction({
      concepto: remoteTx.concepto,
      categoria: remoteTx.categoria,
      categoriaId: remoteTx.categoriaId,  // Add this required field
      monto: remoteTx.monto,
      fecha: remoteTx.fecha,
      cuenta: remoteTx.cuenta || 'Desconocida',
      cuentaId: remoteTx.cuentaId,  // Add this if it's required
      notas: remoteTx.notas || '',
      // Add any other required fields
      subcategoriaId: remoteTx.subcategoriaId,  // Add if present
      subcategoria: remoteTx.subcategoria  // Add if present
    });
  }
}
    
    console.log('Sincronización con Supabase completada');
  } catch (err) {
    console.error('Error durante la sincronización:', err);
  }
};