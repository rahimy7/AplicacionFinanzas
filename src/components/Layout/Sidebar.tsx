// src/components/Layout/Sidebar.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView 
} from 'react-native';
import { 
  Home, 
  CreditCard, 
  BarChart2, 
  Target, 
  Users, 
  Settings, 
  LogOut,
  PieChart
} from 'lucide-react-native';
import theme from '../../theme/theme';

import { SidebarNavigationProp } from '../../types/navigation'; // Ajusta la ruta de importación

interface SidebarProps {
  activeScreen: string;
  onScreenChange: (screen: string) => void;
  onClose: () => void;
  visible: boolean;
  navigation?: SidebarNavigationProp; // Usar el tipo correcto
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeScreen, 
  onScreenChange, 
  onClose,
  visible 
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
            <TouchableOpacity style={styles.logoutButton}>
              <LogOut size={20} color={theme.COLORS.grey[600]} />
              <Text style={styles.logoutText}>Cerrar sesión</Text>
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
    fontWeight: "700", // Valor directo en lugar de theme.FONT_WEIGHT.bold
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "700", // Valor directo en lugar de theme.FONT_WEIGHT.bold
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
    fontWeight: "600", // Valor directo en lugar de theme.FONT_WEIGHT.semibold
  },
  footer: {
    padding: theme.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.grey[200],
    marginTop: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.SPACING.md,
  },
  logoutText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
    marginLeft: theme.SPACING.md,
  },
  versionText: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.text.secondary,
    marginTop: theme.SPACING.md,
    textAlign: 'center',
  },
});

export default Sidebar;