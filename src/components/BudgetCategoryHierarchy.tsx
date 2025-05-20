// src/components/BudgetCategoryHierarchy.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Edit2 
} from 'lucide-react-native';
import theme from '../theme/theme';
import { CURRENCY_SYMBOL } from '../constants/currency';
import { 
  Budget, 
  Category,
  getSubcategoriesByParentId 
} from '../database/asyncStorageDB';

// Interfaces
interface BudgetCategoryHierarchyProps {
  category: Category;
  budgets: Budget[];
  onEditBudget: (budget: Budget) => void;
}

// Componente principal para visualizar la estructura jerárquica de presupuestos
const BudgetCategoryHierarchy: React.FC<BudgetCategoryHierarchyProps> = ({ 
  category, 
  budgets, 
  onEditBudget 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [subcategoryBudgets, setSubcategoryBudgets] = useState<{[key: string]: Budget[]}>({});
  
  // Calcular totales
  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.limite, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.actual, 0);
  const percentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  
  // Cargar subcategorías cuando se expande
  useEffect(() => {
    if (isExpanded && subcategories.length === 0) {
      loadSubcategories();
    }
  }, [isExpanded]);
  
  // Cargar subcategorías
  const loadSubcategories = async () => {
    try {
      setIsLoading(true);
      const subCategories = await getSubcategoriesByParentId(category.id);
      setSubcategories(subCategories);
      
      // Agrupar presupuestos por subcategoría
      const subBudgets: {[key: string]: Budget[]} = {};
      
      // Inicializar array vacío para cada subcategoría
      subCategories.forEach(subCat => {
        subBudgets[subCat.id] = [];
      });
      
      // Agrupar los presupuestos que tienen subcategoría especificada
      budgets.forEach(budget => {
        if (budget.subcategoriaId && subBudgets[budget.subcategoriaId]) {
          subBudgets[budget.subcategoriaId].push(budget);
        }
      });
      
      setSubcategoryBudgets(subBudgets);
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Obtener color según el porcentaje
  const getProgressColor = (percent: number) => {
    if (percent > 90) return theme.COLORS.error.main;
    if (percent > 75) return theme.COLORS.warning.main;
    return theme.COLORS.success.main;
  };
  
  // Renderizar tarjeta de presupuesto
  const renderBudgetCard = (budget: Budget, isSubcategory = false) => {
    // Calcular porcentaje
    const budgetPercentage = budget.limite > 0 ? (budget.actual / budget.limite) * 100 : 0;
    
    return (
      <TouchableOpacity 
        key={budget.id}
        style={[
          styles.budgetCard,
          isSubcategory && styles.subcategoryBudgetCard
        ]}
        onPress={() => onEditBudget(budget)}
        activeOpacity={0.7}
      >
        <View style={styles.budgetHeader}>
          <View style={styles.budgetInfo}>
            <Text style={[
              styles.budgetTitle,
              isSubcategory && styles.subcategoryBudgetTitle
            ]}>
              {isSubcategory ? budget.subcategoria : `Presupuesto general`}
            </Text>
            {budget.recurrente && (
              <View style={styles.recurrentBadge}>
                <Text style={styles.recurrentBadgeText}>Recurrente</Text>
              </View>
            )}
          </View>
          
          <View style={styles.budgetAmountContainer}>
            <Text style={styles.budgetAmount}>
              {CURRENCY_SYMBOL}{budget.actual.toFixed(0)} / {CURRENCY_SYMBOL}{budget.limite.toFixed(0)}
            </Text>
            <Text style={[
              styles.budgetPercentage,
              budgetPercentage > 90 ? styles.dangerText : 
              budgetPercentage > 75 ? styles.warningText : 
              styles.successText
            ]}>
              {budgetPercentage.toFixed(0)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar,
              { 
                width: `${Math.min(budgetPercentage, 100)}%`,
                backgroundColor: getProgressColor(budgetPercentage)
              }
            ]} 
          />
        </View>
      </TouchableOpacity>
    );
  };
  
  // Renderizar presupuestos sin subcategoría específica
  const renderGeneralBudgets = () => {
    const generalBudgets = budgets.filter(b => !b.subcategoriaId);
    
    if (generalBudgets.length === 0) {
      return null;
    }
    
    return (
      <>
        {generalBudgets.map(budget => renderBudgetCard(budget))}
      </>
    );
  };
  
  // Renderizar subcategorías y sus presupuestos
  const renderSubcategories = () => {
    if (subcategories.length === 0) {
      return (
        <Text style={styles.noSubcategoriesText}>
          No hay subcategorías definidas para esta categoría.
        </Text>
      );
    }
    
    return (
      <>
        {subcategories.map(subCategory => {
          const subBudgets = subcategoryBudgets[subCategory.id] || [];
          
          if (subBudgets.length === 0) {
            return null; // No mostrar subcategorías sin presupuestos
          }
          
          // Calcular totales para esta subcategoría
          const subTotalBudgeted = subBudgets.reduce((sum, b) => sum + b.limite, 0);
          const subTotalSpent = subBudgets.reduce((sum, b) => sum + b.actual, 0);
          const subPercentage = subTotalBudgeted > 0 ? (subTotalSpent / subTotalBudgeted) * 100 : 0;
          
          return (
            <View key={subCategory.id} style={styles.subcategoryContainer}>
              <View style={styles.subcategoryHeader}>
                <View style={styles.subcategoryLeft}>
                  <View style={[styles.subcategoryDot, { backgroundColor: subCategory.color }]} />
                  <Text style={styles.subcategoryName}>{subCategory.nombre}</Text>
                </View>
                
                <View style={styles.subcategoryAmountContainer}>
                  <Text style={styles.subcategoryAmount}>
                    {CURRENCY_SYMBOL}{subTotalSpent.toFixed(0)} / {CURRENCY_SYMBOL}{subTotalBudgeted.toFixed(0)}
                  </Text>
                  <Text style={[
                    styles.subcategoryPercentage,
                    subPercentage > 90 ? styles.dangerText : 
                    subPercentage > 75 ? styles.warningText : 
                    styles.successText
                  ]}>
                    {subPercentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.subcategoryProgressContainer}>
                <View 
                  style={[
                    styles.subcategoryProgress,
                    { 
                      width: `${Math.min(subPercentage, 100)}%`,
                      backgroundColor: getProgressColor(subPercentage)
                    }
                  ]} 
                />
              </View>
              
              {subBudgets.map(budget => renderBudgetCard(budget, true))}
            </View>
          );
        })}
      </>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Encabezado de categoría */}
      <TouchableOpacity 
        style={styles.categoryHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryLeft}>
          <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
          <Text style={styles.categoryName}>{category.nombre}</Text>
        </View>
        
        <View style={styles.categoryRight}>
          <View style={styles.categoryAmountContainer}>
            <Text style={styles.categoryAmount}>
              {CURRENCY_SYMBOL}{totalSpent.toFixed(0)} / {CURRENCY_SYMBOL}{totalBudgeted.toFixed(0)}
            </Text>
            <Text style={[
              styles.categoryPercentage,
              percentage > 90 ? styles.dangerText : 
              percentage > 75 ? styles.warningText : 
              styles.successText
            ]}>
              {percentage.toFixed(0)}%
            </Text>
          </View>
          
          {isExpanded ? (
            <ChevronUp size={20} color={theme.COLORS.text.secondary} />
          ) : (
            <ChevronDown size={20} color={theme.COLORS.text.secondary} />
          )}
        </View>
      </TouchableOpacity>
      
      {/* Barra de progreso de categoría */}
      <View style={styles.categoryProgressContainer}>
        <View 
          style={[
            styles.categoryProgress,
            { 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: getProgressColor(percentage)
            }
          ]} 
        />
      </View>
      
      {/* Advertencia si está cerca del límite */}
      {percentage > 90 && (
        <View style={styles.warningContainer}>
          <AlertCircle size={16} color={theme.COLORS.error.main} />
          <Text style={styles.warningText}>
            Esta categoría está cerca de alcanzar su límite presupuestario.
          </Text>
        </View>
      )}
      
      {/* Contenido expandido */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.COLORS.primary.main} />
              <Text style={styles.loadingText}>Cargando subcategorías...</Text>
            </View>
          ) : (
            <>
              {renderGeneralBudgets()}
              {renderSubcategories()}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.md,
    ...theme.SHADOWS.sm,
  },
  
  // Estilos de la categoría principal
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.SPACING.sm,
  },
  categoryName: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmountContainer: {
    alignItems: 'flex-end',
    marginRight: theme.SPACING.sm,
  },
  categoryAmount: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  categoryPercentage: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
  },
  categoryProgressContainer: {
    height: 6,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.full,
    overflow: 'hidden',
    marginTop: theme.SPACING.xs,
  },
  categoryProgress: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.full,
  },
  
  // Estilos de advertencia
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.error.light,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.sm,
    marginTop: theme.SPACING.sm,
  },
  warningText: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.error.main,
    marginLeft: theme.SPACING.xs,
    flex: 1,
  },
  
  // Estilos del contenido expandido
  expandedContent: {
    marginTop: theme.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.grey[200],
    paddingTop: theme.SPACING.md,
  },
  loadingContainer: {
    paddingVertical: theme.SPACING.md,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
    marginTop: theme.SPACING.xs,
  },
  noSubcategoriesText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: theme.SPACING.md,
  },
  
  // Estilos de presupuestos
  budgetCard: {
    backgroundColor: theme.COLORS.grey[50],
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.sm,
    marginBottom: theme.SPACING.sm,
  },
  subcategoryBudgetCard: {
    marginLeft: theme.SPACING.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetTitle: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    color: theme.COLORS.text.primary,
  },
  subcategoryBudgetTitle: {
    fontWeight: "400",
  },
  recurrentBadge: {
    backgroundColor: theme.COLORS.primary.light,
    paddingHorizontal: theme.SPACING.xs,
    paddingVertical: 2,
    borderRadius: theme.BORDER_RADIUS.full,
    marginLeft: theme.SPACING.xs,
  },
  recurrentBadgeText: {
    color: theme.COLORS.primary.main,
    fontSize: 9,
    fontWeight: "500",
  },
  budgetAmountContainer: {
    alignItems: 'flex-end',
  },
  budgetAmount: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.text.secondary,
  },
  budgetPercentage: {
    fontSize: theme.FONT_SIZE.xs,
    fontWeight: "500",
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.full,
  },
  
  // Estilos para subcategorías
  subcategoryContainer: {
    marginBottom: theme.SPACING.md,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: theme.SPACING.xs,
  },
  subcategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subcategoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.SPACING.xs,
  },
  subcategoryName: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    color: theme.COLORS.text.primary,
  },
  subcategoryAmountContainer: {
    alignItems: 'flex-end',
  },
  subcategoryAmount: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.text.secondary,
  },
  subcategoryPercentage: {
    fontSize: theme.FONT_SIZE.xs,
    fontWeight: "500",
  },
  subcategoryProgressContainer: {
    height: 4,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: theme.SPACING.xs,
  },
  subcategoryProgress: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.full,
  },
  
  // Colores para texto
  successText: {
    color: theme.COLORS.success.main,
  },
  warningText: {
    color: theme.COLORS.warning.main,
  },
  dangerText: {
    color: theme.COLORS.error.main,
  },
});

export default BudgetCategoryHierarchy;