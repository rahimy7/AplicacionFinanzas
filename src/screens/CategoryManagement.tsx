// src/screens/CategoryManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  SafeAreaView
} from 'react-native';
import { ArrowLeft, Plus, Edit2, ChevronRight, X } from 'lucide-react-native';
import theme from '../theme/theme';
import { NavigationProps } from '../types/navigation';
import {
  getCategories,
  addCategory,
  Category,
  getSubcategoriesByParentId
} from '../database/asyncStorageDB';

const CategoryManagement: React.FC<NavigationProps<'CategoryManagement'>> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  
  // Estado para modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estado para el formulario
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'ingreso' | 'gasto'>('gasto');
  const [categoryColor, setCategoryColor] = useState('#FF6384');
  const [categoryIcon, setCategoryIcon] = useState('tag');
  
  // Cargar categorías al iniciar
  useEffect(() => {
    loadCategories();
  }, []);
  
  // Cargar subcategorías cuando se selecciona una categoría
  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories(selectedCategory.id);
    }
  }, [selectedCategory]);
  
  const loadCategories = async () => {
    try {
      const allCategories = await getCategories();
      setCategories(allCategories);
      
      // Filtrar solo categorías principales
      const main = allCategories.filter(cat => !cat.esSubcategoria);
      setMainCategories(main);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    }
  };
  
  const loadSubcategories = async (categoryId: string) => {
    try {
      const subs = await getSubcategoriesByParentId(categoryId);
      setSubcategories(subs);
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
    }
  };
  
  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la categoría');
      return;
    }
    
    try {
      const newCategory = await addCategory({
        nombre: categoryName.trim(),
        tipo: categoryType,
        color: categoryColor,
        icono: categoryIcon,
        esSubcategoria: false
      });
      
      // Actualizar la lista de categorías
      await loadCategories();
      
      // Limpiar el formulario
      setCategoryName('');
      setCategoryType('gasto');
      
      // Cerrar el modal
      setShowAddModal(false);
      
      Alert.alert('Éxito', 'Categoría creada correctamente');
    } catch (error) {
      console.error('Error al crear categoría:', error);
      Alert.alert('Error', 'No se pudo crear la categoría');
    }
  };
  
  const handleAddSubcategory = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'No hay categoría principal seleccionada');
      return;
    }
    
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la subcategoría');
      return;
    }
    
    try {
      const newSubcategory = await addCategory({
        nombre: categoryName.trim(),
        tipo: selectedCategory.tipo, // Heredar el tipo de la categoría padre
        color: categoryColor,
        icono: categoryIcon,
        esSubcategoria: true,
        categoriaPadreId: selectedCategory.id
      });
      
      // Actualizar la lista de subcategorías
      await loadSubcategories(selectedCategory.id);
      
      // Limpiar el formulario
      setCategoryName('');
      
      // Cerrar el modal
      setShowSubcategoryModal(false);
      
      Alert.alert('Éxito', 'Subcategoría creada correctamente');
    } catch (error) {
      console.error('Error al crear subcategoría:', error);
      Alert.alert('Error', 'No se pudo crear la subcategoría');
    }
  };
  
  // Colores para elegir
  const colorOptions = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8AC24A', '#607D8B', '#E57373', '#64B5F6'
  ];
  
  // Renderizar modal para añadir categoría principal
  const renderAddCategoryModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Categoría</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color={theme.COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.textInput}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="Ej. Transporte"
            />
            
            <Text style={styles.inputLabel}>Tipo</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  categoryType === 'gasto' && styles.activeTypeButton
                ]}
                onPress={() => setCategoryType('gasto')}
              >
                <Text style={categoryType === 'gasto' ? styles.activeTypeText : styles.typeText}>
                  Gasto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  categoryType === 'ingreso' && styles.activeTypeButton
                ]}
                onPress={() => setCategoryType('ingreso')}
              >
                <Text style={categoryType === 'ingreso' ? styles.activeTypeText : styles.typeText}>
                  Ingreso
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorSelector}>
              {colorOptions.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    categoryColor === color && styles.selectedColorOption
                  ]}
                  onPress={() => setCategoryColor(color)}
                />
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddCategory}
            >
              <Text style={styles.addButtonText}>Crear Categoría</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  // Renderizar modal para añadir subcategoría
  const renderAddSubcategoryModal = () => (
    <Modal
      visible={showSubcategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSubcategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Nueva Subcategoría para {selectedCategory?.nombre}
            </Text>
            <TouchableOpacity onPress={() => setShowSubcategoryModal(false)}>
              <X size={24} color={theme.COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.textInput}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="Ej. Metro"
            />
            
            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorSelector}>
              {colorOptions.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    categoryColor === color && styles.selectedColorOption
                  ]}
                  onPress={() => setCategoryColor(color)}
                />
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddSubcategory}
            >
              <Text style={styles.addButtonText}>Crear Subcategoría</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  // Renderizar categorías principales
  const renderMainCategories = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categorías</Text>
        <TouchableOpacity
          style={styles.addCategoryButton}
          onPress={() => {
            setCategoryName('');
            setCategoryType('gasto');
            setCategoryColor('#FF6384');
            setShowAddModal(true);
          }}
        >
          <Plus size={20} color={theme.COLORS.common.white} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={mainCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => {
              setSelectedCategory(item);
              loadSubcategories(item.id);
            }}
          >
            <View style={styles.categoryItemContent}>
              <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
              <Text style={styles.categoryName}>{item.nombre}</Text>
              <View style={styles.categoryTypeTag}>
                <Text style={styles.categoryTypeText}>
                  {item.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.COLORS.grey[400]} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
  
  // Renderizar subcategorías
  const renderSubcategories = () => {
    if (!selectedCategory) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subcategorías de {selectedCategory.nombre}</Text>
          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={() => {
              setCategoryName('');
              setCategoryColor('#FF6384');
              setShowSubcategoryModal(true);
            }}
          >
            <Plus size={20} color={theme.COLORS.common.white} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedCategory(null)}
        >
          <ArrowLeft size={20} color={theme.COLORS.text.primary} />
          <Text style={styles.backButtonText}>Volver a categorías</Text>
        </TouchableOpacity>
        
        {subcategories.length > 0 ? (
          <FlatList
            data={subcategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.subcategoryItem}>
                <View style={styles.categoryItemContent}>
                  <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                  <Text style={styles.categoryName}>{item.nombre}</Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    // Implementar edición de subcategoría
                    Alert.alert('En desarrollo', 'Edición de subcategorías próximamente');
                  }}
                >
                  <Edit2 size={18} color={theme.COLORS.primary.main} />
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No hay subcategorías para {selectedCategory.nombre}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Administrar Categorías</Text>
      </View>
      
      {selectedCategory ? renderSubcategories() : renderMainCategories()}
      
      {renderAddCategoryModal()}
      {renderAddSubcategoryModal()}
    </SafeAreaView>
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
    padding: theme.SPACING.md,
    backgroundColor: theme.COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  headerBackButton: {
    marginRight: theme.SPACING.sm,
  },
  headerTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
  },
  section: {
    flex: 1,
    padding: theme.SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  sectionTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
  },
  addCategoryButton: {
    backgroundColor: theme.COLORS.primary.main,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.COLORS.common.white,
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    marginBottom: theme.SPACING.sm,
    ...theme.SHADOWS.sm,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: theme.SPACING.sm,
  },
  categoryName: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
    flex: 1,
  },
  categoryTypeTag: {
    backgroundColor: theme.COLORS.grey[200],
    paddingHorizontal: theme.SPACING.sm,
    paddingVertical: theme.SPACING.xs / 2,
    borderRadius: theme.BORDER_RADIUS.sm,
    marginLeft: theme.SPACING.sm,
  },
  categoryTypeText: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.text.secondary,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.COLORS.common.white,
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    marginBottom: theme.SPACING.sm,
    ...theme.SHADOWS.sm,
  },
  editButton: {
    padding: theme.SPACING.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  backButtonText: {
    marginLeft: theme.SPACING.xs,
    color: theme.COLORS.text.primary,
    fontSize: theme.FONT_SIZE.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.SPACING.xl,
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    ...theme.SHADOWS.sm,
  },
  emptyStateText: {
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    ...theme.SHADOWS.lg,
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
    fontWeight: '600',
    color: theme.COLORS.text.primary,
  },
  modalContent: {
    padding: theme.SPACING.md,
  },
  inputLabel: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: '500',
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.xs,
    marginTop: theme.SPACING.sm,
  },
  textInput: {
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.COLORS.grey[300],
    marginRight: theme.SPACING.xs,
  },
  activeTypeButton: {
    backgroundColor: theme.COLORS.primary.main,
    borderColor: theme.COLORS.primary.main,
  },
  typeText: {
    color: theme.COLORS.text.primary,
  },
  activeTypeText: {
    color: theme.COLORS.common.white,
    fontWeight: '500',
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
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: theme.COLORS.text.primary,
  },
  addButton: {
    backgroundColor: theme.COLORS.primary.main,
    paddingVertical: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: theme.SPACING.lg,
  },
  addButtonText: {
    color: theme.COLORS.common.white,
    fontSize: theme.FONT_SIZE.md,
    fontWeight: '600',
  },
});

export default CategoryManagement