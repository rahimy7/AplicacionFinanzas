// src/components/BudgetCard.tsx (actualización)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import theme from '../theme/theme';
import { CURRENCY_SYMBOL } from '../constants/currency';

interface BudgetCardProps {
  categoria: string;
  actual: number;
  limite: number;
  porcentaje: number;
  recurrente?: boolean;
  fechaFin?: string;
  hasSubcategories?: boolean;
  isExpanded?: boolean;
  onPress?: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({
  categoria,
  actual,
  limite,
  porcentaje,
  recurrente,
  fechaFin,
  hasSubcategories,
  isExpanded,
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
  
  // Formatear la fecha para mostrar
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        hasSubcategories && styles.categoryContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <Text style={[
            styles.categoria,
            hasSubcategories && styles.categoryWithSubcategories
          ]}>
            {categoria}
          </Text>
          {hasSubcategories && (
            <View style={styles.expandIconContainer}>
              {isExpanded ? (
                <ChevronUp size={16} color={theme.COLORS.primary.main} />
              ) : (
                <ChevronDown size={16} color={theme.COLORS.primary.main} />
              )}
            </View>
          )}
          {recurrente && (
            <View style={styles.recurrentBadge}>
              <Text style={styles.recurrentText}>Recurrente</Text>
            </View>
          )}
          {hasSubcategories && (
            <View style={styles.subcategoryBadge}>
              <Text style={styles.subcategoryBadgeText}>Con subcategorías</Text>
            </View>
          )}
        </View>
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
      <View style={styles.footer}>
        {porcentaje > 90 && (
          <Text style={styles.warningText}>¡Cerca del límite!</Text>
        )}
        {recurrente && fechaFin && (
          <Text style={styles.dateText}>Hasta: {formatDate(fechaFin)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.SPACING.md,
    paddingHorizontal: theme.SPACING.sm,
    marginBottom: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  categoryContentContainer: {
    backgroundColor: theme.COLORS.grey[50],
    borderRadius: theme.BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.COLORS.primary.main,
    paddingLeft: theme.SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs,
  },
  categoria: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
  },
  categoryWithSubcategories: {
    color: theme.COLORS.primary.main,
  },
  detalle: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  progressContainer: {
    height: 8,
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
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recurrentBadge: {
    backgroundColor: theme.COLORS.primary.light,
    paddingHorizontal: theme.SPACING.xs,
    paddingVertical: 2,
    borderRadius: theme.BORDER_RADIUS.full,
    marginLeft: theme.SPACING.xs,
  },
  recurrentText: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.primary.main,
    fontWeight: "500",
  },
  subcategoryBadge: {
    backgroundColor: theme.COLORS.info.light,
    paddingHorizontal: theme.SPACING.xs,
    paddingVertical: 2,
    borderRadius: theme.BORDER_RADIUS.full,
    marginLeft: theme.SPACING.xs,
  },
  subcategoryBadgeText: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.info.main,
    fontWeight: "500",
  },
  expandIconContainer: {
    marginLeft: theme.SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.SPACING.xs,
  },
  dateText: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.text.secondary,
  },
});

export default BudgetCard;
