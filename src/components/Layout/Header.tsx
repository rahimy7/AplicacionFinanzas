// src/components/Layout/Header.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Modal, Alert } from 'react-native';
import { Menu, X, Plus, User, Trash2, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../theme/theme';
import { clearLocalDatabase } from '../../database/asyncStorageDB';

interface HeaderProps {
  title: string;
  showMenu?: boolean;
  menuOpen?: boolean;
  onMenuPress?: () => void;
  onAddPress?: () => void;
  onProfilePress?: () => void;
  navigation?: any;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showMenu = true,
  menuOpen = false,
  onMenuPress,
  onAddPress,
  onProfilePress,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const toggleOptionsMenu = () => {
    setShowOptionsMenu(!showOptionsMenu);
  };

  // Función para limpiar datos locales
  const handleClearLocalData = async () => {
    try {
      Alert.alert(
        'Limpiar Datos Locales',
        '¿Estás seguro de que quieres eliminar todos los datos locales? Esta acción no se puede deshacer.',
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
                // Cerrar el menú
                setShowOptionsMenu(false);
                
                // Eliminar datos locales
                await clearLocalDatabase();
                Alert.alert('Éxito', 'Los datos locales se han eliminado correctamente. La aplicación se reiniciará.');
                
                // Reiniciar a la pantalla principal si hay navegación disponible
                if (navigation) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Dashboard' }],
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.COLORS.primary.dark} />
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showMenu && (
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={toggleOptionsMenu}
            >
              {menuOpen ? (
                <X size={24} color={theme.COLORS.common.white} />
              ) : (
                <Menu size={24} color={theme.COLORS.common.white} />
              )}
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.rightSection}>
          {onAddPress && (
            <TouchableOpacity style={styles.actionButton} onPress={onAddPress}>
              <Plus size={20} color={theme.COLORS.common.white} />
            </TouchableOpacity>
          )}
          {onProfilePress && (
            <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
              <Text style={styles.profileInitials}>LF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Menú de opciones desplegable */}
      {showOptionsMenu && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleClearLocalData}
          >
            <Trash2 size={20} color={theme.COLORS.error.main} style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: theme.COLORS.error.main }]}>
              Limpiar Datos Locales
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => {
              setShowOptionsMenu(false);
              // Aquí puedes agregar más acciones
            }}
          >
            <RefreshCw size={20} color={theme.COLORS.primary.main} style={styles.optionIcon} />
            <Text style={styles.optionText}>Actualizar Datos</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.primary.main,
    width: '100%',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.SPACING.sm,
  },
  menuButton: {
    marginRight: theme.SPACING.sm,
  },
  title: {
    color: theme.COLORS.common.white,
    fontSize: theme.FONT_SIZE.xl,
    fontWeight: "700",
  },
  actionButton: {
    backgroundColor: theme.COLORS.primary.dark,
    width: 40,
    height: 40,
    borderRadius: theme.BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    backgroundColor: theme.COLORS.primary.dark,
    width: 40,
    height: 40,
    borderRadius: theme.BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: theme.COLORS.common.white,
    fontWeight: "600",
    fontSize: theme.FONT_SIZE.md,
  },
  optionsMenu: {
    position: 'absolute',
    top: 60 + (StatusBar.currentHeight || 0),
    left: theme.SPACING.md,
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.xs,
    width: 220,
    ...theme.SHADOWS.lg,
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
  },
  optionIcon: {
    marginRight: theme.SPACING.sm,
  },
  optionText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
});

export default Header;