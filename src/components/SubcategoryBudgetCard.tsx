// src/components/SubcategoryBudgetCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../theme/theme';
import { CURRENCY_SYMBOL } from '../constants/currency';

interface SubcategoryBudgetCardProps {
  subcategoria: string;
  actual: number;
  limite: number;
  porcentaje: number;
  onPress?: () => void;
}

const SubcategoryBudgetCard: React.FC<SubcategoryBudgetCardProps> = ({
  subcategoria,
  actual,
  limite,
  porcentaje,
  onPress,
}) => {
  // Determinar el color de la barra de progreso según el porcentaje
  const getProgressColor = () => {
    if (porcentaje > 90) return theme.COLORS.error.main; // Rojo para > 90%
    if (porcentaje > 75) return theme.COLORS.warning.main; // Amarillo para > 75%
    return theme.COLORS.success.main; // Verde para el resto
  };

  // Limitar el porcentaje a 100% máximo para la visualización
  const displayPercentage = Math.min(porcentaje, 100);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.subcategoria}>{subcategoria}</Text>
        <Text style={styles.detalle}>
          {CURRENCY_SYMBOL}{actual.toFixed(0)} / {CURRENCY_SYMBOL}{limite.toFixed(0)}
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${displayPercentage}%`, backgroundColor: getProgressColor() }
          ]} 
        />
      </View>
      {porcentaje > 90 && (
        <Text style={styles.warningText}>¡Alerta!</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.sm,
    marginBottom: theme.SPACING.sm,
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs,
  },
  subcategoria: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    color: theme.COLORS.text.primary,
  },
  detalle: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.text.secondary,
  },
  progressContainer: {
    height: 6,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.xs,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.xs,
  },
  warningText: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.error.main,
    fontWeight: "500",
    marginTop: theme.SPACING.xs,
    textAlign: 'right',
  },
});

export default SubcategoryBudgetCard;

