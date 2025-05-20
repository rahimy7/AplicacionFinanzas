export default ImprovedBudgetsScreen;// src/screens/ImprovedBudgetsScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Calendar,
  AlertCircle,
  Filter,
  Percent,
  Eye,
  EyeOff,
  PieChart
} from 'lucide-react-native';
import theme from '../theme/theme';
import { NavigationProps } from '../types/navigation';
import { CURRENCY_SYMBOL } from '../constants/currency';
import Header from '../components/Layout/Header';
import {
  getBudgets,
  Budget,
  getCategories,
  getSubcategoriesByParentId,
  getTransactions,
  Category,
  Transaction,
  handleRecurrentBudgets
} from '../database/asyncStorageDB';

// Interfaces adicionales
interface BudgetWithSubcategories extends Budget {
  subcategories?: BudgetWithSubcategories[];
  percentage?: number;
  category?: Category;
  subcategory?: Category;
  isExpanded?: boolean;
}

interface BudgetGroupData {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalBudget: number;
  spentAmount: number;
  percentage: number;
  budgets: BudgetWithSubcategories[];
  isExpanded?: boolean;
}

// Componente para la tarjeta de presupuesto
const BudgetCard = ({ budget, onPress, onToggleExpand }) => {
  // Asegurar que el porcentaje esté entre 0 y 100
  const percentage = Math.min(Math.max((budget.actual / budget.limite) * 100, 0), 100);
  
  // Determinar color según el porcentaje
  const getProgressColor = () => {
    if (percentage > 90) return theme.COLORS.error.main;
    if (percentage > 75) return theme.COLORS.warning.main;
    return theme.COLORS.success.main;
  };

  return (
    <View style={styles.budgetCard}>
      <TouchableOpacity 
        style={styles.budgetCardHeader}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.budgetTitleContainer}>
          <View style={[styles.categoryDot, { backgroundColor: budget.category?.color || theme.COLORS.grey[400] }]} />
          <Text style={styles.budgetCategoryName}>{budget.categoria}</Text>
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
            percentage > 90 ? styles.dangerText : 
            percentage > 75 ? styles.warningText : 
            styles.successText
          ]}>
            {percentage.toFixed(0)}%
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar,
            { width: `${percentage}%`, backgroundColor: getProgressColor() }
          ]} 
        />
      </View>
      
      {budget.subcategories && budget.subcategories.length > 0 && (
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={onToggleExpand}
        >
          <Text style={styles.expandButtonText}>
            {budget.isExpanded ? 'Ocultar subcategorías' : 'Ver subcategorías'}
          </Text>
          {budget.isExpanded ? (
            <ChevronUp size={16} color={theme.COLORS.primary.main} />
          ) : (
            <ChevronDown size={16} color={theme.COLORS.primary.main} />
          )}
        </TouchableOpacity>
      )}
      
      {budget.isExpanded && budget.subcategories && budget.subcategories.length > 0 && (
        <View style={styles.subcategoriesList}>
          {budget.subcategories.map((subBudget) => (
            <View key={subBudget.id} style={styles.subcategoryItem}>
              <View style={styles.subcategoryHeader}>
                <View style={[styles.subcategoryDot, { backgroundColor: subBudget.subcategory?.color || theme.COLORS.grey[400] }]} />
                <Text style={styles.subcategoryName}>{subBudget.subcategoria || ''}</Text>
                <Text style={styles.subcategoryAmount}>
                  {CURRENCY_SYMBOL}{subBudget.actual.toFixed(0)} / {CURRENCY_SYMBOL}{subBudget.limite.toFixed(0)}
                </Text>
              </View>
              
              <View style={styles.subcategoryProgressContainer}>
                <View 
                  style={[
                    styles.subcategoryProgress,
                    { 
                      width: `${Math.min((subBudget.actual / subBudget.limite) * 100, 100)}%`, 
                      backgroundColor: (subBudget.actual / subBudget.limite) > 0.9 
                        ? theme.COLORS.error.main 
                        : (subBudget.actual / subBudget.limite) > 0.75 
                          ? theme.COLORS.warning.main 
                          : theme.COLORS.success.main 
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Componente principal de la pantalla mejorada de presupuestos
const ImprovedBudgetsScreen: React.FC<NavigationProps<'Budgets'>> = ({ navigation }) => {
  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [budgets, setBudgets] = useState<BudgetWithSubcategories[]>([]);
  const [activePeriod, setActivePeriod] = useState<'quincenal-1' | 'quincenal-2' | 'mensual' | 'trimestral' | 'anual'>('mensual');
  const [totalStats, setTotalStats] = useState({
    presupuestado: 0,
    gastado: 0,
    porcentaje: 0,
    restante: 0
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groupedBudgets, setGroupedBudgets] = useState<BudgetGroupData[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'category'>('category');
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos al iniciar o cambiar periodo
  useEffect(() => {
    loadData();
  }, [activePeriod]);

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      setRefreshing(true);
      
      // Verificar y crear presupuestos recurrentes
      await handleRecurrentBudgets();
      
      // Cargar categorías
      const allCategories = await getCategories();
      setCategories(allCategories);
      
      // Cargar transacciones
      const allTransactions = await getTransactions();
      setTransactions(allTransactions);
      
      // Cargar presupuestos
      const allBudgets = await getBudgets();
      
      // Filtrar por periodo
      const filteredBudgets = allBudgets.filter(b => b.periodo === activePeriod);
      
      // Enriquecer con datos adicionales
      const enrichedBudgets = await Promise.all(
        filteredBudgets.map(async (budget) => {
          // Buscar categoría
          const category = allCategories.find(c => c.id === budget.categoriaId);
          
          // Buscar subcategoría si existe
          const subcategory = budget.subcategoriaId 
            ? allCategories.find(c => c.id === budget.subcategoriaId) 
            : null;
          
          // Calcular porcentaje
          const percentage = budget.limite > 0 ? (budget.actual / budget.limite) * 100 : 0;
          
          // Buscar subcategorías si es una categoría principal sin subcategoría específica
          let subcategories: BudgetWithSubcategories[] = [];
          
          if (category && !subcategory) {
            const categorySubcategories = await getSubcategoriesByParentId(category.id);
            
            // Buscar presupuestos para cada subcategoría
            subcategories = filteredBudgets
              .filter(b => b.categoriaId === category.id && b.subcategoriaId)
              .map(subBudget => {
                const subcat = categorySubcategories.find(s => s.id === subBudget.subcategoriaId);
                return {
                  ...subBudget,
                  subcategory: subcat,
                  percentage: subBudget.limite > 0 ? (subBudget.actual / subBudget.limite) * 100 : 0,
                  isExpanded: false
                };
              });
          }
          
          return {
            ...budget,
            category,
            subcategory,
            percentage,
            subcategories,
            isExpanded: false
          };
        })
      );
      
      setBudgets(enrichedBudgets);
      
      // Agrupar presupuestos por categoría
      const groupedByCategory: { [key: string]: BudgetGroupData } = {};
      
      enrichedBudgets.forEach(budget => {
        const categoryId = budget.categoriaId || 'uncategorized';
        
        if (!groupedByCategory[categoryId]) {
          groupedByCategory[categoryId] = {
            categoryId,
            categoryName: budget.category?.nombre || 'Sin categoría',
            categoryColor: budget.category?.color || '#CCCCCC',
            totalBudget: 0,
            spentAmount: 0,
            percentage: 0,
            budgets: [],
            isExpanded: false
          };
        }
        
        groupedByCategory[categoryId].totalBudget += budget.limite;
        groupedByCategory[categoryId].spentAmount += budget.actual;
        groupedByCategory[categoryId].budgets.push(budget);
      });
      
      // Calcular porcentajes para cada grupo y ordenar por monto
      const groupedArray = Object.values(groupedByCategory).map(group => ({
        ...group,
        percentage: group.totalBudget > 0 ? (group.spentAmount / group.totalBudget) * 100 : 0
      }));
      
      groupedArray.sort((a, b) => b.totalBudget - a.totalBudget);
      
      setGroupedBudgets(groupedArray);
      
      // Calcular estadísticas totales
      const totalPresupuestado = enrichedBudgets.reduce((sum, b) => sum + b.limite, 0);
      const totalGastado = enrichedBudgets.reduce((sum, b) => sum + b.actual, 0);
      const totalPorcentaje = totalPresupuestado > 0 ? (totalGastado / totalPresupuestado) * 100 : 0;
      
      setTotalStats({
        presupuestado: totalPresupuestado,
        gastado: totalGastado,
        porcentaje: totalPorcentaje,
        restante: totalPresupuestado - totalGastado
      });
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de presupuestos');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Alternar expansión de un presupuesto
  const toggleBudgetExpansion = (budgetId: string) => {
    setBudgets(prev => 
      prev.map(budget => 
        budget.id === budgetId
          ? { ...budget, isExpanded: !budget.isExpanded }
          : budget
      )
    );
  };

  // Alternar expansión de grupo de categoría
  const toggleCategoryExpansion = (categoryId: string) => {
    setGroupedBudgets(prev => 
      prev.map(group => 
        group.categoryId === categoryId
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  // Navegar a la pantalla de añadir/editar presupuesto
  const handleAddEditBudget = (budget = null) => {
    navigation.navigate('AddBudget', { budget });
  };

  // Renderizar selector de período
  const renderPeriodSelector = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.periodSelectorContent}
      style={styles.periodSelector}
    >
      <TouchableOpacity
        style={[styles.periodButton, activePeriod === 'quincenal-1' && styles.activePeriodButton]}
        onPress={() => setActivePeriod('quincenal-1')}
      >
        <Text style={[styles.periodButtonText, activePeriod === 'quincenal-1' && styles.activePeriodText]}>1° Quincena</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.periodButton, activePeriod === 'quincenal-2' && styles.activePeriodButton]}
        onPress={() => setActivePeriod('quincenal-2')}
      >
        <Text style={[styles.periodButtonText, activePeriod === 'quincenal-2' && styles.activePeriodText]}>2° Quincena</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.periodButton, activePeriod === 'mensual' && styles.activePeriodButton]}
        onPress={() => setActivePeriod('mensual')}
      >
        <Text style={[styles.periodButtonText, activePeriod === 'mensual' && styles.activePeriodText]}>Mensual</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.periodButton, activePeriod === 'trimestral' && styles.activePeriodButton]}
        onPress={() => setActivePeriod('trimestral')}
      >
        <Text style={[styles.periodButtonText, activePeriod === 'trimestral' && styles.activePeriodText]}>Trimestral</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.periodButton, activePeriod === 'anual' && styles.activePeriodButton]}
        onPress={() => setActivePeriod('anual')}
      >
        <Text style={[styles.periodButtonText, activePeriod === 'anual' && styles.activePeriodText]}>Anual</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Obtener nombre del período actual
  const getPeriodLabel = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    switch (activePeriod) {
      case 'quincenal-1':
        return `1-15 ${months[currentMonth]} ${currentYear}`;
      case 'quincenal-2': {
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        return `16-${lastDay} ${months[currentMonth]} ${currentYear}`;
      }
      case 'mensual':
        return `${months[currentMonth]} ${currentYear}`;
      case 'trimestral': {
        const quarter = Math.floor(currentMonth / 3);
        const startMonth = quarter * 3;
        const endMonth = startMonth + 2;
        return `${months[startMonth]}-${months[endMonth]} ${currentYear}`;
      }
      case 'anual':
        return `${currentYear}`;
      default:
        return 'Periodo actual';
    }
  };

  // Renderizar tarjeta de resumen
  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Resumen de presupuestos</Text>
        <View style={styles.calendarContainer}>
          <Calendar size={16} color={theme.COLORS.primary.main} />
          <Text style={styles.calendarText}>{getPeriodLabel()}</Text>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{CURRENCY_SYMBOL}{totalStats.presupuestado.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Presupuestado</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{CURRENCY_SYMBOL}{totalStats.gastado.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Gastado</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.percentageContainer}>
            <Text style={[
              styles.percentageValue,
              totalStats.porcentaje > 90 ? styles.dangerText : 
              totalStats.porcentaje > 75 ? styles.warningText : 
              styles.successText
            ]}>
              {totalStats.porcentaje.toFixed(0)}%
            </Text>
            <Percent 
              size={12} 
              color={
                totalStats.porcentaje > 90 ? theme.COLORS.error.main : 
                totalStats.porcentaje > 75 ? theme.COLORS.warning.main : 
                theme.COLORS.success.main
              } 
            />
          </View>
          <Text style={styles.statLabel}>Del presupuesto</Text>
        </View>
      </View>
      
      <View style={styles.totalProgressContainer}>
        <View style={[
          styles.totalProgressBar,
          { 
            width: `${Math.min(totalStats.porcentaje, 100)}%`, 
            backgroundColor: 
              totalStats.porcentaje > 90 ? theme.COLORS.error.main : 
              totalStats.porcentaje > 75 ? theme.COLORS.warning.main : 
              theme.COLORS.success.main 
          }
        ]} />
      </View>
      
      {(activePeriod === 'mensual' || activePeriod === 'trimestral' || activePeriod === 'anual') && (
        <View style={styles.infoContainer}>
          <AlertCircle size={16} color={theme.COLORS.info.main} />
          <Text style={styles.infoText}>
            Los presupuestos {activePeriod}es se prorratean automáticamente entre quincenas.
          </Text>
        </View>
      )}
    </View>
  );

  // Renderizar selector de modo de vista
  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'category' && styles.activeViewModeButton]}
        onPress={() => setViewMode('category')}
      >
        <PieChart size={16} color={viewMode === 'category' ? theme.COLORS.primary.main : theme.COLORS.text.secondary} />
        <Text style={[styles.viewModeText, viewMode === 'category' && styles.activeViewModeText]}>
          Por categoría
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewModeButton]}
        onPress={() => setViewMode('list')}
      >
        <Filter size={16} color={viewMode === 'list' ? theme.COLORS.primary.main : theme.COLORS.text.secondary} />
        <Text style={[styles.viewModeText, viewMode === 'list' && styles.activeViewModeText]}>
          Lista completa
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar lista agrupada por categorías
  const renderGroupedBudgets = () => (
    <FlatList
      data={groupedBudgets}
      keyExtractor={(item) => item.categoryId}
      renderItem={({ item }) => (
        <View style={styles.categoryGroup}>
          <TouchableOpacity 
            style={styles.categoryHeader}
            onPress={() => toggleCategoryExpansion(item.categoryId)}
          >
            <View style={styles.categoryTitleContainer}>
              <View style={[styles.categoryDot, { backgroundColor: item.categoryColor }]} />
              <Text style={styles.categoryTitle}>{item.categoryName}</Text>
            </View>
            
            <View style={styles.categoryStatsContainer}>
              <Text style={styles.categoryStats}>
                {CURRENCY_SYMBOL}{item.spentAmount.toFixed(0)} / {CURRENCY_SYMBOL}{item.totalBudget.toFixed(0)}
              </Text>
              <Text style={[
                styles.categoryPercentage,
                item.percentage > 90 ? styles.dangerText : 
                item.percentage > 75 ? styles.warningText : 
                styles.successText
              ]}>
                {item.percentage.toFixed(0)}%
              </Text>
              {item.isExpanded ? (
                <ChevronUp size={16} color={theme.COLORS.text.secondary} />
              ) : (
                <ChevronDown size={16} color={theme.COLORS.text.secondary} />
              )}
            </View>
          </TouchableOpacity>
          
          <View style={styles.categoryProgressContainer}>
            <View 
              style={[
                styles.categoryProgressBar,
                { 
                  width: `${Math.min(item.percentage, 100)}%`,
                  backgroundColor: 
                    item.percentage > 90 ? theme.COLORS.error.main : 
                    item.percentage > 75 ? theme.COLORS.warning.main : 
                    theme.COLORS.success.main 
                }
              ]} 
            />
          </View>
          
          {item.isExpanded && (
            <View style={styles.categoryBudgetsList}>
              {item.budgets.map(budget => (
                <BudgetCard 
                  key={budget.id}
                  budget={budget}
                  onPress={() => handleAddEditBudget(budget)}
                  onToggleExpand={() => toggleBudgetExpansion(budget.id)}
                />
              ))}
            </View>
          )}
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay presupuestos para este período</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => handleAddEditBudget()}
          >
            <Text style={styles.emptyButtonText}>Crear nuevo presupuesto</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );

  // Renderizar lista plana de presupuestos
  const renderAllBudgets = () => (
    <FlatList
      data={budgets}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <BudgetCard 
          budget={item}
          onPress={() => handleAddEditBudget(item)}
          onToggleExpand={() => toggleBudgetExpansion(item.id)}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay presupuestos para este período</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => handleAddEditBudget()}
          >
            <Text style={styles.emptyButtonText}>Crear nuevo presupuesto</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );

  // Renderizar contenido principal
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
          <Text style={styles.loadingText}>Cargando presupuestos...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.contentContainer}>
        {/* Selector de período */}
        {renderPeriodSelector()}
        
        {/* Tarjeta de resumen */}
        {renderSummaryCard()}
        
        {/* Selector de modo de vista */}
        {renderViewModeSelector()}
        
        {/* Lista de presupuestos según el modo */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {viewMode === 'category' 
                ? 'Presupuestos por categoría' 
                : 'Todos los presupuestos'}
            </Text>
          </View>
          
          {viewMode === 'category' ? renderGroupedBudgets() : renderAllBudgets()}
        </View>
        
        {/* Botón flotante para añadir */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => handleAddEditBudget()}
        >
          <Plus size={24} color={theme.COLORS.common.white} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Presupuestos" 
        onProfilePress={() => {}}
      />
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background.default,
  },
  contentContainer: {
    flex: 1,
    padding: theme.SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.SPACING.xl,
  },
  loadingText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
    marginTop: theme.SPACING.md,
  },
  
  // Selector de período
  periodSelector: {
    marginBottom: theme.SPACING.md,
  },
  periodSelectorContent: {
    paddingVertical: theme.SPACING.xs,
  },
  periodButton: {
    backgroundColor: theme.COLORS.common.white,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    marginRight: theme.SPACING.sm,
    ...theme.SHADOWS.sm,
  },
  activePeriodButton: {
    backgroundColor: theme.COLORS.primary.main,
  },
  periodButtonText: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    color: theme.COLORS.text.primary,
  },
  activePeriodText: {
    color: theme.COLORS.common.white,
  },
  
  // Tarjeta de resumen
  summaryCard: {
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  summaryTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
  },
  calendarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.primary.main,
    marginLeft: theme.SPACING.xs,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.COLORS.grey[200],
  },
  statValue: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "700",
    color: theme.COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.text.secondary,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageValue: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "700",
    marginRight: 2,
  },
  totalProgressContainer: {
    height: 8,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: theme.SPACING.sm,
  },
  totalProgressBar: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.full,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.info.light,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.sm,
    marginTop: theme.SPACING.xs,
  },
  infoText: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.info.dark,
    marginLeft: theme.SPACING.xs,
    flex: 1,
  },
  
  // Selector de modo de vista
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.xs,
    marginBottom: theme.SPACING.md,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.BORDER_RADIUS.sm,
    paddingVertical: theme.SPACING.sm,
  },
  activeViewModeButton: {
    backgroundColor: theme.COLORS.common.white,
    ...theme.SHADOWS.sm,
  },
  viewModeText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
    marginLeft: theme.SPACING.xs,
  },
  activeViewModeText: {
    color: theme.COLORS.primary.main,
    fontWeight: "500",
  },
  
  // Lista de presupuestos
  listContainer: {
    flex: 1,
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    ...theme.SHADOWS.md,
    padding: theme.SPACING.md,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
    paddingBottom: theme.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  listTitle: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
  },
  emptyContainer: {
    flex: 1,
    padding: theme.SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: theme.SPACING.md,
  },
  emptyButton: {
    backgroundColor: theme.COLORS.primary.main,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
  },
  emptyButtonText: {
    color: theme.COLORS.common.white,
    fontWeight: "500",
  },
  
  // Grupos de categoría
  categoryGroup: {
    backgroundColor: theme.COLORS.grey[50],
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.sm,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.SPACING.xs,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.SPACING.sm,
  },
  categoryTitle: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
  },
  categoryStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryStats: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
    marginRight: theme.SPACING.sm,
  },
  categoryPercentage: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    marginRight: theme.SPACING.sm,
  },
  categoryProgressContainer: {
    height: 6,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.full,
    overflow: 'hidden',
    marginTop: theme.SPACING.xs,
    marginBottom: theme.SPACING.sm,
  },
  categoryProgressBar: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.full,
  },
  categoryBudgetsList: {
    marginTop: theme.SPACING.xs,
  },
  
  // Tarjeta de presupuesto
  budgetCard: {
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.sm,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.SPACING.sm,
  },
  budgetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  budgetCategoryName: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "500",
    color: theme.COLORS.text.primary,
    marginRight: theme.SPACING.xs,
  },
  recurrentBadge: {
    backgroundColor: theme.COLORS.primary.light,
    paddingHorizontal: theme.SPACING.xs,
    paddingVertical: 2,
    borderRadius: theme.BORDER_RADIUS.full,
  },
  recurrentBadgeText: {
    color: theme.COLORS.primary.main,
    fontSize: 10,
    fontWeight: "500",
  },
  budgetAmountContainer: {
    alignItems: 'flex-end',
  },
  budgetAmount: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
    marginBottom: 2,
  },
  budgetPercentage: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "600",
  },
  successText: {
    color: theme.COLORS.success.main,
  },
  warningText: {
    color: theme.COLORS.warning.main,
  },
  dangerText: {
    color: theme.COLORS.error.main,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.full,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.SPACING.sm,
    paddingVertical: theme.SPACING.xs,
  },
  expandButtonText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.primary.main,
    marginRight: theme.SPACING.xs,
  },
  subcategoriesList: {
    marginTop: theme.SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.grey[200],
    paddingTop: theme.SPACING.sm,
  },
  subcategoryItem: {
    marginBottom: theme.SPACING.sm,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs / 2,
  },
  subcategoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.SPACING.xs,
  },
  subcategoryName: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.primary,
    flex: 1,
  },
  subcategoryAmount: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.text.secondary,
  },
  subcategoryProgressContainer: {
    height: 6,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  subcategoryProgress: {
    height: '100%',
    borderRadius: theme.BORDER_RADIUS.full,
  },
  
  // Botón flotante de añadir
  addButton: {
    position: 'absolute',
    bottom: theme.SPACING.xl,
    right: theme.SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.SHADOWS.lg,
  },
});