// src/components/CategorySelector.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput
} from 'react-native';
import { ChevronDown, X, Search, ChevronRight, Filter } from 'lucide-react-native';
import theme from '../theme/theme';
import { Category, getCategories, getCategoriesByType, getSubcategories } from '../database/asyncStorageDB';

interface CategorySelectorProps {
  onCategorySelect: (category: Category) => void;
  selectedCategory: Category | null;
  categoryType?: 'ingreso' | 'gasto' | 'all';
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  onCategorySelect,
  selectedCategory,
  categoryType = 'all',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);

  // Cargar categorías
  useEffect(() => {
    loadCategories();
  }, [categoryType]);

  // Filtrar categorías cuando cambie la búsqueda
  useEffect(() => {
    filterCategories();
  }, [searchQuery, parentCategories]);

  const loadCategories = async () => {
    try {
      // Cargar categorías principales
      const parents = await getCategoriesByType('parent');
      
      // Filtrar por tipo si es necesario
      const filtered = categoryType !== 'all'
        ? parents.filter(cat => cat.tipo === categoryType)
        : parents;
      
      setParentCategories(filtered);
      setFilteredCategories(filtered);
      
      // Verificar si la categoría seleccionada es una subcategoría
      if (selectedCategory && selectedCategory.categoriaPadreId) {
        const parentCategory = (await getCategories()).find(
          cat => cat.id === selectedCategory.categoriaPadreId
        );
        if (parentCategory) {
          setSelectedParent(parentCategory);
          const subs = await getSubcategories(parentCategory.id);
          setSubcategories(subs);
        }
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const filterCategories = () => {
    if (!searchQuery) {
      setFilteredCategories(parentCategories);
      return;
    }

    const filtered = parentCategories.filter(category =>
      category.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredCategories(filtered);
  };

  const handleParentCategoryPress = async (category: Category) => {
    try {
      setSelectedParent(category);
      
      // Cargar subcategorías
      const subs = await getSubcategories(category.id);
      setSubcategories(subs);
      
      // Si no hay subcategorías, seleccionar la categoría principal
      if (subs.length === 0) {
        onCategorySelect(category);
        setShowModal(false);
      } else {
        setShowSubcategories(true);
      }
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
    }
  };

  const handleSubcategoryPress = (category: Category) => {
    onCategorySelect(category);
    setShowModal(false);
    setShowSubcategories(false);
  };

  const handleBackPress = () => {
    setShowSubcategories(false);
  };

  const renderHeader = () => (
    <View style={styles.searchContainer}>
      <Search size={20} color={theme.COLORS.grey[400]} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar categorías..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={theme.COLORS.grey[400]}
      />
    </View>
  );

  const renderParentCategories = () => (
    <FlatList
      data={filteredCategories}
      keyExtractor={item => item.id}
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.categoryItem}
          onPress={() => handleParentCategoryPress(item)}
        >
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: item.color }]} />
            <Text style={styles.categoryName}>{item.nombre}</Text>
          </View>
          <ChevronRight size={18} color={theme.COLORS.grey[400]} />
        </TouchableOpacity>
      )}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No se encontraron categorías</Text>
        </View>
      )}
    />
  );

  const renderSubcategories = () => (
    <>
      <View style={styles.subcategoryHeader}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.subcategoryTitle}>
          {selectedParent ? selectedParent.nombre : 'Subcategorías'}
        </Text>
      </View>
      <FlatList
        data={subcategories}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleSubcategoryPress(item)}
          >
            <View style={styles.categoryLeft}>
              <View style={[styles.categoryIcon, { backgroundColor: item.color }]} />
              <Text style={styles.categoryName}>{item.nombre}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay subcategorías disponibles</Text>
            <TouchableOpacity
              style={styles.useParentButton}
              onPress={() => {
                if (selectedParent) {
                  onCategorySelect(selectedParent);
                  setShowModal(false);
                  setShowSubcategories(false);
                }
              }}
            >
              <Text style={styles.useParentButtonText}>
                Usar categoría principal
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowModal(true)}
      >
        {selectedCategory ? (
          <View style={styles.selectedCategory}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: selectedCategory.color },
              ]}
            />
            <Text style={styles.selectedCategoryText}>
              {selectedCategory.nombre}
              {selectedCategory.categoriaPadreId && selectedParent && (
                <Text style={styles.parentInfo}>
                  {` (${selectedParent.nombre})`}
                </Text>
              )}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Seleccionar categoría</Text>
        )}
        <ChevronDown size={20} color={theme.COLORS.grey[500]} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowModal(false);
          setShowSubcategories(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showSubcategories
                  ? 'Seleccionar subcategoría'
                  : 'Seleccionar categoría'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setShowSubcategories(false);
                }}
              >
                <X size={24} color={theme.COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            {showSubcategories ? renderSubcategories() : renderParentCategories()}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  parentInfo: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  placeholder: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.grey[400],
  },
  categoryIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: theme.SPACING.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.COLORS.common.white,
    borderTopLeftRadius: theme.BORDER_RADIUS.lg,
    borderTopRightRadius: theme.BORDER_RADIUS.lg,
    height: '80%',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.sm,
    margin: theme.SPACING.md,
  },
  searchIcon: {
    marginRight: theme.SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
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
  },
  categoryName: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  emptyContainer: {
    padding: theme.SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.md,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  backButton: {
    marginRight: theme.SPACING.md,
  },
  backButtonText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.primary.main,
  },
  subcategoryTitle: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
  },
  useParentButton: {
    backgroundColor: theme.COLORS.primary.light,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
  },
  useParentButtonText: {
    color: theme.COLORS.primary.main,
    fontWeight: "500",
  },
});

export default CategorySelector;