import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl,
  SafeAreaView,
  Platform,
  Dimensions
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import Header from '../components/Layout/Header';
import TransactionCard from '../components/EnhancedTransactionCard';
import theme from '../theme/theme';
import { NavigationProps } from '../types/navigation';
import { CURRENCY_SYMBOL } from '../constants/currency';
import {
  getTransactions,
  getCurrentMonthBalance,
  getTransactionsByCategory,
  getBudgets,
  Transaction,
  Budget
} from '../database/asyncStorageDB';

// Definimos una interfaz para el objeto de resumen
interface SummaryData {
  ingresos: number;
  gastos: number;
  balance: number;
  ahorro: number;
  presupuestado: number;
}

// Interfaz para los resultados de la barra de progreso
interface ProgressBarResult {
  gastosPercentage: number;
  presupuestadoPendientePercentage: number;
  excedentePercentage: number;
  gastosValue: number;
  presupuestoPendienteValue: number;
  excedenteValue: number;
}



const screenWidth = Dimensions.get('window').width;

// Función para formatear números con separadores de miles
const formatNumber = (num: number | undefined): string => {
  // Asegurar que el valor es un número y tiene un valor predeterminado
  const safeNum = Number(num) || 0;
  return safeNum.toLocaleString('es-ES');
};

const Dashboard: React.FC<NavigationProps<'Dashboard'>> = ({ navigation }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [summaryData, setSummaryData] = useState<SummaryData>({
    ingresos: 0,
    gastos: 0,
    balance: 0,
    ahorro: 0,
    presupuestado: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Cargar datos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Obtener transacciones
      const allTransactions = await getTransactions();
      
      // Filtrar por mes actual
      const currentDate = new Date();
      const currentMonthIndex = currentDate.getMonth();
      const currentYearValue = currentDate.getFullYear();
      
      const currentMonthTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.fecha);
        return txDate.getMonth() === currentMonthIndex && txDate.getFullYear() === currentYearValue;
      });
      
      setTransactions(currentMonthTransactions);
      
      // Obtener las 5 transacciones más recientes
      const sorted = [...currentMonthTransactions].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      setRecentTransactions(sorted.slice(0, 5));

      // Obtener balance mensual
      const balance = await getCurrentMonthBalance();
      
      // Obtener presupuestos
      const budgets = await getBudgets();
      
      // Filtrar presupuestos del mes actual
      const currentMonthBudgets = budgets.filter(budget => {
        const startDate = new Date(budget.fechaInicio);
        const endDate = new Date(budget.fechaFin);
        
        // Verificar si el presupuesto está activo en el mes actual
        const isActiveInCurrentMonth = 
          (startDate.getMonth() === currentMonthIndex && startDate.getFullYear() === currentYearValue) ||
          (endDate.getMonth() === currentMonthIndex && endDate.getFullYear() === currentYearValue) ||
          (startDate < currentDate && endDate > currentDate);
          
        return isActiveInCurrentMonth;
      });
      
      const totalPresupuestado = currentMonthBudgets.reduce((sum, budget) => sum + budget.limite, 0);
      
      // Calcular el excedente/ahorro: ingresos - (gastos + presupuesto pendiente)
      const presupuestoPendiente = Math.max(totalPresupuestado - balance.gastos, 0);
      const excedente = balance.ingresos - (balance.gastos + presupuestoPendiente);
      
      setSummaryData({
        ingresos: balance.ingresos,
        gastos: balance.gastos,
        balance: balance.balance,
        ahorro: excedente, // Ahorro es igual al excedente
        presupuestado: totalPresupuestado
      });
      

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    }
  };
  


  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Calcular porcentajes para la barra de progreso
  const calculateProgressBarPercentages = (): ProgressBarResult => {
    const { ingresos, gastos, presupuestado } = summaryData;
    
    if (ingresos <= 0) {
      return {
  gastosPercentage: 0,
  presupuestadoPendientePercentage: 0,
  excedentePercentage: 0,
  gastosValue: 0,
  presupuestoPendienteValue: 0,
  excedenteValue: 0
};
    }
    
    // Porcentaje de gastos (en rojo) - sólo gastos del mes actual
    const gastosPercentage = Math.min((gastos / ingresos) * 100, 100);
    
    // Porcentaje de presupuesto pendiente (en amarillo) - sólo presupuestos del mes actual
    const presupuestoPendiente = Math.max(presupuestado - gastos, 0);
    const presupuestadoPendientePercentage = Math.min((presupuestoPendiente / ingresos) * 100, 100 - gastosPercentage);
    
    // Porcentaje de excedente (en verde) - considerando sólo gastos y presupuestos del mes
    const excedentePercentage = Math.max(100 - gastosPercentage - presupuestadoPendientePercentage, 0);
    
    return {
      gastosPercentage,
      presupuestadoPendientePercentage,
      excedentePercentage,
      // Añadir los valores para mostrarlos en la UI
      gastosValue: gastos,
      presupuestoPendienteValue: presupuestoPendiente,
      excedenteValue: ingresos - (gastos + presupuestoPendiente)
    };
  };

  // Formatear fecha para mostrar en transacciones recientes
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header 
        title="Finanzas Familiares" 
        showMenu={true}
        menuOpen={menuOpen}
        onMenuPress={toggleMenu}
        onAddPress={() => console.log('Add pressed')}
        onProfilePress={() => console.log('Profile pressed')}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Tarjetas de resumen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, styles.incomesCard]}>
              <Text style={styles.summaryLabel}>Ingresos del mes</Text>
              <Text style={[styles.summaryValue, styles.incomesValue]}>
                {CURRENCY_SYMBOL}{formatNumber(summaryData.ingresos)}
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.expensesCard]}>
              <Text style={styles.summaryLabel}>Gastos del mes</Text>
              <Text style={[styles.summaryValue, styles.expensesValue]}>
                {CURRENCY_SYMBOL}{formatNumber(summaryData.gastos)}
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.balanceCard]}>
              <Text style={styles.summaryLabel}>Balance</Text>
              <Text style={[styles.summaryValue, styles.balanceValue]}>
                {CURRENCY_SYMBOL}{formatNumber(summaryData.balance)}
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.savingsCard]}>
              <Text style={styles.summaryLabel}>Ahorro</Text>
              <Text style={[styles.summaryValue, styles.savingsValue]}>
                {CURRENCY_SYMBOL}{formatNumber(summaryData.ahorro)}
              </Text>
            </View>
          </View>
          
          {/* Barra de progreso horizontal */}
          <View style={styles.progressBarContainer}>
            <Text style={styles.progressBarTitle}>Distribución de ingresos del mes actual</Text>
          <Text style={styles.progressBarSubtitle}></Text>
            <View style={styles.progressBarWrapper}>
              {(() => {
                const { 
                  gastosPercentage, 
                  presupuestadoPendientePercentage, 
                  excedentePercentage,
                  gastosValue,
                  presupuestoPendienteValue,
                  excedenteValue
                } = calculateProgressBarPercentages();
                return (
                  <>
                    <View style={[styles.progressBarSegment, { 
                      width: `${gastosPercentage}%`, 
                      backgroundColor: theme.COLORS.error.main 
                    }]}>
                      {gastosPercentage > 15 && (
                        <Text style={styles.progressBarValue}>
                          {CURRENCY_SYMBOL}{formatNumber(gastosValue)}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.progressBarSegment, { 
                      width: `${presupuestadoPendientePercentage}%`, 
                      backgroundColor: theme.COLORS.warning.main 
                    }]}>
                      {presupuestadoPendientePercentage > 15 && (
                        <Text style={styles.progressBarValue}>
                          {CURRENCY_SYMBOL}{formatNumber(presupuestoPendienteValue)}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.progressBarSegment, { 
                      width: `${excedentePercentage}%`, 
                      backgroundColor: theme.COLORS.success.main 
                    }]}>
                      {excedentePercentage > 15 && (
                        <Text style={styles.progressBarValue}>
                          {CURRENCY_SYMBOL}{formatNumber(excedenteValue)}
                        </Text>
                      )}
                    </View>
                  </>
                );
              })()}
            </View>
            <View style={styles.progressLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: theme.COLORS.error.main }]} />
                <Text style={styles.legendText}>Gastado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: theme.COLORS.warning.main }]} />
                <Text style={styles.legendText}>Presupuestado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: theme.COLORS.success.main }]} />
                <Text style={styles.legendText}>Excedente</Text>
              </View>
            </View>
          </View>
        </View>



        {/* Transacciones recientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transacciones recientes</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Transactions')}
            >
              <Text style={styles.viewAllText}>Ver todas</Text>
              <ArrowRight size={16} color={theme.COLORS.primary.main} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionsContainer}>
            {recentTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No hay transacciones recientes</Text>
              </View>
            ) : (
              recentTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  id={transaction.id}
                  concepto={transaction.concepto}
                  categoria={transaction.categoria}
                  monto={transaction.monto}
                  fecha={formatDate(transaction.fecha)}
                  onPress={() => console.log(`Transaction ${transaction.id} pressed`)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.COLORS.background.default,
  },

  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.SPACING.md,
  },
  section: {
    marginBottom: theme.SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  sectionTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "700",
    color: theme.COLORS.text.primary,
    marginBottom: theme.SPACING.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  incomesCard: {
    backgroundColor: theme.COLORS.primary.light,
  },
  expensesCard: {
    backgroundColor: theme.COLORS.error.light,
  },
  balanceCard: {
    backgroundColor: theme.COLORS.success.light,
  },
  savingsCard: {
    backgroundColor: theme.COLORS.secondary.light,
  },
  summaryLabel: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.xs,
  },
  summaryValue: {
    fontSize: theme.FONT_SIZE.xl,
    fontWeight: "700",
  },
  incomesValue: {
    color: theme.COLORS.primary.main,
  },
  expensesValue: {
    color: theme.COLORS.error.main,
  },
  balanceValue: {
    color: theme.COLORS.success.main,
  },
  savingsValue: {
    color: theme.COLORS.secondary.main,
  },
  progressBarContainer: {
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginTop: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  progressBarTitle: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
    marginBottom: theme.SPACING.sm,
    color: theme.COLORS.text.primary,
  },
  progressBarSubtitle: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.sm,
  },
  progressBarWrapper: {
    height: 30,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.full,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarSegment: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarValue: {
    color: theme.COLORS.common.white,
    fontSize: 10,
    fontWeight: "700",
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.SPACING.xs,
  },
  legendText: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.text.secondary,
  },

  transactionsContainer: {
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    overflow: 'hidden',
    ...theme.SHADOWS.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: theme.COLORS.primary.main,
    marginRight: theme.SPACING.xs,
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
  },
  emptyState: {
    padding: theme.SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: theme.COLORS.text.secondary,
    fontSize: theme.FONT_SIZE.md,
  },
});

export default Dashboard;