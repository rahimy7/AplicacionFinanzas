// src/screens/ImprovedAddTransaction.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { ArrowLeft, Check, X, Calendar } from 'lucide-react-native';
import theme from '../theme/theme';
import { NavigationProps } from '../types/navigation';
import { 
  addTransaction, 
  getAccounts, 
  Category,
  Transaction
} from '../database/asyncStorageDB';
import EnhancedCategorySelector from '../components/EnhancedCategorySelector';
import { CURRENCY_SYMBOL } from '../constants/currency';

interface Account {
  id: string;
  nombre: string;
  tipo: string;
  saldo: number;
  moneda: string;
  color: string;
}

interface ImprovedAddTransactionProps extends NavigationProps<'AddTransaction'> {
  // Si hay propiedades adicionales, agrégalas aquí
}

const ImprovedAddTransaction: React.FC<ImprovedAddTransactionProps> = ({ navigation, route }) => {
  // Estados para formulario
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [notas, setNotas] = useState('');
  const [isIncome, setIsIncome] = useState(false);
  
  // Estados para selección de categoría
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null);
  
  // Estados para selección de cuenta
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Estados para modales
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para selector de fecha personalizado
  const [tempYear, setTempYear] = useState(fecha.getFullYear());
  const [tempMonth, setTempMonth] = useState(fecha.getMonth() + 1); // Los meses en JS son 0-11
  const [tempDay, setTempDay] = useState(fecha.getDate());
  
  // Estado para modo edición
  const [isEditing, setIsEditing] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // Cargar datos al montar
  useEffect(() => {
    loadAccounts();
    
    // Verificar si estamos en modo edición
    if (route.params?.transaction) {
      const transaction = route.params.transaction as Transaction;
      setupEditMode(transaction);
    }
  }, []);
  
  // Restablecer selección de categoría al cambiar tipo de transacción
  useEffect(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  }, [isIncome]);
  
  // Cargar cuentas
  const loadAccounts = async () => {
    try {
      const accountsData = await getAccounts();
      setAccounts(accountsData);
      
      // Establecer la primera cuenta como predeterminada
      if (accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0]);
      }
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      Alert.alert('Error', 'No se pudieron cargar las cuentas');
    }
  };
  
  // Configurar modo edición
  const setupEditMode = (transaction: Transaction) => {
    setIsEditing(true);
    setTransactionId(transaction.id);
    setConcepto(transaction.concepto);
    setMonto(Math.abs(transaction.monto).toString());
    setIsIncome(transaction.monto > 0);
    setNotas(transaction.notas || '');
    
    // Establecer fecha
    if (transaction.fecha) {
      const txDate = new Date(transaction.fecha);
      setFecha(txDate);
      setTempYear(txDate.getFullYear());
      setTempMonth(txDate.getMonth() + 1);
      setTempDay(txDate.getDate());
    }
    
    // Buscar y establecer la cuenta
    if (transaction.cuenta) {
      // La cuenta se establecerá cuando se carguen las cuentas
    }
    
    // La categoría y subcategoría se establecerán a través del componente EnhancedCategorySelector
  };
  
  // Manejar la selección de categoría y subcategoría
  const handleCategorySelect = (category: Category | null, subcategory?: Category | null) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory || null);
  };
  
  // Formatear fecha para mostrar
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Abrir selector de fecha
  const handleOpenDatePicker = () => {
    setTempYear(fecha.getFullYear());
    setTempMonth(fecha.getMonth() + 1);
    setTempDay(fecha.getDate());
    setShowDatePicker(true);
  };
  
  // Confirmar selección de fecha
  const confirmDateSelection = () => {
    const newDate = new Date(tempYear, tempMonth - 1, tempDay);
    setFecha(newDate);
    setShowDatePicker(false);
  };
  
  // Guardar transacción
  const handleSave = async () => {
    // Validación básica
    if (!concepto.trim()) {
      Alert.alert('Error', 'Por favor ingresa un concepto');
      return;
    }
    
    if (!monto || isNaN(parseFloat(monto))) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }
    
    if (!selectedCategory) {
      Alert.alert('Error', 'Por favor selecciona una categoría');
      return;
    }
    
    if (!selectedAccount) {
      Alert.alert('Error', 'Por favor selecciona una cuenta');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Preparar datos de la transacción con jerarquía de categoría
      const transactionData: Partial<Transaction> = {
        concepto: concepto.trim(),
        categoriaId: selectedCategory.id,
        categoria: selectedCategory.nombre,
        monto: isIncome ? Math.abs(parseFloat(monto)) : -Math.abs(parseFloat(monto)),
        fecha: fecha.toISOString().split('T')[0], // Formato YYYY-MM-DD
        cuenta: selectedAccount.nombre,
        cuentaId: selectedAccount.id,
        notas: notas.trim() || undefined,
      };
      
      // Agregar datos de subcategoría si está presente
      if (selectedSubcategory) {
        transactionData.subcategoriaId = selectedSubcategory.id;
        transactionData.subcategoria = selectedSubcategory.nombre;
      }
      
      // Guardar transacción (implementar updateTransaction si es necesario)
      if (isEditing && transactionId) {
        // await updateTransaction(transactionId, transactionData);
        Alert.alert('No implementado', 'La función de actualización no está implementada');
      } else {
        await addTransaction(transactionData as Transaction);
      }
      
      // Volver a la pantalla anterior
      navigation.goBack();
    } catch (error) {
      console.error('Error al guardar transacción:', error);
      Alert.alert('Error', 'No se pudo guardar la transacción. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Meses para el selector de fecha
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Obtener días en el mes para el selector de fecha
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };
  
  // Generar arrays para los selectores de fecha
  const generateYearArray = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years;
  };
  
  const generateDayArray = () => {
    const daysInMonth = getDaysInMonth(tempYear, tempMonth);
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };
  
  // Renderizar modal de selección de cuenta
  const renderAccountModal = () => (
    <Modal
      visible={showAccountModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAccountModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar cuenta</Text>
            <TouchableOpacity onPress={() => setShowAccountModal(false)}>
              <X size={24} color={theme.COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedAccount(item);
                  setShowAccountModal(false);
                }}
              >
                <View style={[styles.accountIcon, { backgroundColor: item.color }]} />
                <View style={styles.accountDetails}>
                  <Text style={styles.modalItemText}>{item.nombre}</Text>
                  <Text style={styles.accountBalance}>{CURRENCY_SYMBOL}{item.saldo.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No hay cuentas disponibles</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
  
  // Renderizar selector de fecha personalizado
  const renderDatePickerModal = () => (
    <Modal
      visible={showDatePicker}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar fecha</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <X size={24} color={theme.COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateSelectors}>
            {/* Selector de mes */}
            <View style={styles.dateSelector}>
              <Text style={styles.dateSelectorLabel}>Mes</Text>
              <ScrollView style={styles.dateSelectorScroll}>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateSelectorItem,
                      tempMonth === index + 1 && styles.dateSelectorItemSelected
                    ]}
                    onPress={() => {
                      setTempMonth(index + 1);
                      // Ajustar el día si excede los días en el nuevo mes
                      const daysInNewMonth = getDaysInMonth(tempYear, index + 1);
                      if (tempDay > daysInNewMonth) {
                        setTempDay(daysInNewMonth);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.dateSelectorItemText,
                        tempMonth === index + 1 && styles.dateSelectorItemTextSelected
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Selector de día */}
            <View style={styles.dateSelector}>
              <Text style={styles.dateSelectorLabel}>Día</Text>
              <ScrollView style={styles.dateSelectorScroll}>
                {generateDayArray().map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dateSelectorItem,
                      tempDay === day && styles.dateSelectorItemSelected
                    ]}
                    onPress={() => setTempDay(day)}
                  >
                    <Text
                      style={[
                        styles.dateSelectorItemText,
                        tempDay === day && styles.dateSelectorItemTextSelected
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Selector de año */}
            <View style={styles.dateSelector}>
              <Text style={styles.dateSelectorLabel}>Año</Text>
              <ScrollView style={styles.dateSelectorScroll}>
                {generateYearArray().map(year => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.dateSelectorItem,
                      tempYear === year && styles.dateSelectorItemSelected
                    ]}
                    onPress={() => setTempYear(year)}
                  >
                    <Text
                      style={[
                        styles.dateSelectorItemText,
                        tempYear === year && styles.dateSelectorItemTextSelected
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.confirmDateButton}
            onPress={confirmDateSelection}
          >
            <Text style={styles.confirmDateButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={theme.COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar transacción' : 'Nueva transacción'}
          </Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.COLORS.success.main} />
            ) : (
              <Check size={24} color={theme.COLORS.success.main} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Selector de tipo de transacción (Ingreso/Gasto) */}
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                !isIncome && styles.typeButtonActive
              ]}
              onPress={() => setIsIncome(false)}
            >
              <Text style={[
                styles.typeButtonText,
                !isIncome && styles.typeButtonTextActive
              ]}>
                Gasto
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                isIncome && styles.typeButtonActive
              ]}
              onPress={() => setIsIncome(true)}
            >
              <Text style={[
                styles.typeButtonText,
                isIncome && styles.typeButtonTextActive
              ]}>
                Ingreso
              </Text>
            </TouchableOpacity>
          </View>

          {/* Monto */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>{CURRENCY_SYMBOL}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={monto}
              onChangeText={setMonto}
              placeholderTextColor={theme.COLORS.grey[400]}
            />
          </View>

          {/* Concepto */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Concepto</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej. Supermercado"
              value={concepto}
              onChangeText={setConcepto}
              placeholderTextColor={theme.COLORS.grey[400]}
            />
          </View>

          {/* Categoría y Subcategoría con el componente mejorado */}
          <EnhancedCategorySelector
            onSelectCategory={handleCategorySelect}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            categoryType={isIncome ? 'ingreso' : 'gasto'}
            subcategoryRequired={true}
            label="Categoría"
            placeholder="Seleccionar categoría"
          />

          {/* Cuenta */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cuenta</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowAccountModal(true)}
            >
              {selectedAccount ? (
                <View style={styles.pickerSelected}>
                  <View style={[styles.accountDot, { backgroundColor: selectedAccount.color }]} />
                  <Text style={styles.pickerSelectedText}>{selectedAccount.nombre}</Text>
                </View>
              ) : (
                <Text style={styles.pickerPlaceholder}>Seleccionar cuenta</Text>
              )}
              <ArrowLeft size={20} color={theme.COLORS.grey[500]} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Fecha */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fecha</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={handleOpenDatePicker}
            >
              <Text style={styles.pickerSelectedText}>{formatDate(fecha)}</Text>
              <Calendar size={20} color={theme.COLORS.grey[500]} />
            </TouchableOpacity>
          </View>

          {/* Notas */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Notas (opcional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Añadir notas sobre esta transacción"
              value={notas}
              onChangeText={setNotas}
              multiline={true}
              numberOfLines={4}
              placeholderTextColor={theme.COLORS.grey[400]}
            />
          </View>
        </ScrollView>

        {/* Modales */}
        {renderAccountModal()}
        {renderDatePickerModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.COLORS.common.white,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  backButton: {
    padding: theme.SPACING.xs,
  },
  headerTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
  },
  saveButton: {
    padding: theme.SPACING.xs,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: theme.SPACING.md,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.xs,
  },
  typeButton: {
    flex: 1,
    paddingVertical: theme.SPACING.sm,
    alignItems: 'center',
    borderRadius: theme.BORDER_RADIUS.sm,
  },
  typeButtonActive: {
    backgroundColor: theme.COLORS.common.white,
    ...theme.SHADOWS.sm,
  },
  typeButtonText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
  },
  typeButtonTextActive: {
    color: theme.COLORS.text.primary,
    fontWeight: "500",
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.xl,
    paddingBottom: theme.SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: theme.COLORS.primary.main,
  },
  currencySymbol: {
    fontSize: theme.FONT_SIZE["3xl"],
    color: theme.COLORS.text.primary,
    marginRight: theme.SPACING.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: theme.FONT_SIZE["3xl"],
    fontWeight: "700",
    color: theme.COLORS.text.primary,
    padding: 0,
  },
  inputContainer: {
    marginBottom: theme.SPACING.md,
  },
  inputLabel: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.xs,
  },
  textInput: {
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
  },
  pickerSelected: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerSelectedText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  pickerPlaceholder: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.grey[400],
  },
  accountDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.COLORS.common.white,
    borderTopLeftRadius: theme.BORDER_RADIUS.lg,
    borderTopRightRadius: theme.BORDER_RADIUS.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  modalTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  modalItemText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.COLORS.primary.main,
    marginRight: theme.SPACING.md,
  },
  accountDetails: {
    flex: 1,
  },
  accountBalance: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
    marginTop: 2,
  },
  emptyState: {
    padding: theme.SPACING.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
  },
  datePickerContainer: {
    backgroundColor: theme.COLORS.common.white,
    borderTopLeftRadius: theme.BORDER_RADIUS.lg,
    borderTopRightRadius: theme.BORDER_RADIUS.lg,
    padding: theme.SPACING.lg,
  },
  dateSelectors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.SPACING.lg,
  },
  dateSelector: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: theme.SPACING.xs,
  },
  dateSelectorLabel: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.sm,
  },
  dateSelectorScroll: {
    height: 200,
    width: '100%',
  },
  dateSelectorItem: {
    paddingVertical: theme.SPACING.sm,
    alignItems: 'center',
    borderRadius: theme.BORDER_RADIUS.sm,
  },
  dateSelectorItemSelected: {
    backgroundColor: theme.COLORS.primary.light,
  },
  dateSelectorItemText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  dateSelectorItemTextSelected: {
    color: theme.COLORS.primary.main,
    fontWeight: "500",
  },
  confirmDateButton: {
    backgroundColor: theme.COLORS.primary.main,
    paddingVertical: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    alignItems: 'center',
  },
  confirmDateButtonText: {
    color: theme.COLORS.common.white,
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
  },
});

export default ImprovedAddTransaction;