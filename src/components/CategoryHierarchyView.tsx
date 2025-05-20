// src/components/CategoryHierarchyView.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, ChevronDown } from 'lucide-react-native';
import theme from '../theme/theme';
import { Category, getSubcategoriesByParentId } from '../database/asyncStorageDB';
import { CURRENCY_SYMBOL } from '../constants/currency';

interface CategoryHierarchyViewProps {
  category: Category;
  totalAmount: number;
  onCategoryPress?: (category: CategoryWithAmount) => void;
}

interface CategoryWithAmount extends Category {
  amount: number;
  percentage: number;
}

const CategoryHierarchyView: React.FC<CategoryHierarchyViewProps> = ({
  category,
  totalAmount,
  onCategoryPress
}) => {
  const [expanded, setExpanded] = useState(false);
  const [subcategories, setSubcategories] = useState<CategoryWithAmount[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  
  // Cargar subcategorías cuando se expande
  useEffect(() => {
    if (expanded && subcategories.length === 0) {
      loadSubcategories();
    }
  }, [expanded]);
  
  const loadSubcategories = async () => {
    try {
      setLoadingSubcategories(true);
      const subs = await getSubcategoriesByParentId(category.id);
      
      // Aquí normalmente obtendrías los montos de gastos para cada subcategoría desde tu BD
      // Este es solo un ejemplo - en una implementación real deberías obtener datos reales
      const subsWithAmounts: CategoryWithAmount[] = subs.map(sub => {
        // Para este ejemplo, asignamos valores aleatorios a las subcategorías
        // que sumen aproximadamente al valor de la categoría padre
        const percentage = Math.random();
        const amount = Math.round((totalAmount * percentage) * 100) / 100;
        return { ...sub, amount,percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0  };
      });
      
      // Ajustar los montos para que sumen exactamente el total de la categoría padre
      const totalSubcategories = subsWithAmounts.reduce((sum, sub) => sum + sub.amount, 0);
      
      if (subsWithAmounts.length > 0 && totalSubcategories !== totalAmount) {
        // Distribuir la diferencia en la primera subcategoría para que todo sume correctamente
        const diff = totalAmount - totalSubcategories;
        subsWithAmounts[0].amount += diff;
      }
      
      const completeSubcategories = subsWithAmounts.map(sub => ({
        ...sub,
        percentage: totalAmount > 0 ? (sub.amount / totalAmount) * 100 : 0
      }));
      
      setSubcategories(completeSubcategories);
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
    } finally {
      setLoadingSubcategories(false);
    }
  };
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const handleCategoryPress = () => {
    if (onCategoryPress) {
      // Create a CategoryWithAmount from the Category
      const categoryWithAmount: CategoryWithAmount = {
        ...category,
        amount: totalAmount,  // Use the totalAmount that's already a prop
        percentage: 100  // Or calculate an appropriate percentage
      };
      
      onCategoryPress(categoryWithAmount);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.leftSection}>
          {subcategories.length > 0 ? (
            expanded ? <ChevronDown size={20} color={theme.COLORS.text.primary} /> 
                     : <ChevronRight size={20} color={theme.COLORS.text.primary} />
          ) : <View style={styles.spacer} />}
          
          <TouchableOpacity onPress={handleCategoryPress}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              <Text style={styles.categoryName}>{category.nombre}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.amount}>{CURRENCY_SYMBOL}{totalAmount.toFixed(2)}</Text>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.subcategoriesContainer}>
          {loadingSubcategories ? (
            <Text style={styles.loadingText}>Cargando subcategorías...</Text>
          ) : subcategories.length > 0 ? (
            subcategories.map(sub => (
              <View key={sub.id} style={styles.subcategoryItem}>
                <View style={styles.subcategoryInfo}>
                  <View style={[styles.subcategoryDot, { backgroundColor: sub.color }]} />
                  <Text style={styles.subcategoryName}>{sub.nombre}</Text>
                </View>
                <Text style={styles.subcategoryAmount}>{CURRENCY_SYMBOL}{sub.amount.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noSubcategoriesText}>No hay subcategorías</Text>
          )}
          
          {/* Mostrar el porcentaje sin categorizar si no todas las transacciones están en subcategorías */}
          {subcategories.length > 0 && (
            <View style={styles.uncategorizedSection}>
              <Text style={styles.uncategorizedText}>% del gasto categorizado</Text>
              <Text style={styles.uncategorizedPercentage}>
                {Math.round((subcategories.reduce((sum, sub) => sum + sub.amount, 0) / totalAmount) * 100)}%
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.SPACING.sm,
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    overflow: 'hidden',
    ...theme.SHADOWS.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.SPACING.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    width: 20,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.SPACING.sm,
  },
  categoryName: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: '500',
    color: theme.COLORS.text.primary,
  },
  amount: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
  },
  subcategoriesContainer: {
    paddingHorizontal: theme.SPACING.md,
    paddingBottom: theme.SPACING.md,
    backgroundColor: theme.COLORS.grey[50],
  },
  subcategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  subcategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.SPACING.xl, // Indentación para mostrar jerarquía
  },
  subcategoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.SPACING.sm,
  },
  subcategoryName: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  subcategoryAmount: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  loadingText: {
    padding: theme.SPACING.md,
    color: theme.COLORS.text.secondary,
    fontStyle: 'italic',
  },
  noSubcategoriesText: {
    padding: theme.SPACING.md,
    color: theme.COLORS.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  uncategorizedSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.grey[200],
    marginTop: theme.SPACING.sm,
  },
  uncategorizedText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  uncategorizedPercentage: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: '600',
    color: theme.COLORS.primary.main,
  },
});

export default CategoryHierarchyView;