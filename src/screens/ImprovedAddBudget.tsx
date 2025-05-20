// src/screens/AddBudget.tsx
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
  Switch,
  ActivityIndicator
} from 'react-native';
import { ArrowLeft, Check, X, ChevronDown, Calendar, AlertCircle, Plus } from 'lucide-react-native';
import theme from '../theme/theme';
import { NavigationProps } from '../types/navigation';
import { 
  addBudget,
  updateBudget,
  getBudgets,
  getCategories, 
  getSubcategoriesByParentId,
  Category,
  Budget,
  prorrateBudget
} from '../database/asyncStorageDB';
import { CURRENCY_SYMBOL } from '../constants/currency';
import EnhancedCategorySelector from '../components/EnhancedCategorySelector';

// Tipos de período
type PeriodType = 'quincenal-1' | 'quincenal-2' | 'mensual' | 'trimestral' | 'anual';

const AddBudget: React.FC<NavigationProps<'AddBudget'>> = ({ navigation, route }) => {
  // Estados para formulario
  const [limite, setLimite] = useState('');
  const [periodo, setPeriodo] = useState<PeriodType>('mensual');
  const [notas, setNotas] = useState('');
  
  // Estado para modo edición
  const [isEditing, setIsEditing] = useState(false);
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para categoría y subcategoría
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null);
  
  // Modales
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  
  // Estado para indicar si hemos avisado sobre el prorrateo
  const [prorationInfoShown, setProrationInfoShown] = useState(false);

  // Estado para recurrencia
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'mensual' | 'trimestral' | 'anual'>('mensual');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  
  // Estados para selector de fecha personalizado
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState(new Date().getDate());
  
  // Verificar si estamos en modo edición
  useEffect(() => {
    if (route.params?.budget) {
      setupEditMode(route.params.budget);
    }
  }, [route.params]);
  
  // Mostrar información sobre prorrateo cuando corresponda
  useEffect(() => {
    if ((periodo === 'mensual' || periodo === 'trimestral' || periodo === 'anual') && !prorationInfoShown) {
      Alert.alert(
        "Información",
        `Al crear un presupuesto ${periodo}, el monto se prorrateará automáticamente entre las quincenas correspondientes.`,
        [
          { text: "Entendido", onPress: () => setProrationInfoShown(true) }
        ]
      );
    }
  }, [periodo, prorationInfoShown]);
  
  // Configurar modo edición
  const setupEditMode = (budget: Budget) => {
    setIsEditing(true);
    setBudgetId(budget.id);
    setLimite(budget.limite.toString());
    setPeriodo(budget.periodo as PeriodType);
    setNotas(budget.notas || '');
    
    // Configurar recurrencia si existe
    if (budget.recurrente) {
      setIsRecurrent(true);
      setRecurrenceFrequency(budget.frecuenciaRecurrencia || 'mensual');
      
      if (budget.fechaFinRecurrencia) {
        setRecurrenceEndDate(new Date(budget.fechaFinRecurrencia));
      }
    }
    
    // La categoría y subcategoría se establecerán a través del componente EnhancedCategorySelector
  };
  
  // Calcular fechas de inicio y fin según el período
  const calculateDates = (selectedPeriod: PeriodType = periodo) => {
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date();
    
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    if (selectedPeriod === 'quincenal-1') {
      // Primera quincena: del 1 al 15
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth, 15);
    } else if (selectedPeriod === 'quincenal-2') {
      // Segunda quincena: del 16 al último día del mes
      startDate = new Date(currentYear, currentMonth, 16);
      endDate = new Date(currentYear, currentMonth + 1, 0); // Último día del mes actual
    } else if (selectedPeriod === 'mensual') {
      // Todo el mes actual
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0);
    } else if (selectedPeriod === 'trimestral') {
      // Calcular fin de trimestre (marzo, junio, septiembre, diciembre)
      const quarter = Math.floor(currentMonth / 3);
      startDate = new Date(currentYear, quarter * 3, 1);
      endDate = new Date(currentYear, (quarter * 3) + 3, 0); // Último día del trimestre
    } else if (selectedPeriod === 'anual') {
      // Año completo
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31);
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      endDate: endDate.toISOString().split('T')[0],     // Formato YYYY-MM-DD
    };
  };
  
  // Manejar selección de categoría y subcategoría
  const handleCategorySelect = (category: Category | null, subcategory: Category | null = null) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
  };
  
  // Abrir selector de fecha para fin de recurrencia
  const handleDatePickerOpen = () => {
    // Inicializar valores con la fecha actual o la fecha seleccionada
    const dateToUse = recurrenceEndDate || new Date();
    setTempYear(dateToUse.getFullYear());
    setTempMonth(dateToUse.getMonth() + 1);
    setTempDay(dateToUse.getDate());
    
    setShowDatePicker(true);
  };
  
  // Confirmar selección de fecha
  const confirmDateSelection = () => {
    const newDate = new Date(tempYear, tempMonth - 1, tempDay);
    setRecurrenceEndDate(newDate);
    setShowDatePicker(false);
  };
  
  // Formatear fecha para mostrar
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Guardar presupuesto
  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Calcular fechas de inicio y fin
      const { startDate, endDate } = calculateDates();
      
      // Validar campos obligatorios
      if (!selectedCategory) {
        Alert.alert('Error', 'Por favor selecciona una categoría');
        setIsLoading(false);
        return;
      }
      
      if (!limite || isNaN(parseFloat(limite)) || parseFloat(limite) <= 0) {
        Alert.alert('Error', 'Por favor ingresa un límite válido');
        setIsLoading(false);
        return;
      }
      
      const budgetData: Partial<Budget> = {
        categoria: selectedCategory.nombre,
        categoriaId: selectedCategory.id,
        limite: parseFloat(limite),
        actual: 0, // Para presupuestos nuevos
        periodo: periodo,
        fechaInicio: startDate,
        fechaFin: endDate,
        notas: notas.trim() || undefined,
        recurrente: isRecurrent,
        frecuenciaRecurrencia: isRecurrent ? recurrenceFrequency : undefined,
        fechaFinRecurrencia: isRecurrent && recurrenceEndDate 
          ? recurrenceEndDate.toISOString().split('T')[0] 
          : undefined
      };
      
      // Añadir información de subcategoría si está seleccionada
      if (selectedSubcategory) {
        budgetData.subcategoriaId = selectedSubcategory.id;
        budgetData.subcategoria = selectedSubcategory.nombre;
      }

      // Guardar presupuesto en almacenamiento local (AsyncStorage)
      if (isEditing && budgetId) {
        await updateBudget(budgetId, budgetData);
      } else {
        await addBudget(budgetData as Budget);
      }
      
      // Añadir prorrateo de presupuestos para períodos mayores a quincenal
      if (periodo !== 'quincenal-1' && periodo !== 'quincenal-2' && selectedCategory) {
        await prorrateBudget(selectedCategory.nombre, parseFloat(limite), periodo);
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      Alert.alert('Error', 'No se pudo guardar el presupuesto');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Arrays para selector de fecha
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Obtener días en un mes para el selector de fecha
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };
  
  // Generar arrays para los selectores de fecha
  const generateYearArray = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year <= currentYear + 10; year++) {
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
  
  // Renderizar selector de período
  const renderPeriodModal = () => (
    <Modal
      visible={showPeriodModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPeriodModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar periodo</Text>
            <TouchableOpacity onPress={() => setShowPeriodModal(false)}>
              <X size={24} color={theme.COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={[
              { id: 'quincenal-1', label: '1ra Quincena' },
              { id: 'quincenal-2', label: '2da Quincena' },
              { id: 'mensual', label: 'Mensual' },
              { id: 'trimestral', label: 'Trimestral' },
              { id: 'anual', label: 'Anual' }
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setPeriodo(item.id as PeriodType);
                  setShowPeriodModal(false);
                  
                  // Reiniciar el estado de aviso al cambiar el período
                  if (item.id !== 'quincenal-1' && item.id !== 'quincenal-2') {
                    setProrationInfoShown(false);
                  }
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  periodo === item.id && styles.modalItemTextSelected
                ]}>
                  {item.label}
                </Text>
                {periodo === item.id && (
                  <Check size={20} color={theme.COLORS.primary.main} />
                )}
              </TouchableOpacity>
            )}
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
            <Text style={styles.modalTitle}>Seleccionar fecha de finalización</Text>
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
  
  // Renderizar opciones de recurrencia
  const renderRecurrenceOptions = () => (
    <View style={styles.recurrenceContainer}>
      <View style={styles.recurrenceSwitchContainer}>
        <Text style={styles.recurrenceLabel}>Presupuesto recurrente</Text>
        <Switch
          value={isRecurrent}
          onValueChange={setIsRecurrent}
          trackColor={{ false: theme.COLORS.grey[300], true: theme.COLORS.primary.light }}
          thumbColor={isRecurrent ? theme.COLORS.primary.main : theme.COLORS.grey[100]}
        />
      </View>

      {isRecurrent && (
        <>
          <View style={styles.recurrenceFrequencyContainer}>
            <Text style={styles.recurrenceLabel}>Frecuencia de recurrencia</Text>
            <View style={styles.frequencyButtonGroup}>
              {[
                { value: 'mensual', label: 'Mensual' },
                { value: 'trimestral', label: 'Trimestral' },
                { value: 'anual', label: 'Anual' }
              ].map((freq) => (
                <TouchableOpacity
                  key={freq.value}
                  style={[
                    styles.frequencyButton,
                    recurrenceFrequency === freq.value && styles.frequencyButtonActive
                  ]}
                  onPress={() => setRecurrenceFrequency(freq.value as any)}
                >
                  <Text style={[
                    styles.frequencyButtonText,
                    recurrenceFrequency === freq.value && styles.frequencyButtonTextActive
                  ]}>
                    {freq.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.endDatePicker}
            onPress={handleDatePickerOpen}
          >
            <Text style={styles.recurrenceLabel}>Fecha de finalización</Text>
            <Text style={styles.endDateText}>
              {recurrenceEndDate 
                ? formatDate(recurrenceEndDate) 
                : 'Seleccionar fecha'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
  
  // Obtener etiqueta para el período seleccionado
  const getPeriodLabel = () => {
    switch (periodo) {
      case 'quincenal-1': return '1ra Quincena';
      case 'quincenal-2': return '2da Quincena';
      case 'mensual': return 'Mensual';
      case 'trimestral': return 'Trimestral';
      case 'anual': return 'Anual';
      default: return 'Seleccionar período';
    }
  };
  
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
            {isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
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
          {/* Categoría y Subcategoría */}
          <EnhancedCategorySelector
            onSelectCategory={handleCategorySelect}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            categoryType="gasto"
            label="Categoría"
            placeholder="Seleccionar categoría"
          />

          {/* Límite de presupuesto */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Límite de presupuesto</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>{CURRENCY_SYMBOL}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={limite}
                onChangeText={setLimite}
                placeholderTextColor={theme.COLORS.grey[400]}
              />
            </View>
          </View>

          {/* Período */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Período</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowPeriodModal(true)}
            >
              <Text style={styles.pickerSelectedText}>
                {getPeriodLabel()}
              </Text>
              <ChevronDown size={20} color={theme.COLORS.grey[500]} />
            </TouchableOpacity>
            
            {/* Información sobre prorrateo */}
            {(periodo === 'mensual' || periodo === 'trimestral' || periodo === 'anual') && (
              <View style={styles.infoContainer}>
                <AlertCircle size={16} color={theme.COLORS.warning.main} style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  El presupuesto {getPeriodLabel().toLowerCase()} se prorrateará automáticamente entre las quincenas correspondientes.
                </Text>
              </View>
            )}
          </View>

          {/* Opciones de recurrencia */}
          {renderRecurrenceOptions()}

          {/* Notas */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Notas (opcional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Añadir notas sobre este presupuesto"
              value={notas}
              onChangeText={setNotas}
              multiline={true}
              numberOfLines={4}
              placeholderTextColor={theme.COLORS.grey[400]}
            />
          </View>
        </ScrollView>

        {/* Modales */}
        {renderPeriodModal()}
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
  inputContainer: {
    marginBottom: theme.SPACING.xl,
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
  },
  currencySymbol: {
    fontSize: theme.FONT_SIZE.xl,
    color: theme.COLORS.text.primary,
    marginRight: theme.SPACING.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: theme.FONT_SIZE.xl,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
    padding: 0,
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
  categoryDot: {
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
    justifyContent: 'space-between',
    padding: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  modalItemText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  modalItemTextSelected: {
    color: theme.COLORS.primary.main,
    fontWeight: "500",
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.warning.light,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.sm,
    marginTop: theme.SPACING.xs,
  },
  infoIcon: {
    marginRight: theme.SPACING.xs,
  },
  infoText: {
    flex: 1,
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.warning.dark,
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
  recurrenceContainer: {
    backgroundColor: theme.COLORS.grey[50],
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.xl,
  },
  recurrenceSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  recurrenceLabel: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  recurrenceFrequencyContainer: {
    marginBottom: theme.SPACING.md,
  },
  frequencyButtonGroup: {
    flexDirection: 'row',
    marginTop: theme.SPACING.sm,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.xs,
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.sm,
    marginRight: theme.SPACING.xs,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: theme.COLORS.primary.main,
  },
  frequencyButtonText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  frequencyButtonTextActive: {
    color: theme.COLORS.common.white,
    fontWeight: "500",
  },
  endDatePicker: {
    backgroundColor: theme.COLORS.grey[200],
    borderRadius: theme.BORDER_RADIUS.sm,
    padding: theme.SPACING.sm,
  },
  endDateText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.primary.main,
    marginTop: theme.SPACING.xs,
  }
});

export default AddBudget;