// src/components/EnhancedCategorySelector.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Search, X, ChevronRight, Plus, ArrowLeft } from 'lucide-react-native';
import theme from '../theme/theme';
import { 
  getCategories, 
  getMainCategories, 
  getSubcategoriesByParentId, 
  Category,
  addCategory
} from '../database/asyncStorageDB';

interface EnhancedCategorySelectorProps {
  onSelectCategory: (category: Category | null, subcategory?: Category | null) => void;
  selectedCategory?: Category | null;
  selectedSubcategory?: Category | null;
  categoryType?: 'ingreso' | 'gasto' | 'all';
  subcategoryRequired?: boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Un selector mejorado para categorías y subcategorías con soporte completo para la jerarquía.
 * Permite la selección obligatoria de subcategorías y facilita la navegación entre niveles.
 */
const EnhancedCategorySelector: React.FC<EnhancedCategorySelectorProps> = ({
  onSelectCategory,
  selectedCategory,
  selectedSubcategory,
  categoryType = 'all',
  subcategoryRequired = false,
  label = 'Categoría',
  placeholder = 'Seleccionar categoría',
  disabled = false
}) => {
  // Estados para categorías y búsqueda
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para modales
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  
  // Estados para creación de categorías/subcategorías
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4BC0C0');
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);
  
  // Opciones de colores
  const colorOptions = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8AC24A', '#607D8B', '#E57373', '#64B5F6',
    '#81C784', '#FFB74D', '#FF8A65', '#9575CD', '#7986CB'
  ];
  
  // Cargar categorías al iniciar
  useEffect(() => {
    loadCategories();
  }, [categoryType]);
  
  // Filtrar categorías cuando cambia la búsqueda
  useEffect(() => {
    filterCategories();
  }, [searchQuery, mainCategories]);
  
  // Cargar subcategorías cuando cambia la categoría seleccionada
  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories(selectedCategory.id);
    }
  }, [selectedCategory]);
  
  // Cargar categorías principales
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      // Obtener solo categorías principales
      const categories = await getMainCategories();
      
      // Filtrar por tipo si es necesario
      const filtered = categoryType !== 'all'
        ? categories.filter(cat => cat.tipo === categoryType)
        : categories;
      
      setMainCategories(filtered);
      setFilteredCategories(filtered);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar subcategorías
  const loadSubcategories = async (categoryId: string) => {
    try {
      setIsLoading(true);
      const subs = await getSubcategoriesByParentId(categoryId);
      setSubcategories(subs);
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
      Alert.alert('Error', 'No se pudieron cargar las subcategorías');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filtrar categorías por búsqueda
  const filterCategories = () => {
    if (!searchQuery) {
      setFilteredCategories(mainCategories);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = mainCategories.filter(cat => 
      cat.nombre.toLowerCase().includes(query)
    );
    
    setFilteredCategories(filtered);
  };
  
  // Manejar selección de categoría
  const handleSelectCategory = async (category: Category) => {
    // Establecer la categoría seleccionada
    onSelectCategory(category, null);
    
    // Cerrar el modal de categorías
    setShowCategoryModal(false);
    
    // Cargar subcategorías
    const subs = await getSubcategoriesByParentId(category.id);
    
    // Si se requiere subcategoría y hay subcategorías disponibles, abrir el modal
    if (subcategoryRequired && subs.length > 0) {
      setShowSubcategoryModal(true);
    } 
    // Si se requiere subcategoría pero no hay ninguna, preguntar si desea crear una
    else if (subcategoryRequired && subs.length === 0) {
      Alert.alert(
        'Sin subcategorías',
        'Esta categoría no tiene subcategorías. ¿Deseas crear una?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              // Deseleccionar la categoría si se cancela y es requerida
              onSelectCategory(null, null);
            }
          },
          {
            text: 'Crear',
            onPress: () => {
              setIsCreatingSubcategory(true);
              setNewCategoryName('');
              setShowSubcategoryModal(true);
            }
          }
        ]
      );
    }
  };
  
  // Manejar selección de subcategoría
  const handleSelectSubcategory = (subcategory: Category) => {
    if (!selectedCategory) return;
    
    onSelectCategory(selectedCategory, subcategory);
    setShowSubcategoryModal(false);
  };
  
  // Crear nueva categoría
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la categoría');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const newCategory = await addCategory({
        nombre: newCategoryName.trim(),
        tipo: categoryType === 'all' ? 'gasto' : categoryType,
        color: newCategoryColor,
        icono: 'tag', // Icono predeterminado
        esSubcategoria: false
      });
      
      // Recargar categorías
      await loadCategories();
      
      // Seleccionar la nueva categoría
      onSelectCategory(newCategory, null);
      
      // Limpiar y cerrar
      setNewCategoryName('');
      setIsCreatingCategory(false);
      setShowCategoryModal(false);
      
      Alert.alert('Éxito', 'Categoría creada correctamente');
    } catch (error) {
      console.error('Error al crear categoría:', error);
      Alert.alert('Error', 'No se pudo crear la categoría');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Crear nueva subcategoría
  const handleCreateSubcategory = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'No hay categoría principal seleccionada');
      return;
    }
    
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la subcategoría');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const newSubcategory = await addCategory({
        nombre: newCategoryName.trim(),
        tipo: selectedCategory.tipo,
        color: newCategoryColor,
        icono: 'tag', // Icono predeterminado
        esSubcategoria: true,
        categoriaPadreId: selectedCategory.id
      });
      
      // Recargar subcategorías
      await loadSubcategories(selectedCategory.id);
      
      // Seleccionar la nueva subcategoría
      onSelectCategory(selectedCategory, newSubcategory);
      
      // Limpiar y cerrar
      setNewCategoryName('');
      setIsCreatingSubcategory(false);
      setShowSubcategoryModal(false);
      
      Alert.alert('Éxito', 'Subcategoría creada correctamente');
    } catch (error) {
      console.error('Error al crear subcategoría:', error);
      Alert.alert('Error', 'No se pudo crear la subcategoría');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Renderizar el contenido principal según el estado
  const renderModalContent = () => {
    if (isCreatingCategory) {
      return renderCreateCategoryForm();
    } else if (isCreatingSubcategory) {
      return renderCreateSubcategoryForm();
    } else if (showSubcategoryModal) {
      return renderSubcategorySelector();
    } else {
      return renderCategorySelector();
    }
  };
  
  // Renderizar selector de categorías
  const renderCategorySelector = () => (
    <>
      <View style={styles.searchContainer}>
        <Search size={20} color={theme.COLORS.grey[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar categorías..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.COLORS.grey[400]}
          autoCapitalize="none"
        />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
          <Text style={styles.loadingText}>Cargando categorías...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => handleSelectCategory(item)}
            >
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                <Text style={styles.categoryName}>{item.nombre}</Text>
              </View>
              <ChevronRight size={18} color={theme.COLORS.grey[400]} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'No se encontraron categorías con ese nombre' 
                  : 'No hay categorías disponibles'}
              </Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                setIsCreatingCategory(true);
                setNewCategoryName('');
              }}
            >
              <Plus size={18} color={theme.COLORS.primary.main} />
              <Text style={styles.createButtonText}>Crear nueva categoría</Text>
            </TouchableOpacity>
          }
        />
      )}
    </>
  );
  
  // Renderizar selector de subcategorías
  const renderSubcategorySelector = () => (
    <>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setShowSubcategoryModal(false);
          setIsCreatingSubcategory(false);
        }}
      >
        <ArrowLeft size={20} color={theme.COLORS.primary.main} />
        <Text style={styles.backButtonText}>Volver a categorías</Text>
      </TouchableOpacity>
      
      <View style={styles.subcategoryHeader}>
        <Text style={styles.subcategoryTitle}>
          Subcategorías de {selectedCategory?.nombre || ''}
        </Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
          <Text style={styles.loadingText}>Cargando subcategorías...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={subcategories}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => handleSelectSubcategory(item)}
              >
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                  <Text style={styles.categoryName}>{item.nombre}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No hay subcategorías disponibles
                </Text>
              </View>
            }
          />
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              setIsCreatingSubcategory(true);
              setNewCategoryName('');
            }}
          >
            <Plus size={18} color={theme.COLORS.primary.main} />
            <Text style={styles.createButtonText}>
              Crear nueva subcategoría
            </Text>
          </TouchableOpacity>
          
          {subcategoryRequired && (
            <View style={styles.requiredNote}>
              <Text style={styles.requiredNoteText}>
                Es necesario seleccionar una subcategoría para esta categoría
              </Text>
            </View>
          )}
        </>
      )}
    </>
  );
  
  // Renderizar formulario de creación de categoría
  const renderCreateCategoryForm = () => (
    <View style={styles.formContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setIsCreatingCategory(false)}
      >
        <ArrowLeft size={20} color={theme.COLORS.primary.main} />
        <Text style={styles.backButtonText}>Volver a categorías</Text>
      </TouchableOpacity>
      
      <Text style={styles.formTitle}>Crear nueva categoría</Text>
      
      <Text style={styles.fieldLabel}>Nombre</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Nombre de la categoría"
        value={newCategoryName}
        onChangeText={setNewCategoryName}
        placeholderTextColor={theme.COLORS.grey[400]}
        autoCapitalize="sentences"
      />
      
      <Text style={styles.fieldLabel}>Color</Text>
      <View style={styles.colorSelector}>
        {colorOptions.map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              newCategoryColor === color && styles.colorOptionSelected
            ]}
            onPress={() => setNewCategoryColor(color)}
          />
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleCreateCategory}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.COLORS.common.white} />
        ) : (
          <Text style={styles.submitButtonText}>Crear categoría</Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  // Renderizar formulario de creación de subcategoría
  const renderCreateSubcategoryForm = () => (
    <View style={styles.formContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setIsCreatingSubcategory(false)}
      >
        <ArrowLeft size={20} color={theme.COLORS.primary.main} />
        <Text style={styles.backButtonText}>Volver a subcategorías</Text>
      </TouchableOpacity>
      
      <Text style={styles.formTitle}>
        Crear subcategoría para {selectedCategory?.nombre || ''}
      </Text>
      
      <Text style={styles.fieldLabel}>Nombre</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Nombre de la subcategoría"
        value={newCategoryName}
        onChangeText={setNewCategoryName}
        placeholderTextColor={theme.COLORS.grey[400]}
        autoCapitalize="sentences"
      />
      
      <Text style={styles.fieldLabel}>Color</Text>
      <View style={styles.colorSelector}>
        {colorOptions.map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              newCategoryColor === color && styles.colorOptionSelected
            ]}
            onPress={() => setNewCategoryColor(color)}
          />
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleCreateSubcategory}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.COLORS.common.white} />
        ) : (
          <Text style={styles.submitButtonText}>Crear subcategoría</Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  // Renderizar el botón de selección de subcategoría
  const renderSubcategoryButton = () => {
    if (!selectedCategory) return null;
    
    const hasSubcategories = subcategories.length > 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.subcategoryButton,
          !hasSubcategories && subcategoryRequired && styles.requiredButton
        ]}
        onPress={() => {
          if (hasSubcategories || subcategoryRequired) {
            setShowSubcategoryModal(true);
          }
        }}
      >
        <Text style={[
          styles.subcategoryButtonText,
          !hasSubcategories && subcategoryRequired && styles.requiredButtonText
        ]}>
          {selectedSubcategory 
            ? `Subcategoría: ${selectedSubcategory.nombre}`
            : hasSubcategories 
              ? subcategoryRequired 
                ? 'Seleccionar subcategoría (requerido)' 
                : 'Seleccionar subcategoría (opcional)'
              : subcategoryRequired 
                ? 'Crear subcategoría (requerido)'
                : 'No hay subcategorías disponibles'
          }
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Modal principal
  const renderModal = () => (
    <Modal
      visible={showCategoryModal || showSubcategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        // Solo permitir cerrar si no es requerida subcategoría
        if (!subcategoryRequired || selectedSubcategory || !showSubcategoryModal) {
          setShowCategoryModal(false);
          setShowSubcategoryModal(false);
          setIsCreatingCategory(false);
          setIsCreatingSubcategory(false);
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isCreatingCategory
                ? 'Crear categoría'
                : isCreatingSubcategory
                  ? 'Crear subcategoría'
                  : showSubcategoryModal
                    ? 'Seleccionar subcategoría'
                    : 'Seleccionar categoría'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                // Solo permitir cerrar si no es requerida subcategoría
                if (!subcategoryRequired || selectedSubcategory || !showSubcategoryModal) {
                  setShowCategoryModal(false);
                  setShowSubcategoryModal(false);
                  setIsCreatingCategory(false);
                  setIsCreatingSubcategory(false);
                }
              }}
            >
              <X size={24} color={theme.COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {renderModalContent()}
          </View>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[styles.selector, disabled && styles.disabledSelector]}
        onPress={() => {
          if (!disabled) {
            setShowCategoryModal(true);
          }
        }}
        disabled={disabled}
      >
        {selectedCategory ? (
          <View style={styles.selectedContainer}>
            <View style={[styles.categoryDot, { backgroundColor: selectedCategory.color }]} />
            <Text style={styles.selectedText}>
              {selectedCategory.nombre}
              {selectedSubcategory && (
                <Text style={styles.subcategoryInfo}>
                  {" › "}{selectedSubcategory.nombre}
                </Text>
              )}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
        <ChevronRight size={20} color={theme.COLORS.grey[500]} />
      </TouchableOpacity>
      
      {/* Botón de subcategoría si hay categoría seleccionada */}
      {selectedCategory && !selectedSubcategory && renderSubcategoryButton()}
      
      {/* Modal */}
      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.SPACING.md,
  },
  label: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.xs,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
  },
  disabledSelector: {
    opacity: 0.6,
  },
  selectedContainer: {
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
  selectedText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  subcategoryInfo: {
    color: theme.COLORS.primary.main,
    fontWeight: "500",
  },
  placeholderText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.grey[400],
  },
  subcategoryButton: {
    marginTop: theme.SPACING.xs,
    paddingVertical: theme.SPACING.xs,
    paddingHorizontal: theme.SPACING.sm,
  },
  subcategoryButtonText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.primary.main,
  },
  requiredButton: {
    backgroundColor: theme.COLORS.warning.light,
    borderRadius: theme.BORDER_RADIUS.sm,
    paddingVertical: theme.SPACING.xs,
    paddingHorizontal: theme.SPACING.sm,
  },
  requiredButtonText: {
    color: theme.COLORS.warning.dark,
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
    maxHeight: '80%',
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
  modalContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.grey[100],
    margin: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: theme.SPACING.sm,
    paddingVertical: theme.SPACING.xs,
  },
  searchIcon: {
    marginRight: theme.SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  listContent: {
    paddingBottom: theme.SPACING.xl,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
    flex: 1,
  },
  loadingContainer: {
    padding: theme.SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.SPACING.md,
    color: theme.COLORS.text.secondary,
    fontSize: theme.FONT_SIZE.md,
  },
  emptyContainer: {
    padding: theme.SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  backButtonText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.primary.main,
    marginLeft: theme.SPACING.xs,
  },
  subcategoryHeader: {
    paddingHorizontal: theme.SPACING.md,
    paddingBottom: theme.SPACING.md,
  },
  subcategoryTitle: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.grey[200],
    margin: theme.SPACING.md,
  },
  createButtonText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.primary.main,
    marginLeft: theme.SPACING.xs,
  },
  requiredNote: {
    padding: theme.SPACING.md,
    backgroundColor: theme.COLORS.warning.light,
    margin: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
  },
  requiredNoteText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.warning.dark,
    textAlign: 'center',
  },
  formContainer: {
    padding: theme.SPACING.md,
  },
  formTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
    marginVertical: theme.SPACING.md,
  },
  fieldLabel: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.xs,
    marginTop: theme.SPACING.md,
  },
  textInput: {
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: theme.SPACING.sm,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: theme.SPACING.xs,
    borderWidth: 1,
    borderColor: theme.COLORS.grey[300],
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: theme.COLORS.primary.main,
  },
  submitButton: {
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.md,
    alignItems: 'center',
    marginTop: theme.SPACING.lg,
  },
  submitButtonText: {
    color: theme.COLORS.common.white,
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
  },
})
export default EnhancedCategorySelector;