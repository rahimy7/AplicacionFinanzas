// src/screens/ImprovedAnalytics.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { ArrowLeft, ChevronDown, ChevronRight, ChevronUp, Filter } from 'lucide-react-native';
import { PieChart } from 'react-native-chart-kit';
import Header from '../components/Layout/Header';
import theme from '../theme/theme';
import { 
  getTransactions, 
  getCategories, 
  getSubcategoriesByParentId, 
  Category,
  Transaction 
} from '../database/asyncStorageDB';
import { NavigationProps } from '../types/navigation';
import { CURRENCY_SYMBOL } from '../constants/currency';

const screenWidth = Dimensions.get('window').width;

// Interfaces mejoradas para datos
interface CategoryWithAmount extends Category {
  amount: number;
  percentage: number;
  color: string;
  subcategories?: SubcategoryWithAmount[];
}

interface SubcategoryWithAmount extends Category {
  amount: number;
  percentage: number;
  color: string;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

// Componente principal
const ImprovedAnalytics: React.FC<NavigationProps<'Analytics'>> = ({ navigation }) => {
  // Estados generales
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<'month' | '3month' | 'year'>('month');
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('expense');
  
  // Estados para datos
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesWithAmount, setCategoriesWithAmount] = useState<CategoryWithAmount[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  // Estados para gráfico
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  
  // Estado para el drill-down
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithAmount | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);
  
  // Cargar datos al inicio y cuando cambia el período o tipo de filtro
  useEffect(() => {
    loadData();
  }, [timeFrame, filterType]);
  
  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar categorías
      const allCategories = await getCategories();
      setCategories(allCategories);
      
      // Cargar transacciones
      const allTransactions = await getTransactions();
      
      // Filtrar transacciones por período y tipo
      const filteredTransactions = filterTransactions(allTransactions);
      setTransactions(filteredTransactions);
      
      // Calcular totales
      let income = 0;
      let expenses = 0;
      
      filteredTransactions.forEach(tx => {
        if (tx.monto > 0) {
          income += tx.monto;
        } else {
          expenses += Math.abs(tx.monto);
        }
      });
      
      setTotalIncome(income);
      setTotalExpenses(expenses);
      
      // El total depende del tipo de filtro
      if (filterType === 'income') {
        setTotalAmount(income);
      } else if (filterType === 'expense') {
        setTotalAmount(expenses);
      } else {
        setTotalAmount(income + expenses);
      }
      
      // Procesar datos para categorías con montos
      await processCategoriesWithAmount(filteredTransactions, allCategories);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filtrar transacciones por período y tipo
  const filterTransactions = (transactions: Transaction[]): Transaction[] => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Filtrar por período
    let filtered = transactions.filter(tx => {
      const txDate = new Date(tx.fecha);
      
      if (timeFrame === 'month') {
        return txDate.getMonth() === currentMonth && 
               txDate.getFullYear() === currentYear;
      } else if (timeFrame === '3month') {
        // Últimos 3 meses
        const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
        return txDate >= threeMonthsAgo;
      } else if (timeFrame === 'year') {
        return txDate.getFullYear() === currentYear;
      }
      
      return true;
    });
    
    // Filtrar por tipo de transacción
    if (filterType === 'income') {
      filtered = filtered.filter(tx => tx.monto > 0);
    } else if (filterType === 'expense') {
      filtered = filtered.filter(tx => tx.monto < 0);
    }
    
    return filtered;
  };
  
  // Procesar categorías con montos
  const processCategoriesWithAmount = async (
    transactions: Transaction[],
    allCategories: Category[]
  ) => {
    try {
      // Mapas para seguimiento de montos
      const categoryAmounts: { [key: string]: number } = {};
      const subcategoryAmounts: { [key: string]: { [key: string]: number } } = {};
      
      // Inicializar en 0 todas las categorías según el tipo de filtro
      const mainCategories = allCategories.filter(cat => 
        !cat.categoriaPadreId && 
        (filterType === 'all' || 
         (filterType === 'income' && cat.tipo === 'ingreso') || 
         (filterType === 'expense' && cat.tipo === 'gasto'))
      );
      
      mainCategories.forEach(cat => {
        categoryAmounts[cat.id] = 0;
        subcategoryAmounts[cat.id] = {};
      });
      
      // Procesar cada transacción
      for (const tx of transactions) {
        const amount = Math.abs(tx.monto);
        
        // Procesar transacciones con subcategoría
        if (tx.subcategoriaId) {
          const subcategory = allCategories.find(c => c.id === tx.subcategoriaId);
          
          if (subcategory && subcategory.categoriaPadreId) {
            const parentId = subcategory.categoriaPadreId;
            
            // Sumar al total de la categoría principal
            categoryAmounts[parentId] = (categoryAmounts[parentId] || 0) + amount;
            
            // Inicializar subcategoría si es necesario
            if (!subcategoryAmounts[parentId]) {
              subcategoryAmounts[parentId] = {};
            }
            
            // Sumar al total de la subcategoría
            subcategoryAmounts[parentId][tx.subcategoriaId] = 
              (subcategoryAmounts[parentId][tx.subcategoriaId] || 0) + amount;
          }
        }
        // Procesar transacciones sin subcategoría
        else if (tx.categoriaId) {
          categoryAmounts[tx.categoriaId] = (categoryAmounts[tx.categoriaId] || 0) + amount;
        }
        // Compatibilidad con transacciones antiguas
        else if (tx.categoria) {
          const category = mainCategories.find(c => c.nombre === tx.categoria);
          if (category) {
            categoryAmounts[category.id] = (categoryAmounts[category.id] || 0) + amount;
          }
        }
      }
      
      // Construir el array de categorías con montos
      const result: CategoryWithAmount[] = [];
      
      for (const category of mainCategories) {
        const amount = categoryAmounts[category.id] || 0;
        
        // Solo incluir categorías con gastos
        if (amount > 0) {
          const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
          
          // Obtener subcategorías
          const subcatIds = Object.keys(subcategoryAmounts[category.id] || {});
          const subcategoriesWithAmount: SubcategoryWithAmount[] = [];
          
          // Procesar subcategorías
          for (const subcatId of subcatIds) {
            const subcatAmount = subcategoryAmounts[category.id][subcatId] || 0;
            
            if (subcatAmount > 0) {
              const subcategory = allCategories.find(c => c.id === subcatId);
              
              if (subcategory) {
                const subcatPercentage = amount > 0 ? (subcatAmount / amount) * 100 : 0;
                
                subcategoriesWithAmount.push({
                  ...subcategory,
                  amount: subcatAmount,
                  percentage: subcatPercentage,
                  color: subcategory.color
                });
              }
            }
          }
          
          // Ordenar subcategorías por monto (mayor primero)
          subcategoriesWithAmount.sort((a, b) => b.amount - a.amount);
          
          // Agregar categoría con sus subcategorías
          result.push({
            ...category,
            amount,
            percentage,
            color: category.color,
            subcategories: subcategoriesWithAmount.length > 0 ? subcategoriesWithAmount : undefined
          });
        }
      }
      
      // Ordenar por monto (mayor primero)
      result.sort((a, b) => b.amount - a.amount);
      
      setCategoriesWithAmount(result);
      
      // Preparar datos para gráfico
      updateChartData(result);
      
    } catch (error) {
      console.error('Error procesando categorías:', error);
      throw error;
    }
  };
  
  // Actualizar datos para el gráfico
  const updateChartData = (categories: CategoryWithAmount[]) => {
    if (showSubcategories && selectedCategory?.subcategories?.length) {
      // Mostrar subcategorías de la categoría seleccionada
      const subcategoryChart = selectedCategory.subcategories.map(subcat => ({
        name: subcat.nombre,
        value: subcat.amount,
        color: subcat.color,
        legendFontColor: theme.COLORS.text.primary,
        legendFontSize: 12
      }));
      
      setChartData(subcategoryChart);
    } else {
      // Mostrar categorías principales (limitado a 7 para legibilidad)
      const maxCategories = 7;
      let mainCategoriesChart = categories.slice(0, maxCategories).map(cat => ({
        name: cat.nombre,
        value: cat.amount,
        color: cat.color,
        legendFontColor: theme.COLORS.text.primary,
        legendFontSize: 12
      }));
      
      // Si hay más de 7 categorías, agregar una categoría "Otros"
      if (categories.length > maxCategories) {
        const otherCategories = categories.slice(maxCategories);
        const otherAmount = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);
        
        mainCategoriesChart.push({
          name: 'Otros',
          value: otherAmount,
          color: '#CCCCCC',
          legendFontColor: theme.COLORS.text.primary,
          legendFontSize: 12
        });
      }
      
      setChartData(mainCategoriesChart);
    }
  };
  
  // Manejar selección de categoría para drill-down
  const handleCategorySelect = (category: CategoryWithAmount) => {
    if (category.subcategories?.length) {
      setSelectedCategory(category);
      setShowSubcategories(true);
      
      // Actualizar gráfico con subcategorías
      const subcategoryChart = category.subcategories.map(subcat => ({
        name: subcat.nombre,
        value: subcat.amount,
        color: subcat.color,
        legendFontColor: theme.COLORS.text.primary,
        legendFontSize: 12
      }));
      
      setChartData(subcategoryChart);
    } else {
      Alert.alert('Sin subcategorías', 'Esta categoría no tiene subcategorías');
    }
  };
  
  // Volver a categorías principales
  const handleBackToMain = () => {
    setSelectedCategory(null);
    setShowSubcategories(false);
    
    // Actualizar gráfico con categorías principales
    updateChartData(categoriesWithAmount);
  };
  
  // Renderizar selector de período
  const renderPeriodSelector = () => (
    <View style={styles.filterRow}>
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            timeFrame === 'month' && styles.periodButtonActive
          ]}
          onPress={() => setTimeFrame('month')}
        >
          <Text
            style={[
              styles.periodButtonText,
              timeFrame === 'month' && styles.periodButtonTextActive
            ]}
          >
            Este mes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.periodButton,
            timeFrame === '3month' && styles.periodButtonActive
          ]}
          onPress={() => setTimeFrame('3month')}
        >
          <Text
            style={[
              styles.periodButtonText,
              timeFrame === '3month' && styles.periodButtonTextActive
            ]}
          >
            3 meses
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.periodButton,
            timeFrame === 'year' && styles.periodButtonActive
          ]}
          onPress={() => setTimeFrame('year')}
        >
          <Text
            style={[
              styles.periodButtonText,
              timeFrame === 'year' && styles.periodButtonTextActive
            ]}
          >
            Este año
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => {
          // Alternar entre tipos de filtro
          setFilterType(current => {
            if (current === 'expense') return 'income';
            if (current === 'income') return 'all';
            return 'expense';
          });
        }}
      >
        <Filter size={20} color={theme.COLORS.common.white} />
        <Text style={styles.filterButtonText}>
          {filterType === 'expense' ? 'Gastos' : 
           filterType === 'income' ? 'Ingresos' : 'Todos'}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  // Renderizar selector de vista
  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'chart' && styles.viewModeButtonActive
        ]}
        onPress={() => setViewMode('chart')}
      >
        <Text
          style={[
            styles.viewModeButtonText,
            viewMode === 'chart' && styles.viewModeButtonTextActive
          ]}
        >
          Gráfico
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'list' && styles.viewModeButtonActive
        ]}
        onPress={() => setViewMode('list')}
      >
        <Text
          style={[
            styles.viewModeButtonText,
            viewMode === 'list' && styles.viewModeButtonTextActive
          ]}
        >
          Lista
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  // Renderizar resumen financiero
  const renderFinancialSummary = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Ingresos</Text>
        <Text style={[styles.summaryValue, styles.incomeValue]}>
          {CURRENCY_SYMBOL}{totalIncome.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.summaryDivider} />
      
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Gastos</Text>
        <Text style={[styles.summaryValue, styles.expenseValue]}>
          {CURRENCY_SYMBOL}{totalExpenses.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.summaryDivider} />
      
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Balance</Text>
        <Text style={[
          styles.summaryValue,
          (totalIncome - totalExpenses) >= 0 ? styles.balancePositiveValue : styles.balanceNegativeValue
        ]}>
          {CURRENCY_SYMBOL}{(totalIncome - totalExpenses).toFixed(2)}
        </Text>
      </View>
    </View>
  );
  
  // Renderizar gráfico
  const renderChart = () => (
    <View style={styles.chartCard}>
      {/* Navegación para drill-down */}
      {showSubcategories && selectedCategory && (
        <TouchableOpacity
          style={styles.breadcrumbContainer}
          onPress={handleBackToMain}
        >
          <ArrowLeft size={16} color={theme.COLORS.primary.main} />
          <Text style={styles.breadcrumbText}>
            Volver a categorías principales
          </Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.chartTitle}>
        {showSubcategories && selectedCategory
          ? `Subcategorías de ${selectedCategory.nombre}`
          : `Distribución de ${
              filterType === 'expense' ? 'gastos' : 
              filterType === 'income' ? 'ingresos' : 
              'transacciones'
            }`}
      </Text>
      
      {chartData.length > 0 ? (
        <View style={styles.chartContainer}>
          <PieChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: theme.COLORS.common.white,
              backgroundGradientFrom: theme.COLORS.common.white,
              backgroundGradientTo: theme.COLORS.common.white,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              strokeWidth: 2,
              barPercentage: 0.5,
              useShadowColorFromDataset: false
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No hay datos disponibles</Text>
        </View>
      )}
    </View>
  );
  
  // Renderizar lista de categorías
  const renderCategoryList = () => (
    <View style={styles.listCard}>
      <Text style={styles.listTitle}>
        {showSubcategories && selectedCategory
          ? `Subcategorías de ${selectedCategory.nombre}`
          : `${
              filterType === 'expense' ? 'Gastos' : 
              filterType === 'income' ? 'Ingresos' : 
              'Transacciones'
            } por categoría`}
      </Text>
      
      {/* Navegación para drill-down */}
      {showSubcategories && selectedCategory && (
        <TouchableOpacity
          style={styles.breadcrumbContainer}
          onPress={handleBackToMain}
        >
          <ArrowLeft size={16} color={theme.COLORS.primary.main} />
          <Text style={styles.breadcrumbText}>
            Volver a categorías principales
          </Text>
        </TouchableOpacity>
      )}
      
      {showSubcategories && selectedCategory?.subcategories ? (
        // Mostrar subcategorías
        <View style={styles.categoriesList}>
          {selectedCategory.subcategories.map((subcategory, index) => (
            <View key={subcategory.id} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryDot, { backgroundColor: subcategory.color }]} />
                <Text style={styles.categoryName}>{subcategory.nombre}</Text>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryAmount}>
                  {CURRENCY_SYMBOL}{subcategory.amount.toFixed(2)}
                </Text>
                <Text style={styles.categoryPercentage}>
                  {subcategory.percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        // Mostrar categorías principales
        <View style={styles.categoriesList}>
          {categoriesWithAmount.length > 0 ? (
            categoriesWithAmount.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => {
                  if (category.subcategories?.length) {
                    handleCategorySelect(category);
                  }
                }}
                disabled={!category.subcategories?.length}
              >
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  <Text style={styles.categoryName}>{category.nombre}</Text>
                  {category.subcategories?.length ? (
                    <ChevronRight size={16} color={theme.COLORS.grey[500]} />
                  ) : null}
                </View>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryAmount}>
                    {CURRENCY_SYMBOL}{category.amount.toFixed(2)}
                  </Text>
                  <Text style={styles.categoryPercentage}>
                    {category.percentage.toFixed(1)}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No hay datos disponibles</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header 
        title="Análisis Financiero" 
        onProfilePress={() => console.log('Profile pressed')}
      />
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
            <Text style={styles.loadingText}>Cargando datos...</Text>
          </View>
        ) : (
          <>
            {/* Selectores de periodo y tipo */}
            {renderPeriodSelector()}
            
            {/* Resumen financiero */}
            {renderFinancialSummary()}
            
            {/* Selector de modo de visualización */}
            {renderViewModeSelector()}
            
            {/* Contenido principal según el modo seleccionado */}
            {viewMode === 'chart' ? renderChart() : renderCategoryList()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.COLORS.background.default,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.SPACING.md,
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  periodSelector: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.xs,
    marginRight: theme.SPACING.md,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.SPACING.sm,
    alignItems: 'center',
    borderRadius: theme.BORDER_RADIUS.sm,
  },
  periodButtonActive: {
    backgroundColor: theme.COLORS.common.white,
    ...theme.SHADOWS.sm,
  },
  periodButtonText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  periodButtonTextActive: {
    color: theme.COLORS.primary.main,
    fontWeight: "500",
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
  },
  filterButtonText: {
    color: theme.COLORS.common.white,
    marginLeft: theme.SPACING.xs,
    fontSize: theme.FONT_SIZE.sm,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.xs,
  },
  summaryValue: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: theme.COLORS.grey[200],
    marginHorizontal: theme.SPACING.sm,
  },
  incomeValue: {
    color: theme.COLORS.success.main,
  },
  expenseValue: {
    color: theme.COLORS.error.main,
  },
  balancePositiveValue: {
    color: theme.COLORS.success.main,
  },
  balanceNegativeValue: {
    color: theme.COLORS.error.main,
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.xs,
    marginBottom: theme.SPACING.md,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: theme.SPACING.sm,
    alignItems: 'center',
    borderRadius: theme.BORDER_RADIUS.sm,
  },
  viewModeButtonActive: {
    backgroundColor: theme.COLORS.common.white,
    ...theme.SHADOWS.sm,
  },
  viewModeButtonText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
  },
  viewModeButtonTextActive: {
    color: theme.COLORS.primary.main,
    fontWeight: "500",
  },
  chartCard: {
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.sm,
  },
  breadcrumbText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.primary.main,
    marginLeft: theme.SPACING.xs,
  },
  chartTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
    marginBottom: theme.SPACING.md,
  },
  chartContainer: {
    alignItems: 'center',
  },
  noDataContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
  },
  listCard: {
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  listTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
    marginBottom: theme.SPACING.md,
  },
  categoriesList: {
    marginTop: theme.SPACING.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
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
    color: theme.COLORS.text.primary,
    flex: 1,
    marginRight: theme.SPACING.xs,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "500",
    color: theme.COLORS.text.primary,
  },
  categoryPercentage: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
});

export default ImprovedAnalytics;