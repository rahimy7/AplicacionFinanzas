import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView
} from 'react-native';
import { ArrowLeft, ChevronRight, Users, Tag, Moon, Bell, Trash2, HelpCircle } from 'lucide-react-native';
import theme from '../theme/theme';
import { NavigationProps } from '../types/navigation';

const Settings: React.FC<NavigationProps<'Settings'>> = ({ navigation }) => {
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>
      
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Users size={20} color={theme.COLORS.primary.main} />
            <Text style={styles.menuItemText}>Gestionar perfil familiar</Text>
            <ChevronRight size={20} color={theme.COLORS.grey[400]} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personalización</Text>
          
          {/* Elemento añadido para gestionar categorías */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('CategoryManagement')}
          >
            <Tag size={20} color={theme.COLORS.primary.main} />
            <Text style={styles.menuItemText}>Administrar categorías</Text>
            <ChevronRight size={20} color={theme.COLORS.grey[400]} />
          </TouchableOpacity>
          
          <View style={styles.switchItem}>
            <View style={styles.switchItemLeft}>
              <Moon size={20} color={theme.COLORS.primary.main} />
              <Text style={styles.menuItemText}>Modo oscuro</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: theme.COLORS.grey[300], true: theme.COLORS.primary.light }}
              thumbColor={darkMode ? theme.COLORS.primary.main : theme.COLORS.grey[100]}
            />
          </View>
          
          <View style={styles.switchItem}>
            <View style={styles.switchItemLeft}>
              <Bell size={20} color={theme.COLORS.primary.main} />
              <Text style={styles.menuItemText}>Notificaciones</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: theme.COLORS.grey[300], true: theme.COLORS.primary.light }}
              thumbColor={notifications ? theme.COLORS.primary.main : theme.COLORS.grey[100]}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Trash2 size={20} color={theme.COLORS.error.main} />
            <Text style={[styles.menuItemText, { color: theme.COLORS.error.main }]}>
              Limpiar datos locales
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayuda</Text>
          <TouchableOpacity style={styles.menuItem}>
            <HelpCircle size={20} color={theme.COLORS.primary.main} />
            <Text style={styles.menuItemText}>Acerca de la app</Text>
            <ChevronRight size={20} color={theme.COLORS.grey[400]} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versión 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.COLORS.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.SPACING.md,
    backgroundColor: theme.COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  backButton: {
    marginRight: theme.SPACING.md,
  },
  headerTitle: {
    fontSize: theme.FONT_SIZE.xl,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
  },
  container: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.COLORS.common.white,
    marginVertical: theme.SPACING.sm,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    ...theme.SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
    marginVertical: theme.SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  menuItemText: {
    flex: 1,
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
    marginLeft: theme.SPACING.md,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  switchItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    padding: theme.SPACING.xl,
  },
  versionText: {
    color: theme.COLORS.text.secondary,
    fontSize: theme.FONT_SIZE.sm,
  },
});

export default Settings;