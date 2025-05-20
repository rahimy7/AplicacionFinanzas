// src/components/Layout/Sidebar.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import { 
  Home, 
  CreditCard, 
  BarChart2, 
  Target, 
  Users, 
  Settings, 
  LogOut,
  PieChart,
  Trash2
} from 'lucide-react-native';
import { clearLocalDatabase } from '../database/asyncStorageDB';
import theme from '../theme/theme';
import { SidebarNavigationProp } from '../types/navigation';

interface SidebarProps {
  activeScreen: string;
  onScreenChange: (screen: string) => void;
  onClose: () => void;
  visible: boolean;
  navigation?: SidebarNavigationProp;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeScreen, 
  onScreenChange, 
  onClose,
  visible,
  navigation
}) => {
  if (!visible) return null;

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'transactions', icon: CreditCard, label: 'Transacciones' },
    { id: 'budgets', icon: BarChart2, label: 'Presupuestos' },
    { id: 'analytics', icon: PieChart, label: 'Análisis' },
    { id: 'goals', icon: Target, label: 'Metas' },
    { id: 'family', icon: Users, label: 'Familia' },
    { id: 'settings', icon: Settings, label: 'Configuración' },
  ];

  const handleMenuItemPress = (screenId: string) => {
    onScreenChange(screenId);
    onClose();
  };

  // Función para limpiar datos locales
  const handleClearLocalData = async () => {
    try {
      Alert.alert(
        'Limpiar Datos Locales',
        '¿Estás seguro de que quieres eliminar todos los datos locales? Esta acción no se puede deshacer y cerrará la sesión.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                // Eliminar datos locales
                await clearLocalDatabase();
                
                // Opcional: Cerrar sesión o reiniciar la navegación
                if (navigation) {
                  // Navegar a la pantalla de login o inicial
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }], // Asegúrate de tener esta ruta
                  });
                }
              } catch (error) {
                Alert.alert('Error', 'No se pudieron eliminar los datos locales');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudieron eliminar los datos locales');
    }
  };

  // Función de logout
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            // Implementar lógica de logout
            if (navigation) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }], // Asegúrate de tener esta ruta
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.closeArea} onPress={onClose} />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.header}>
            <View style={styles.profileContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>LF</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Familia López</Text>
                <Text style={styles.profileEmail}>lopez@example.com</Text>
              </View>
            </View>
          </View>

          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  activeScreen === item.id ? styles.activeMenuItem : null
                ]}
                onPress={() => handleMenuItemPress(item.id)}
              >
                <item.icon 
                  size={20} 
                  color={activeScreen === item.id ? theme.COLORS.primary.main : theme.COLORS.grey[600]} 
                />
                <Text 
                  style={[
                    styles.menuItemText,
                    activeScreen === item.id ? styles.activeMenuItemText : null
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            {/* Botón de limpieza de datos */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleClearLocalData}
            >
              <Trash2 size={20} color={theme.COLORS.error.main} />
              <Text style={[styles.menuItemText, { color: theme.COLORS.error.main }]}>
                Limpiar Datos Locales
              </Text>
            </TouchableOpacity>

            {/* Botón de logout */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleLogout}
            >
              <LogOut size={20} color={theme.COLORS.grey[600]} />
              <Text style={styles.menuItemText}>Cerrar Sesión</Text>
            </TouchableOpacity>
            
            <Text style={styles.versionText}>Versión 1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    flexDirection: 'row',
  },
  closeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: '75%',
    maxWidth: 300,
    backgroundColor: theme.COLORS.common.white,
    ...theme.SHADOWS.lg,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.SPACING.md,
  },
  avatarText: {
    color: theme.COLORS.common.white,
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "700",
    color: theme.COLORS.text.primary,
    marginBottom: theme.SPACING.xs,
  },
  profileEmail: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  menuContainer: {
    padding: theme.SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.SPACING.md,
    paddingHorizontal: theme.SPACING.sm,
    borderRadius: theme.BORDER_RADIUS.md,
    marginBottom: theme.SPACING.xs,
  },
  activeMenuItem: {
    backgroundColor: theme.COLORS.primary.light,
  },
  menuItemText: {
    fontSize: theme.FONT_SIZE.md,
    marginLeft: theme.SPACING.md,
    color: theme.COLORS.text.primary,
  },
  activeMenuItemText: {
    color: theme.COLORS.primary.main,
    fontWeight: "600",
  },
  footer: {
    padding: theme.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.grey[200],
    marginTop: 'auto',
  },
  versionText: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.text.secondary,
    marginTop: theme.SPACING.md,
    textAlign: 'center',
  },
});

export default Sidebar;