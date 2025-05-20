import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { setupAsyncStorage, loadSampleData } from './src/database/asyncStorageDB';
import { 
  syncWithSupabase, 
  uploadLocalTransactionsToSupabase,
  uploadLocalBudgetsToSupabase 
} from './src/database/sync';
import NetInfo from "@react-native-community/netinfo";

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Inicializar AsyncStorage con categorías y cuentas predeterminadas
        await setupAsyncStorage();
        
        // Cargar datos de ejemplo para desarrollo
        // Comentar esta línea en producción
        await loadSampleData();
        
        // Verificar conexión a internet antes de sincronizar
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          // Sincronizar con Supabase
          await syncWithSupabase();
          
          // Subir transacciones y presupuestos locales pendientes
          await uploadLocalTransactionsToSupabase();
          await uploadLocalBudgetsToSupabase();
        } else {
          Alert.alert(
            "Sin conexión", 
            "No se pueden sincronizar los datos. Verifica tu conexión a internet."
          );
        }
      } catch (error) {
        console.error("Error inicializando la aplicación:", error);
        Alert.alert(
          "Error de inicialización", 
          "Hubo un problema al configurar la aplicación. Intenta reiniciar."
        );
      }
    };
    
    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}