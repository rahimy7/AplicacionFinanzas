// src/screens/ImprovedAddBudgetScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import {
  ArrowLeft,
  Check,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react-native';
import theme from '../theme/theme';
import { NavigationProps } from '../types/navigation';
import { CURRENCY_SYMBOL } from '../constants/currency';
import EnhancedCategorySelector from '../components/EnhancedCategorySelector';
import {
  addBudget,
  updateBudget,
  getBudgets,
  getCategories,
  getSubcategoriesByParentId,
  prorrateBudget,
  Budget,
  Category
} from '../database/asyncStorageDB';

// Tipos de período
type PeriodType = 'quincenal-1' | 'quincenal-2' | 'mensual' | 'trimestral' | 'anual';
type RecurrenceFrequency = 'mensual' | 'trimestral' | 'anual';

// Componente para la pantalla mejorada de añadir/editar presupuesto
const ImprovedAddBudgetScreen: React.FC<NavigationProps<'AddBudget'>> = ({ navigation, route }) => {
  // Estados para formulario
  const [limite, setLimite] = useState('');
  const [periodo, setPeriodo] = useState<PeriodType>('mensual');
  const [notas, setNotas] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  
  // Estado para categoría y subcategoría
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null);
  
  // Estado para modo edición
  const [isEditing, setIsEditing] = useState(false);
  const [budgetId, setBudgetId] = useState<string | null>(null);
  
  // Estado para recurrencia
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('mensual');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false);
  
  // Estado para el selector de fecha
  const [tempDate, setTempDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Estado para información mostrada sobre prorrateo
  const [prorationInfoShown, setProrationInfoShown] = useState(false);
  
  // Cargar datos iniciales o configurar modo edición
  useEffect(() => {
    if (route.params?.budget) {
      setupEditMode(route.params.budget);
    }
  }, [route.params]);
  
  // Mostrar información de prorrateo si es necesario
  useEffect(() => {
    if ((periodo === 'mensual' || periodo === 'trimestral' || periodo === 'anual') && !prorationInfoShown) {
      Alert.alert(
        "Información",
        `Al crear un presupuesto ${periodo}, el monto se prorrateará automáticamente entre las quincenas correspondientes.`,
        [{ text: "Entendido", onPress: () => setProrationInfoShown(true) }]
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
    
    // Configurar recurrencia
    if (budget.recurrente) {
      setIsRecurrent(true);
      setRecurrenceFrequency(budget.frecuenciaRecurrencia || 'mensual');
      
      if (budget.fechaFinRecurrencia) {
        setRecurrenceEndDate(new Date(budget.fechaFinRecurrencia));
      }
    }
    
    // La categoría y subcategoría se establecerán a través del componente EnhancedCategorySelector
    // Esto es manejado por el componente en sí
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
  
  // Formatear fecha para mostrar
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
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
  
  // Guardar presupuesto
  const handleSave = async () => {
    try {
      // Validaciones
      if (!selectedCategory) {
        Alert.alert('Error', 'Por favor selecciona una categoría');
        return;
      }
      
      if (!limite || isNaN(parseFloat(limite)) || parseFloat(limite) <= 0) {
        Alert.alert('Error', 'Por favor ingresa un límite válido');
        return;
      }
      
      // Si es presupuesto recurrente, validar fecha
      if (isRecurrent && !recurrenceEndDate) {
        Alert.alert('Error', 'Por favor selecciona una fecha de finalización de recurrencia');
        return;
      }
      
      setIsLoading(true);
      
      // Calcular fechas de inicio y fin
      const { startDate, endDate } = calculateDates();
      
      // Preparar datos del presupuesto
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
      
      // Guardar presupuesto
      if (isEditing && budgetId) {
        await updateBudget(budgetId, budgetData);
      } else {
        await addBudget(budgetData as Budget);
      }
      
      // Añadir prorrateo de presupuestos para períodos mayores a quincenal
      if (periodo !== 'quincenal-1' && periodo !== 'quincenal-2' && selectedCategory) {
        await prorrateBudget(selectedCategory.nombre, parseFloat(limite), periodo, notas);
      }
      
      // Volver a la pantalla anterior
      navigation.goBack();
      
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      Alert.alert('Error', 'No se pudo guardar el presupuesto');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Renderizar modal de selección de período
  const renderPeriodModal = () => (
    <Modal
      visible={showPeriodModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPeriodModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar período</Text>
            <TouchableOpacity 
              onPress={() => setShowPeriodModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color={theme.COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {[
              { id: 'quincenal-1', label: '1ra Quincena' },
              { id: 'quincenal-2', label: '2da Quincena' },
              { id: 'mensual', label: 'Mensual' },
              { id: 'trimestral', label: 'Trimestral' },
              { id: 'anual', label: 'Anual' }
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.modalItem,
                  periodo === item.id && styles.modalItemSelected
                ]}
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
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
  
  // Renderizar modal para selección de fecha
  const renderDatePickerModal = () => (
    <Modal
      visible={showDatePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar fecha</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(false)}
              style={styles.closeButton}
            >
              <X size={24} color={theme.COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.datePickerContainer}>
            {/* Aquí iría la implementación del selector de fecha */}
            {/* Simplificado por ahora */}
            <Text style={styles.datePickerText}>
              La implementación completa del selector de fecha requiere componentes nativos.
            </Text>
            
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                // Establecer la fecha 1 año en el futuro
                const nextYear = new Date();
                nextYear.setFullYear(nextYear.getFullYear() + 1);
                
                setRecurrenceEndDate(nextYear);
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.datePickerButtonText}>
                Establecer 1 año en el futuro
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.COLORS.common.white} />
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
            <ActivityIndicator size="small" color={theme.COLORS.common.white} />
          ) : (
            <Check size={24} color={theme.COLORS.common.white} />
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Categoría y subcategoría */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Categoría</Text>
          
          <EnhancedCategorySelector
            onSelectCategory={handleCategorySelect}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            categoryType="gasto"
            label=""
            placeholder="Seleccionar categoría"
          />
        </View>
        
        {/* Límite de presupuesto */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Límite de presupuesto</Text>
          
          <View style={styles.amountInputContainer}>
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
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Período</Text>
          
          <TouchableOpacity
            style={styles.periodSelector}
            onPress={() => setShowPeriodModal(true)}
          >
            <Text style={styles.periodSelectorText}>{getPeriodLabel()}</Text>
            <ChevronDown size={20} color={theme.COLORS.text.secondary} />
          </TouchableOpacity>
          
          {(periodo === 'mensual' || periodo === 'trimestral' || periodo === 'anual') && (
            <View style={styles.infoContainer}>
              <AlertCircle size={16} color={theme.COLORS.info.main} />
              <Text style={styles.infoText}>
                Los presupuestos {periodo}es se prorratean automáticamente entre quincenas.
              </Text>
            </View>
          )}
        </View>
        
        {/* Opciones de recurrencia */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Opciones de recurrencia</Text>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Presupuesto recurrente</Text>
            <Switch
              value={isRecurrent}
              onValueChange={setIsRecurrent}
              trackColor={{ false: theme.COLORS.grey[300], true: theme.COLORS.primary.light }}
              thumbColor={isRecurrent ? theme.COLORS.primary.main : theme.COLORS.grey[100]}
            />
          </View>
          
          {isRecurrent && (
            <>
              <Text style={styles.fieldLabel}>Frecuencia de recurrencia</Text>
              <View style={styles.frequencySelector}>
                {['mensual', 'trimestral', 'anual'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      recurrenceFrequency === freq && styles.frequencyButtonSelected
                    ]}
                    onPress={() => setRecurrenceFrequency(freq as RecurrenceFrequency)}
                  >
                    <Text style={[
                      styles.frequencyButtonText,
                      recurrenceFrequency === freq && styles.frequencyButtonTextSelected
                    ]}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.fieldLabel}>Fecha de finalización</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateSelectorText}>
                  {recurrenceEndDate 
                    ? formatDate(recurrenceEndDate) 
                    : 'Seleccionar fecha'
                  }
                </Text>
                <Calendar size={20} color={theme.COLORS.text.secondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
        
        {/* Notas */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Notas (opcional)</Text>
          
          <TextInput
            style={styles.notesInput}
            placeholder="Añade notas o recordatorios para este presupuesto..."
            multiline={true}
            numberOfLines={4}
            value={notas}
            onChangeText={setNotas}
            placeholderTextColor={theme.COLORS.grey[400]}
          />
        </View>
      </ScrollView>
      
      {/* Modales */}
      {renderPeriodModal()}
      {renderDatePickerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.COLORS.primary.main,
    paddingVertical: theme.SPACING.md,
    paddingHorizontal: theme.SPACING.md,
  },
  headerTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
    color: theme.COLORS.common.white,
  },
  backButton: {
    padding: theme.SPACING.xs,
  },
  saveButton: {
    padding: theme.SPACING.xs,
  },
  content: {
    flex: 1,
    padding: theme.SPACING.md,
  },
  
  // Secciones del formulario
  formSection: {
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    ...theme.SHADOWS.md,
  },
  sectionTitle: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
    marginBottom: theme.SPACING.md,
  },
  
  // Entrada de monto
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
  },
  currencySymbol: {
    fontSize: theme.FONT_SIZE.xl,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
    marginRight: theme.SPACING.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: theme.FONT_SIZE.xl,
    color: theme.COLORS.text.primary,
    fontWeight: "600",
  },
  
  // Selector de período
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
  },
  periodSelectorText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.info.light,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.sm,
    marginTop: theme.SPACING.sm,
  },
  infoText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.info.dark,
    marginLeft: theme.SPACING.xs,
    flex: 1,
  },
  
  // Opciones de recurrencia
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.SPACING.md,
  },
  switchLabel: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  fieldLabel: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.xs,
    marginTop: theme.SPACING.sm,
  },
  frequencySelector: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.sm,
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    alignItems: 'center',
    marginRight: theme.SPACING.sm,
  },
  frequencyButtonSelected: {
    backgroundColor: theme.COLORS.primary.light,
  },
  frequencyButtonText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  frequencyButtonTextSelected: {
    color: theme.COLORS.primary.main,
    fontWeight: "500",
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
  },
  dateSelectorText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  
  // Notas
  notesInput: {
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    textAlignVertical: 'top',
    minHeight: 100,
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  
  // Modales
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
  closeButton: {
    padding: theme.SPACING.xs,
  },
  modalContent: {
    padding: theme.SPACING.sm,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  modalItemSelected: {
    backgroundColor: theme.COLORS.primary.light,
  },
  modalItemText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  modalItemTextSelected: {
    color: theme.COLORS.primary.main,
    fontWeight: "600",
  },
  
  // Selector de fecha modal
  datePickerContainer: {
    padding: theme.SPACING.xl,
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: theme.SPACING.lg,
  },
  datePickerButton: {
    backgroundColor: theme.COLORS.primary.main,
    paddingVertical: theme.SPACING.md,
    paddingHorizontal: theme.SPACING.lg,
    borderRadius: theme.BORDER_RADIUS.md,
  },
  datePickerButtonText: {
    color: theme.COLORS.common.white,
    fontWeight: "500",
    fontSize: theme.FONT_SIZE.md,
  },
});

export default ImprovedAddBudgetScreen;