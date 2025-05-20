// src/screens/Budgets.tsx (versión mejorada)
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react-native';
import BudgetCard from '../components/BudgetCard';
import SubcategoryBudgetCard from '../components/SubcategoryBudgetCard';
import { 
  getBudgets, 
  Budget, 
  getCategories, 
  getSubcategoriesByParentId,
  getTransactions,
  Category
} from '../database/asyncStorageDB';
import { CURRENCY_SYMBOL } from '../constants/currency';
import theme from '../theme/theme';
import { NavigationProps } from '../types/navigation';

// Interface for budget with subcategory budgets
interface HierarchicalBudget extends Budget {
  category?: Category;
  subcategory?: Category;
  subcategoryBudgets?: Budget[];
  isExpanded?: boolean;
}

const BudgetsScreen: React.FC<NavigationProps<'Budgets'>> = ({ navigation }) => {
  // Estado para el período seleccionado
  const [activePeriod, setActivePeriod] = useState<'quincenal-1' | 'quincenal-2' | 'mensual' | 'trimestral' | 'anual'>('mensual');
  
  // Estados para datos
  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);
  const [hierarchicalBudgets, setHierarchicalBudgets] = useState<HierarchicalBudget[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  
  // Cargar datos al iniciar y cuando cambia el período
  useEffect(() => {
    loadData();
  }, []);
  
  // Procesar presupuestos cuando cambia el período
  useEffect(() => {
    processHierarchicalBudgets();
  }, [activePeriod, allBudgets, allTransactions]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      setRefreshing(true);
      
      // Cargar presupuestos
      const budgets = await getBudgets();
      setAllBudgets(budgets);
      
      // Cargar transacciones para calcular montos ejecutados
      const transactions = await getTransactions();
      setAllTransactions(transactions);
    } catch (error) {
      console.error('Error loading budgets data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de presupuestos');
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };
  
  // Función para procesar presupuestos jerárquicamente
  const processHierarchicalBudgets = async () => {
    try {
      // Obtener todas las categorías
      const categories = await getCategories();
      
      // Crear mapa de categorías para búsqueda rápida
      const categoryMap = new Map<string, Category>();
      categories.forEach(cat => categoryMap.set(cat.id, cat));
      
      // Filtrar presupuestos por período
      const filteredBudgets = allBudgets.filter(budget => budget.periodo === activePeriod);
      
      // Organizar presupuestos por categoría principal
      const groupedBudgets = new Map<string, Budget[]>();
      
      // Procesar cada presupuesto
      for (const budget of filteredBudgets) {
        const mainCategoryId = budget.categoriaId;
        
        if (!mainCategoryId) continue;
        
        // Iniciar un nuevo array para esta categoría si no existe
        if (!groupedBudgets.has(mainCategoryId)) {
          groupedBudgets.set(mainCategoryId, []);
        }
        
        // Añadir presupuesto al grupo de la categoría
        groupedBudgets.get(mainCategoryId)?.push(budget);
      }
      
      // Crear presupuestos jerárquicos
      const hierarchicalBudgets: HierarchicalBudget[] = [];
      
      // Procesar cada grupo de categoría
      for (const [categoryId, categoryBudgets] of groupedBudgets.entries()) {
        // Obtener la categoría
        const category = categoryMap.get(categoryId);
        
        if (!category) continue;
        
        // Separar en presupuestos de categoría principal y subcategorías
        const mainBudgets = categoryBudgets.filter(budget => !budget.subcategoriaId);
        const subBudgets = categoryBudgets.filter(budget => budget.subcategoriaId);
        
        // Calcular lo ejecutado para esta categoría
        const executedAmount = calculateExecutedAmount(categoryId);
        
        // Si hay un presupuesto para la categoría principal, usarlo como padre
        if (mainBudgets.length > 0) {
          const mainBudget = mainBudgets[0];
          
          // Añadir información de categoría y monto ejecutado
          const hierarchicalBudget: HierarchicalBudget = {
            ...mainBudget,
            category,
            isExpanded: false,
            actual: executedAmount // Actualizar con monto ejecutado real
          };
          
          // Añadir presupuestos de subcategorías si los hay
          if (subBudgets.length > 0) {
            // Mejorar presupuestos de subcategorías con información de categoría
            const enhancedSubBudgets: HierarchicalBudget[] = [];
            
            for (const budget of subBudgets) {
              if (budget.subcategoriaId) {
                const subcategory = categoryMap.get(budget.subcategoriaId);
                if (subcategory) {
                  // Calcular lo ejecutado para esta subcategoría
                  const subExecutedAmount = calculateExecutedAmount(categoryId, budget.subcategoriaId);
                  
                  enhancedSubBudgets.push({
                    ...budget,
                    subcategory,
                    actual: subExecutedAmount // Actualizar con monto ejecutado real
                  });
                }
              }
            }
            
            hierarchicalBudget.subcategoryBudgets = enhancedSubBudgets;
          }
          
          hierarchicalBudgets.push(hierarchicalBudget);
        }
        // Si no hay presupuesto para la categoría principal pero hay para subcategorías,
        // crear un presupuesto consolidado para la categoría
        else if (subBudgets.length > 0) {
          // Calcular totales
          const totalLimit = subBudgets.reduce((sum, budget) => sum + budget.limite, 0);
          
          // Mejorar presupuestos de subcategorías con información de categoría
          const enhancedSubBudgets: HierarchicalBudget[] = [];
          
          for (const budget of subBudgets) {
            if (budget.subcategoriaId) {
              const subcategory = categoryMap.get(budget.subcategoriaId);
              if (subcategory) {
                // Calcular lo ejecutado para esta subcategoría
                const subExecutedAmount = calculateExecutedAmount(categoryId, budget.subcategoriaId);
                
                enhancedSubBudgets.push({
                  ...budget,
                  subcategory,
                  actual: subExecutedAmount // Actualizar con monto ejecutado real
                });
              }
            }
          }
          
          // Crear presupuesto consolidado
          const consolidatedBudget: HierarchicalBudget = {
            id: `consolidated-${categoryId}`,
            categoria: category.nombre,
            categoriaId: category.id,
            limite: totalLimit,
            actual: executedAmount, // Actualizar con monto ejecutado real
            periodo: activePeriod,
            fechaInicio: enhancedSubBudgets[0]?.fechaInicio || new Date().toISOString(),
            fechaFin: enhancedSubBudgets[0]?.fechaFin || new Date().toISOString(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            category,
            isExpanded: false,
            subcategoryBudgets: enhancedSubBudgets
          };
          
          hierarchicalBudgets.push(consolidatedBudget);
        }
      }
      
      // Ordenar por monto (mayor primero)
      hierarchicalBudgets.sort((a, b) => b.limite - a.limite);
      
      setHierarchicalBudgets(hierarchicalBudgets);
    } catch (error) {
      console.error('Error processing budgets:', error);
      Alert.alert('Error', 'No se pudieron procesar los presupuestos');
    }
  };
  
  // Función para calcular monto ejecutado a partir de transacciones
  const calculateExecutedAmount = (categoryId: string, subcategoryId?: string) => {
    try {
      // Obtener transacciones del período actual
      const currentPeriodTransactions = filterTransactionsByPeriod(allTransactions, activePeriod);
      
      // Filtrar transacciones por categoría y opcionalmente por subcategoría
      let filteredTransactions;
      
      if (subcategoryId) {
        // Buscar por subcategoría específica
        filteredTransactions = currentPeriodTransactions.filter(tx => 
          tx.subcategoriaId === subcategoryId || 
          (tx.categoriaId === categoryId && tx.subcategoriaId === undefined)
        );
      } else {
        // Buscar por categoría principal (incluyendo todas sus subcategorías)
        filteredTransactions = currentPeriodTransactions.filter(tx => 
          tx.categoriaId === categoryId || 
          tx.subcategoriaId?.startsWith(categoryId)
        );
      }
      
      // Sumar montos (solo gastos, valores negativos)
      const totalAmount = filteredTransactions.reduce((sum, tx) => {
        // Solo contabilizar gastos (valores negativos)
        return tx.monto < 0 ? sum + Math.abs(tx.monto) : sum;
      }, 0);
      
      return totalAmount;
    } catch (error) {
      console.error('Error calculating executed amount:', error);
      return 0;
    }
  };
  
  // Filtrar transacciones por período
  const filterTransactionsByPeriod = (transactions: any[], period: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return transactions.filter(tx => {
      if (!tx.fecha) return false;
      
      const txDate = new Date(tx.fecha);
      
      switch (period) {
        case 'quincenal-1':
          // Primera quincena del mes actual (1-15)
          return txDate.getFullYear() === currentYear && 
                 txDate.getMonth() === currentMonth && 
                 txDate.getDate() <= 15;
        
        case 'quincenal-2':
          // Segunda quincena del mes actual (16-fin de mes)
          return txDate.getFullYear() === currentYear && 
                 txDate.getMonth() === currentMonth && 
                 txDate.getDate() > 15;
        
        case 'mensual':
          // Mes actual completo
          return txDate.getFullYear() === currentYear && 
                 txDate.getMonth() === currentMonth;
        
        case 'trimestral':
          // Trimestre actual
          const currentQuarter = Math.floor(currentMonth / 3);
          const txQuarter = Math.floor(txDate.getMonth() / 3);
          return txDate.getFullYear() === currentYear && 
                 txQuarter === currentQuarter;
        
        case 'anual':
          // Año actual completo
          return txDate.getFullYear() === currentYear;
        
        default:
          return false;
      }
    });
  };
  
  const handleEditBudget = (budget: Budget) => {
    // Omitir edición de presupuestos consolidados
    if (budget.id.toString().startsWith('consolidated-')) {
      Alert.alert(
        'Presupuesto Consolidado',
        'Este es un presupuesto consolidado calculado a partir de presupuestos de subcategorías. Para editarlo, modifica los presupuestos individuales.',
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }
    
    navigation.navigate('AddBudget', { budget });
  };
  
  const handleToggleExpand = (budgetId: string) => {
    setHierarchicalBudgets(prev => 
      prev.map(budget => 
        budget.id === budgetId
          ? { ...budget, isExpanded: !budget.isExpanded }
          : budget
      )
    );
  };
  
  // Calcular estadísticas de resumen
  const calculateSummary = () => {
    const totalPresupuestado = hierarchicalBudgets.reduce((sum, budget) => {
      // Solo contar presupuestos de categoría principal y consolidados
      if (!budget.id.toString().startsWith('consolidated-')) {
        return sum + budget.limite;
      }
      return sum;
    }, 0);
    
    const totalGastado = hierarchicalBudgets.reduce((sum, budget) => {
      // Solo contar presupuestos de categoría principal y consolidados
      if (!budget.id.toString().startsWith('consolidated-')) {
        return sum + budget.actual;
      }
      return sum;
    }, 0);
    
    const porcentajeTotal = totalPresupuestado > 0 
      ? Math.round((totalGastado / totalPresupuestado) * 100) 
      : 0;
      
    const recurrentCount = hierarchicalBudgets.filter(
      budget => budget.recurrente
    ).length;
    
    return {
      totalPresupuestado,
      totalGastado,
      porcentajeTotal,
      recurrentCount
    };
  };
  
  const summary = calculateSummary();
  
  // Renderizar la lista de presupuestos con jerarquía
  const renderBudgetList = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
          <Text style={styles.loadingText}>Cargando presupuestos...</Text>
        </View>
      );
    }
    
    if (hierarchicalBudgets.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No hay presupuestos para este período</Text>
        </View>
      );
    }
    
    return (
      <FlatList
        data={hierarchicalBudgets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.budgetItem}>
            {/* Tarjeta de presupuesto principal */}
            <TouchableOpacity 
              activeOpacity={item.subcategoryBudgets?.length ? 0.7 : 1}
              onPress={() => {
                if (item.subcategoryBudgets?.length) {
                  handleToggleExpand(item.id);
                } else {
                  handleEditBudget(item);
                }
              }}
            >
              <BudgetCard
                categoria={item.category?.nombre || item.categoria}
                actual={item.actual}
                limite={item.limite}
                porcentaje={(item.actual / item.limite) * 100}
                recurrente={item.recurrente}
                fechaFin={item.fechaFin}
                hasSubcategories={Boolean(item.subcategoryBudgets?.length)}
                isExpanded={item.isExpanded}
              />
            </TouchableOpacity>
            
            {/* Mostrar presupuestos de subcategorías si está expandido */}
            {item.isExpanded && item.subcategoryBudgets && (
              <View style={styles.subcategoriesContainer}>
                {item.subcategoryBudgets.map((subBudget) => (
                  <SubcategoryBudgetCard
                    key={subBudget.id}
                    subcategoria={
                      typeof subBudget.subcategoria === 'object' && subBudget.subcategoria !== null
                        ? (subBudget.subcategoria as { nombre: string }).nombre  // Add explicit type assertion
                        : typeof subBudget.subcategoria === 'string' 
                          ? subBudget.subcategoria 
                          : 'Sin nombre'
                    }
                    actual={subBudget.actual}
                    limite={subBudget.limite}
                    porcentaje={(subBudget.actual / subBudget.limite) * 100}
                    onPress={() => handleEditBudget(subBudget)}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      />
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Selector de período */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodSelectorContainer}>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              activePeriod === 'quincenal-1' && styles.periodButtonActive
            ]}
            onPress={() => setActivePeriod('quincenal-1')}
          >
            <Text style={[
              styles.periodButtonText,
              activePeriod === 'quincenal-1' && styles.periodButtonTextActive
            ]}>
              1ª Quincena
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              activePeriod === 'quincenal-2' && styles.periodButtonActive
            ]}
            onPress={() => setActivePeriod('quincenal-2')}
          >
            <Text style={[
              styles.periodButtonText,
              activePeriod === 'quincenal-2' && styles.periodButtonTextActive
            ]}>
              2ª Quincena
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              activePeriod === 'mensual' && styles.periodButtonActive
            ]}
            onPress={() => setActivePeriod('mensual')}
          >
            <Text style={[
              styles.periodButtonText,
              activePeriod === 'mensual' && styles.periodButtonTextActive
            ]}>
              Mes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              activePeriod === 'trimestral' && styles.periodButtonActive
            ]}
            onPress={() => setActivePeriod('trimestral')}
          >
            <Text style={[
              styles.periodButtonText,
              activePeriod === 'trimestral' && styles.periodButtonTextActive
            ]}>
              Trimestre
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              activePeriod === 'anual' && styles.periodButtonActive
            ]}
            onPress={() => setActivePeriod('anual')}
          >
            <Text style={[
              styles.periodButtonText,
              activePeriod === 'anual' && styles.periodButtonTextActive
            ]}>
              Año
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Tarjeta de resumen */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen de presupuestos</Text>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>Total gastado</Text>
          <Text style={styles.summaryValue}>
            {CURRENCY_SYMBOL}{summary.totalGastado.toFixed(0)} / 
            {CURRENCY_SYMBOL}{summary.totalPresupuestado.toFixed(0)}
          </Text>
          <Text style={styles.summaryPercentage}>
            {summary.porcentajeTotal}% del presupuesto
          </Text>
          
          {summary.recurrentCount > 0 && (
            <Text style={styles.recurrentText}>
              {summary.recurrentCount} presupuesto(s) recurrente(s)
            </Text>
          )}
        </View>
        
        {/* Barra de progreso */}
        <View style={styles.progressContainer}>
          <View style={[
            styles.progressBar, 
            { 
              width: `${summary.porcentajeTotal}%`,
              backgroundColor: summary.porcentajeTotal > 90 
                ? theme.COLORS.error.main 
                : summary.porcentajeTotal > 75 
                  ? theme.COLORS.warning.main 
                  : theme.COLORS.success.main 
            }
          ]} />
        </View>
      </View>
      
      {/* Lista de presupuestos con jerarquía */}
      <View style={styles.budgetsContainer}>
        <Text style={styles.sectionTitle}>Presupuestos por categoría</Text>
        {renderBudgetList()}
      </View>
      
      {/* Botón para añadir */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddBudget')}
      >
        <Plus size={20} color={theme.COLORS.common.white} />
        <Text style={styles.addButtonText}>Nuevo presupuesto</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.SPACING.md,
    backgroundColor: theme.COLORS.background.default,
  },
  periodSelectorContainer: {
    marginBottom: theme.SPACING.md,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingVertical: theme.SPACING.xs,
  },
  periodButton: {
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    marginRight: theme.SPACING.sm,
    borderRadius: theme.BORDER_RADIUS.md,
    backgroundColor: theme.COLORS.grey[200],
  },
  periodButtonActive: {
    backgroundColor: theme.COLORS.primary.main,
  },
  periodButtonText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
  },
  periodButtonTextActive: {
    color: theme.COLORS.common.white,
    fontWeight: "500",
  },
  summaryCard: {
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  summaryTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
    marginBottom: theme.SPACING.sm,
    color: theme.COLORS.text.primary,
  },
  summaryContent: {
    marginBottom: theme.SPACING.sm,
  },
  summaryLabel: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.xs,
  },
  summaryValue: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "700",
    marginVertical: theme.SPACING.xs,
    color: theme.COLORS.text.primary,
  },
  summaryPercentage: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  recurrentText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.primary.main,
    marginTop: theme.SPACING.xs,
  },
  progressContainer: {
    height: 8,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.full,
    overflow: 'hidden',
    marginTop: theme.SPACING.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.full,
  },
  budgetsContainer: {
    flex: 1,
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  sectionTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.text.primary,
  },
  budgetItem: {
    marginBottom: theme.SPACING.md,
  },
  subcategoriesContainer: {
    marginLeft: theme.SPACING.md,
    borderLeftWidth: 2,
    borderLeftColor: theme.COLORS.grey[200],
    paddingLeft: theme.SPACING.sm,
    marginTop: theme.SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.SPACING.xl,
  },
  loadingText: {
    marginTop: theme.SPACING.md,
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
  },
  emptyState: {
    padding: theme.SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: theme.SPACING.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.md,
    paddingHorizontal: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  addButtonText: {
    color: theme.COLORS.common.white,
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
    marginLeft: theme.SPACING.xs,
  }
});

export default BudgetsScreen;