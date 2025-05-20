// src/screens/Analytics.tsx with enhanced subcategory support

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  Alert
} from 'react-native';
import { ArrowLeft, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react-native';
import { PieChart } from 'react-native-chart-kit';
import Header from '../components/Layout/Header';
import CategoryHierarchyView from '../components/CategoryHierarchyView';
import theme from '../theme/theme';
import { 
  getTransactions, 
  getCategories, 
  Category,
  getMainCategories,
  getSubcategoriesByParentId,
  Transaction 
} from '../database/asyncStorageDB';
import { NavigationProps } from '../types/navigation';
import { CURRENCY_SYMBOL } from '../constants/currency';

const screenWidth = Dimensions.get('window').width;

// Enhanced interfaces for data
interface CategoryWithAmount extends Category {
  amount: number;
  percentage: number;
  children?: CategoryWithAmount[]; // Add subcategories
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

// Main component
const Analytics: React.FC<NavigationProps<'Analytics'>> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [timeFrame, setTimeFrame] = useState<'month' | 'year'>('month');
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [categoriesWithAmounts, setCategoriesWithAmounts] = useState<CategoryWithAmount[]>([]);
  const [viewMode, setViewMode] = useState<'chart' | 'hierarchy'>('chart');
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithAmount | null>(null);
  const [drillDownMode, setDrillDownMode] = useState<'main' | 'subcategory'>('main');
  
  // Load data on start and when timeFrame changes
  useEffect(() => {
    loadData();
  }, [timeFrame]);
  
  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Get transactions
      const transactions = await getTransactions();
      const filteredTransactions = filterTransactionsByTimeFrame(transactions);
      
      // Calculate total income and expenses
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
      
      // Get categories with statistics
      await loadCategoriesWithAmounts(filteredTransactions);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const filterTransactionsByTimeFrame = (transactions: Transaction[]) => {
    const now = new Date();
    return transactions.filter(tx => {
      const txDate = new Date(tx.fecha);
      if (timeFrame === 'month') {
        return txDate.getMonth() === now.getMonth() &&
               txDate.getFullYear() === now.getFullYear();
      } else {
        return txDate.getFullYear() === now.getFullYear();
      }
    });
  };
  
  // Enhanced function to properly handle category hierarchy
  const loadCategoriesWithAmounts = async (transactions: Transaction[]) => {
    try {
      // Get only main categories (not subcategories)
      const mainCategories = await getMainCategories();
      
      // Filter only expense transactions
      const expenseTransactions = transactions.filter(tx => tx.monto < 0);
      
      // Create maps for tracking amounts
      const categoryAmounts: { [key: string]: number } = {};
      const subcategoryAmounts: { [categoryId: string]: { [subcategoryId: string]: number } } = {};
      
      // Initialize all main categories with 0
      mainCategories.forEach(cat => {
        categoryAmounts[cat.id] = 0;
        subcategoryAmounts[cat.id] = {};
      });
      
      // Process each transaction to aggregate amounts
      for (const tx of expenseTransactions) {
        const amount = Math.abs(tx.monto);
        
        // Process transactions with subcategory
        if (tx.subcategoriaId) {
          // Find the subcategory
          const categories = await getCategories();
          const subcategory = categories.find(c => c.id === tx.subcategoriaId);
          
          if (subcategory && subcategory.categoriaPadreId) {
            // Add to both subcategory and parent category
            const parentId = subcategory.categoriaPadreId;
            
            // Add to parent category total
            categoryAmounts[parentId] = (categoryAmounts[parentId] || 0) + amount;
            
            // Initialize subcategory map if needed
            if (!subcategoryAmounts[parentId]) {
              subcategoryAmounts[parentId] = {};
            }
            
            // Add to subcategory total
            subcategoryAmounts[parentId][tx.subcategoriaId] = 
              (subcategoryAmounts[parentId][tx.subcategoriaId] || 0) + amount;
          }
        }
        // Process transactions with only main category
        else if (tx.categoriaId) {
          categoryAmounts[tx.categoriaId] = (categoryAmounts[tx.categoriaId] || 0) + amount;
        }
        // Legacy support for transactions with just category name
        else if (tx.categoria) {
          // Find category by name
          const category = mainCategories.find(c => c.nombre === tx.categoria);
          if (category) {
            categoryAmounts[category.id] = (categoryAmounts[category.id] || 0) + amount;
          }
        }
      }
      
      // Build the categoriesWithAmount array
      const categoriesWithData: CategoryWithAmount[] = [];
      
      // Process each main category
      for (const category of mainCategories) {
        if (category.tipo === 'gasto') {
          const amount = categoryAmounts[category.id] || 0;
          
          // Only include categories with expenses
          if (amount > 0) {
            const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
            
            // Get subcategories
            const subcategories = await getSubcategoriesByParentId(category.id);
            const subcategoriesWithAmount: CategoryWithAmount[] = [];
            
            // Add subcategories with amounts
            for (const subcategory of subcategories) {
              const subcatAmount = subcategoryAmounts[category.id]?.[subcategory.id] || 0;
              
              // Only include subcategories with expenses
              if (subcatAmount > 0) {
                const subcatPercentage = amount > 0 ? (subcatAmount / amount) * 100 : 0;
                
                subcategoriesWithAmount.push({
                  ...subcategory,
                  amount: subcatAmount,
                  percentage: subcatPercentage
                });
              }
            }
            
            // Sort subcategories by amount (highest first)
            subcategoriesWithAmount.sort((a, b) => b.amount - a.amount);
            
            // Add category with its subcategories
            categoriesWithData.push({
              ...category,
              amount,
              percentage,
              children: subcategoriesWithAmount.length > 0 ? subcategoriesWithAmount : undefined
            });
          }
        }
      }
      
      // Sort categories by amount (highest first)
      categoriesWithData.sort((a, b) => b.amount - a.amount);
      
      setCategoriesWithAmounts(categoriesWithData);
      
      // Prepare data for the chart
      updateChartData(categoriesWithData);
      
    } catch (error) {
      console.error('Error processing categories:', error);
    }
  };
  
  // Update chart data based on selected category or main categories
  const updateChartData = (categories: CategoryWithAmount[]) => {
    if (drillDownMode === 'subcategory' && selectedCategory?.children?.length) {
      // Show subcategories of selected category
      const subcategoryChart = selectedCategory.children.map(subcat => ({
        name: subcat.nombre,
        value: subcat.amount,
        color: subcat.color,
        legendFontColor: theme.COLORS.text.primary,
        legendFontSize: 12
      }));
      
      setChartData(subcategoryChart);
    } else {
      // Show main categories
      const mainCategoriesChart = categories
        .slice(0, 5) // Limit to top 5 categories
        .map(cat => ({
          name: cat.nombre,
          value: cat.amount,
          color: cat.color,
          legendFontColor: theme.COLORS.text.primary,
          legendFontSize: 12
        }));
      
      setChartData(mainCategoriesChart);
    }
  };
  
  const onRefresh = async () => {
    await loadData();
  };
  
  // Handle category selection for drill-down
  const handleCategorySelect = (category: CategoryWithAmount) => {
    if (category.children?.length) {
      setSelectedCategory(category);
      setDrillDownMode('subcategory');
      updateChartData([category]); // Update chart to show subcategories
    } else {
      Alert.alert('Sin subcategorías', 'Esta categoría no tiene subcategorías con gastos.');
    }
  };
  
  // Return to main categories view
  const handleBackToMain = () => {
    setSelectedCategory(null);
    setDrillDownMode('main');
    updateChartData(categoriesWithAmounts);
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header 
        title="Análisis Financiero" 
        onProfilePress={() => console.log('Profile pressed')}
      />
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period selector */}
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
        
        {/* Financial summary */}
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
        
        {/* View mode selector */}
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
              viewMode === 'hierarchy' && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode('hierarchy')}
          >
            <Text
              style={[
                styles.viewModeButtonText,
                viewMode === 'hierarchy' && styles.viewModeButtonTextActive
              ]}
            >
              Jerarquía
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Chart view */}
        {viewMode === 'chart' && (
          <View style={styles.chartCard}>
            {/* Breadcrumb navigation for drill-down */}
            {drillDownMode === 'subcategory' && selectedCategory && (
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
              {drillDownMode === 'subcategory' && selectedCategory
                ? `Subcategorías de ${selectedCategory.nombre}`
                : 'Distribución de gastos'}
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
        )}
        
        {/* Hierarchy view */}
        {viewMode === 'hierarchy' && (
          <View style={styles.hierarchyContainer}>
            <Text style={styles.sectionTitle}>Gastos por categoría y subcategoría</Text>
            
            {categoriesWithAmounts.length > 0 ? (
              categoriesWithAmounts.map(category => (
                <CategoryHierarchyView
                  key={category.id}
                  category={category}
                  totalAmount={category.amount}
                  onCategoryPress={handleCategorySelect}
                />
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No hay datos disponibles</Text>
              </View>
            )}
          </View>
        )}
        
        {/* List of main spending categories - only in chart mode */}
        {viewMode === 'chart' && drillDownMode === 'main' && (
          <View style={styles.categoryListCard}>
            <Text style={styles.chartTitle}>Principales gastos por categoría</Text>
            
            {categoriesWithAmounts.length > 0 ? (
              <View style={styles.categoryList}>
                {categoriesWithAmounts.slice(0, 5).map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.categoryItem}
                    onPress={() => handleCategorySelect(item)}
                  >
                    <View style={styles.categoryNameContainer}>
                      <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                      <Text style={styles.categoryName}>{item.nombre}</Text>
                      {item.children && (
                        <ChevronRight size={16} color={theme.COLORS.grey[500]} />
                      )}
                    </View>
                    <View style={styles.categoryValueContainer}>
                      <Text style={styles.categoryValue}>{CURRENCY_SYMBOL}{item.amount.toFixed(2)}</Text>
                      <Text style={styles.categoryPercentage}>{item.percentage.toFixed(1)}%</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No hay categorías de gasto</Text>
              </View>
            )}
          </View>
        )}
        
        {/* List of subcategories - only in drill-down mode */}
        {viewMode === 'chart' && drillDownMode === 'subcategory' && selectedCategory?.children && (
          <View style={styles.categoryListCard}>
            <Text style={styles.chartTitle}>Desglose de {selectedCategory.nombre}</Text>
            
            <View style={styles.categoryList}>
              {selectedCategory.children.map((item, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryNameContainer}>
                    <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                    <Text style={styles.categoryName}>{item.nombre}</Text>
                  </View>
                  <View style={styles.categoryValueContainer}>
                    <Text style={styles.categoryValue}>{CURRENCY_SYMBOL}{item.amount.toFixed(2)}</Text>
                    <Text style={styles.categoryPercentage}>{item.percentage.toFixed(1)}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.xs,
    marginBottom: theme.SPACING.md,
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
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
  },
  periodButtonTextActive: {
    color: theme.COLORS.primary.main,
    fontWeight: "500",
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
  summaryDivider: {
    width: 1,
    backgroundColor: theme.COLORS.grey[200],
    marginHorizontal: theme.SPACING.sm,
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
  hierarchyContainer: {
    marginBottom: theme.SPACING.md,
  },
  sectionTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
    marginBottom: theme.SPACING.md,
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
  },
  categoryListCard: {
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  categoryList: {
    marginTop: theme.SPACING.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  categoryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.SPACING.sm,
  },
  categoryName: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
    marginRight: theme.SPACING.xs,
  },
  categoryValueContainer: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "500",
    color: theme.COLORS.text.primary,
  },
  categoryPercentage: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  }
});

export default Analytics;