// En un nuevo archivo syncManager.ts
import NetInfo from "@react-native-community/netinfo";
import { getTransactions, getBudgets, updateTransaction, updateBudget } from './asyncStorageDB';
import { uploadLocalTransactionsToSupabase, uploadLocalBudgetsToSupabase } from './sync';

// Variable para evitar múltiples intentos de sincronización simultáneos
let isSyncing = false;

// Función principal para intentar sincronizar datos pendientes
export const tryToSyncPendingData = async () => {
  // Si ya está sincronizando, salir
  if (isSyncing) return;
  
  try {
    isSyncing = true;
    
    // Verificar si hay conexión a internet
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('Sin conexión a internet, no se puede sincronizar');
      return;
    }
    
    // Sincronizar transacciones pendientes
    await syncPendingTransactions();
    
    // Sincronizar presupuestos pendientes
    await syncPendingBudgets();
    
    console.log('Sincronización completada');
  } catch (error) {
    console.error('Error al sincronizar datos pendientes:', error);
  } finally {
    isSyncing = false;
  }
};

// Sincronizar transacciones pendientes
const syncPendingTransactions = async () => {
  try {
    const transactions = await getTransactions();
    const pendingTransactions = transactions.filter(tx => tx.syncStatus === 'pending');
    
    if (pendingTransactions.length === 0) {
      console.log('No hay transacciones pendientes para sincronizar');
      return;
    }
    
    console.log(`Intentando sincronizar ${pendingTransactions.length} transacciones pendientes`);
    
    // Utilizar la función existente para subir transacciones
    await uploadLocalTransactionsToSupabase();
    
    // Marcar las transacciones como sincronizadas
    for (const tx of pendingTransactions) {
      await updateTransaction(tx.id, { syncStatus: 'synced' });
    }
    
    console.log(`${pendingTransactions.length} transacciones sincronizadas exitosamente`);
  } catch (error) {
    console.error('Error al sincronizar transacciones pendientes:', error);
  }
};

// Sincronizar presupuestos pendientes
const syncPendingBudgets = async () => {
  try {
    const budgets = await getBudgets();
    const pendingBudgets = budgets.filter(b => b.syncStatus === 'pending');
    
    if (pendingBudgets.length === 0) {
      console.log('No hay presupuestos pendientes para sincronizar');
      return;
    }
    
    console.log(`Intentando sincronizar ${pendingBudgets.length} presupuestos pendientes`);
    
    // Utilizar la función existente para subir presupuestos
    await uploadLocalBudgetsToSupabase();
    
    // Marcar los presupuestos como sincronizados
    for (const budget of pendingBudgets) {
      await updateBudget(budget.id, { syncStatus: 'synced' });
    }
    
    console.log(`${pendingBudgets.length} presupuestos sincronizados exitosamente`);
  } catch (error) {
    console.error('Error al sincronizar presupuestos pendientes:', error);
  }
};

// Configurar un listener de conectividad para intentar sincronizar cuando se recupere la conexión
export const setupConnectivityListener = () => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      console.log('Conexión a internet recuperada, intentando sincronizar datos pendientes');
      tryToSyncPendingData();
    }
  });
  
  return unsubscribe;
};