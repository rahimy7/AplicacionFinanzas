// src/screens/Transactions.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView
} from 'react-native';
import Header from '../components/Layout/Header';
import TransactionCard from '../components/EnhancedTransactionCard';
import { Filter, Search, Plus, Calendar } from 'lucide-react-native';
import theme from '../theme/theme';
import { NavigationProps } from '../types/navigation';
import { getTransactions, Transaction } from '../database/asyncStorageDB';
import { CURRENCY_SYMBOL } from '../constants/currency';

const Transactions: React.FC<NavigationProps<'Transactions'>> = ({ navigation }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('todos');
  
  // Estados para los filtros de período
  const [activePeriod, setActivePeriod] = useState('mes');
  const [periodSummary, setPeriodSummary] = useState({
    ingresos: 0,
    gastos: 0,
    balance: 0
  });

  // Cargar transacciones
  useEffect(() => {
    loadTransactions();
  }, []);

  // Filtrar transacciones cuando cambie el searchQuery, activeFilter o activePeriod
  useEffect(() => {
    filterTransactions();
  }, [searchQuery, activeFilter, activePeriod, transactions]);

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    }
  };

  // Obtener el nombre del mes actual
  const getCurrentMonthName = () => {
    const months = [
      'Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.',
      'Jul.', 'Agos.', 'Sept.', 'Oct.', 'Nov.', 'Dic.'
    ];
    const currentMonth = new Date().getMonth();
    return months[currentMonth];
  };

  // Obtener el nombre del mes anterior
  const getPreviousMonthName = () => {
    const months = [
      'Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.',
      'Jul.', 'Agos.', 'Sept.', 'Oct.', 'Nov.', 'Dic.'
    ];
    const currentMonth = new Date().getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    return months[previousMonth];
  };

  const filterTransactions = () => {
    let filtered = [...transactions];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    
    // Filtrar por período
    if (activePeriod === 'q1') {
      // Primera quincena (1-15 del mes actual)
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth, 15, 23, 59, 59);
      
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.fecha);
        return txDate >= startDate && txDate <= endDate;
      });
    } else if (activePeriod === 'q2') {
      // Segunda quincena (16-fin del mes actual)
      const startDate = new Date(currentYear, currentMonth, 16);
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.fecha);
        return txDate >= startDate && txDate <= endDate;
      });
    } else if (activePeriod === 'mes') {
      // Mes actual completo
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.fecha);
        return txDate >= startDate && txDate <= endDate;
      });
    } else if (activePeriod === 'mes_ant') {
      // Mes anterior completo
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.fecha);
        return txDate >= startDate && txDate <= endDate;
      });
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.concepto.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.categoria.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por tipo
    if (activeFilter === 'ingresos') {
      filtered = filtered.filter(tx => tx.monto > 0);
    } else if (activeFilter === 'gastos') {
      filtered = filtered.filter(tx => tx.monto < 0);
    }

    // Ordenar por fecha más reciente
    filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // Calcular resumen del período
    let ingresos = 0;
    let gastos = 0;
    
    filtered.forEach(tx => {
      if (tx.monto > 0) {
        ingresos += tx.monto;
      } else {
        gastos += Math.abs(tx.monto);
      }
    });
    
    setPeriodSummary({
      ingresos,
      gastos,
      balance: ingresos - gastos
    });

    setFilteredTransactions(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleAddTransaction = () => {
    navigation.navigate('AddTransaction');
  };

  const renderPeriodFilter = () => (
    <View style={styles.periodFilterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.periodFilterButton,
            activePeriod === 'mes_ant' ? styles.activePeriodFilterButton : null
          ]}
          onPress={() => setActivePeriod('mes_ant')}
        >
          <Text
            style={[
              styles.periodFilterText,
              activePeriod === 'mes_ant' ? styles.activePeriodFilterText : null
            ]}
          >
            {getPreviousMonthName()}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.periodFilterButton,
            activePeriod === 'q1' ? styles.activePeriodFilterButton : null
          ]}
          onPress={() => setActivePeriod('q1')}
        >
          <Text
            style={[
              styles.periodFilterText,
              activePeriod === 'q1' ? styles.activePeriodFilterText : null
            ]}
          >
            Q1
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.periodFilterButton,
            activePeriod === 'q2' ? styles.activePeriodFilterButton : null
          ]}
          onPress={() => setActivePeriod('q2')}
        >
          <Text
            style={[
              styles.periodFilterText,
              activePeriod === 'q2' ? styles.activePeriodFilterText : null
            ]}
          >
            Q2
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.periodFilterButton,
            activePeriod === 'mes' ? styles.activePeriodFilterButton : null
          ]}
          onPress={() => setActivePeriod('mes')}
        >
          <Text
            style={[
              styles.periodFilterText,
              activePeriod === 'mes' ? styles.activePeriodFilterText : null
            ]}
          >
            {getCurrentMonthName()}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderPeriodSummary = () => (
    <View style={styles.periodSummaryContainer}>
      <View style={styles.periodSummaryItem}>
        <Text style={styles.periodSummaryLabel}>Ingresos</Text>
        <Text style={[styles.periodSummaryValue, styles.incomeValue]}>
          {CURRENCY_SYMBOL}{periodSummary.ingresos.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.periodSummaryItem}>
        <Text style={styles.periodSummaryLabel}>Gastos</Text>
        <Text style={[styles.periodSummaryValue, styles.expenseValue]}>
          {CURRENCY_SYMBOL}{periodSummary.gastos.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.periodSummaryItem}>
        <Text style={styles.periodSummaryLabel}>Balance</Text>
        <Text style={[
          styles.periodSummaryValue,
          periodSummary.balance >= 0 ? styles.positiveBalanceValue : styles.negativeBalanceValue
        ]}>
          {CURRENCY_SYMBOL}{periodSummary.balance.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Filtro de período */}
      {renderPeriodFilter()}
      
      {/* Resumen del período */}
      {renderPeriodSummary()}
      
      {/* Búsqueda y filtros */}
      <View style={styles.searchContainer}>
        <Search size={20} color={theme.COLORS.grey[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar transacciones..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.COLORS.grey[400]}
        />
        <TouchableOpacity onPress={toggleFilters} style={styles.filterButton}>
          <Filter size={20} color={showFilters ? theme.COLORS.primary.main : theme.COLORS.grey[600]} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'todos' ? styles.activeFilterChip : null
            ]}
            onPress={() => setActiveFilter('todos')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'todos' ? styles.activeFilterChipText : null
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'ingresos' ? styles.activeFilterChip : null
            ]}
            onPress={() => setActiveFilter('ingresos')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'ingresos' ? styles.activeFilterChipText : null
              ]}
            >
              Ingresos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'gastos' ? styles.activeFilterChip : null
            ]}
            onPress={() => setActiveFilter('gastos')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'gastos' ? styles.activeFilterChipText : null
              ]}
            >
              Gastos
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No hay transacciones para este período</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddTransaction}
      >
        <Text style={styles.addButtonText}>Añadir transacción</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFloatingButton = () => (
    <TouchableOpacity 
      style={styles.floatingButton}
      onPress={handleAddTransaction}
    >
      <Plus size={24} color={theme.COLORS.common.white} />
    </TouchableOpacity>
  );

  // Formatea la fecha para mostrarla en un formato más amigable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header 
        title="Transacciones" 
        showMenu={true}
        menuOpen={menuOpen}
        onMenuPress={toggleMenu}
        onProfilePress={() => console.log('Profile pressed')}
      />

      <FlatList
        data={filteredTransactions}
        renderItem={({ item }) => (
          <TransactionCard
            id={item.id}
            concepto={item.concepto}
            categoria={item.categoria}
            monto={item.monto}
            fecha={formatDate(item.fecha)}
            onPress={() => console.log(`Transaction ${item.id} pressed`)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {renderFloatingButton()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.COLORS.background.default,
  },
  listContent: {
    padding: theme.SPACING.md,
    paddingBottom: theme.SPACING.xl * 2, // Extra space for FAB
  },
  listHeader: {
    marginBottom: theme.SPACING.md,
  },
  periodFilterContainer: {
    marginBottom: theme.SPACING.md,
  },
  periodFilterButton: {
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.lg,
    borderRadius: theme.BORDER_RADIUS.md,
    backgroundColor: theme.COLORS.common.white,
    marginRight: theme.SPACING.sm,
    ...theme.SHADOWS.sm,
  },
  activePeriodFilterButton: {
    backgroundColor: theme.COLORS.primary.main,
  },
  periodFilterText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
    fontWeight: "500",
  },
  activePeriodFilterText: {
    color: theme.COLORS.common.white,
  },
  periodSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  periodSummaryItem: {
    alignItems: 'center',
  },
  periodSummaryLabel: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.xs,
  },
  periodSummaryValue: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
  },
  incomeValue: {
    color: theme.COLORS.success.main,
  },
  expenseValue: {
    color: theme.COLORS.error.main,
  },
  positiveBalanceValue: {
    color: theme.COLORS.success.main,
  },
  negativeBalanceValue: {
    color: theme.COLORS.error.main,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.sm,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.sm,
  },
  searchIcon: {
    marginRight: theme.SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  filterButton: {
    padding: theme.SPACING.sm,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
  },
  filterChip: {
    backgroundColor: theme.COLORS.grey[200],
    paddingVertical: theme.SPACING.xs,
    paddingHorizontal: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.full,
    marginRight: theme.SPACING.sm,
  },
  activeFilterChip: {
    backgroundColor: theme.COLORS.primary.main,
  },
  filterChipText: {
    color: theme.COLORS.text.primary,
    fontSize: theme.FONT_SIZE.sm,
  },
  activeFilterChipText: {
    color: theme.COLORS.common.white,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.SPACING.xl,
  },
  emptyText: {
    fontSize: theme.FONT_SIZE.lg,
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.md,
  },
  addButton: {
    backgroundColor: theme.COLORS.primary.main,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
  },
  addButtonText: {
    color: theme.COLORS.common.white,
    fontWeight: "500",
  },
  floatingButton: {
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

export default Transactions;