// src/components/CategoryHierarchySelector.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { Search, X, ChevronDown, ChevronRight } from 'lucide-react-native';
import theme from '../theme/theme';
import { getMainCategories, getSubcategoriesByParentId, Category } from '../database/asyncStorageDB';

interface CategoryHierarchySelectorProps {
  onSelectCategory: (category: Category, subcategory?: Category) => void;
  selectedCategory?: Category | null;
  selectedSubcategory?: Category | null;
  categoryType?: 'ingreso' | 'gasto' | 'all';
  requiredSubcategory?: boolean;
  label?: string;
  placeholder?: string;
}

/**
 * A component for selecting categories and subcategories in a hierarchical manner.
 * This component works with the category/subcategory structure and ensures proper
 * parent-child relationship selection.
 */
const CategoryHierarchySelector: React.FC<CategoryHierarchySelectorProps> = ({
  onSelectCategory,
  selectedCategory,
  selectedSubcategory,
  categoryType = 'all',
  requiredSubcategory = false,
  label = 'Categoría',
  placeholder = 'Seleccionar categoría'
}) => {
  // State for categories and subcategories
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  
  // State for modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [categoryType]);
  
  // Filter categories when search query changes
  useEffect(() => {
    filterCategories();
  }, [searchQuery, mainCategories]);
  
  // Load subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories(selectedCategory.id);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory]);
  
  const loadCategories = async () => {
    try {
      // Get main categories
      const categories = await getMainCategories();
      
      // Filter by type if needed
      const filtered = categoryType !== 'all'
        ? categories.filter(cat => cat.tipo === categoryType)
        : categories;
      
      setMainCategories(filtered);
      setFilteredCategories(filtered);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  
  const loadSubcategories = async (categoryId: string) => {
    try {
      const subs = await getSubcategoriesByParentId(categoryId);
      setSubcategories(subs);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };
  
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
  
  const handleSelectCategory = async (category: Category) => {
    // Check if this category has subcategories
    const subs = await getSubcategoriesByParentId(category.id);
    
    // Set the selected category
    onSelectCategory(category);
    setShowCategoryModal(false);
    
    // If category has subcategories and we require a subcategory selection,
    // show the subcategory modal
    if (subs.length > 0 && requiredSubcategory) {
      setShowSubcategoryModal(true);
    }
  };
  
  const handleSelectSubcategory = (subcategory: Category) => {
    if (!selectedCategory) return;
    
    onSelectCategory(selectedCategory, subcategory);
    setShowSubcategoryModal(false);
  };
  
  const handleClearSubcategory = () => {
    if (selectedCategory) {
      onSelectCategory(selectedCategory);
      setShowSubcategoryModal(false);
    }
  };
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Main category selector */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowCategoryModal(true)}
      >
        {selectedCategory ? (
          <View style={styles.selectedContainer}>
            <View style={[styles.colorDot, { backgroundColor: selectedCategory.color }]} />
            <Text style={styles.selectedText}>
              {selectedCategory.nombre}
              {selectedSubcategory && (
                <>
                  <Text style={styles.separator}> › </Text>
                  <Text style={styles.subcategoryText}>{selectedSubcategory.nombre}</Text>
                </>
              )}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
        <ChevronDown size={20} color={theme.COLORS.grey[500]} />
      </TouchableOpacity>
      
      {/* Show subcategory button if we have a selected category with subcategories */}
      {selectedCategory && subcategories.length > 0 && !selectedSubcategory && (
        <TouchableOpacity
          style={styles.subcategoryButton}
          onPress={() => setShowSubcategoryModal(true)}
        >
          <Text style={styles.subcategoryButtonText}>
            {requiredSubcategory ? 'Seleccionar subcategoría (requerido)' : 'Seleccionar subcategoría (opcional)'}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Main category modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar categoría</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <X size={20} color={theme.COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            
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
            
            <FlatList
              data={filteredCategories}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => handleSelectCategory(item)}
                >
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                    <Text style={styles.categoryName}>{item.nombre}</Text>
                  </View>
                  <ChevronRight size={20} color={theme.COLORS.grey[400]} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No se encontraron categorías</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
      
      {/* Subcategory modal */}
      <Modal
        visible={showSubcategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!requiredSubcategory || selectedSubcategory) {
            setShowSubcategoryModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Subcategorías de {selectedCategory?.nombre}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  if (!requiredSubcategory || selectedSubcategory) {
                    setShowSubcategoryModal(false);
                  }
                }}
              >
                <X size={20} color={theme.COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            
            {/* Option to select no subcategory if not required */}
            {!requiredSubcategory && (
              <TouchableOpacity
                style={styles.noSubcategoryButton}
                onPress={handleClearSubcategory}
              >
                <Text style={styles.noSubcategoryText}>
                  Usar solo la categoría principal (sin subcategoría)
                </Text>
              </TouchableOpacity>
            )}
            
            <FlatList
              data={subcategories}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => handleSelectSubcategory(item)}
                >
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                    <Text style={styles.categoryName}>{item.nombre}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No hay subcategorías disponibles</Text>
                </View>
              }
            />
            
            {requiredSubcategory && (
              <View style={styles.requiredNote}>
                <Text style={styles.requiredNoteText}>
                  Es necesario seleccionar una subcategoría para esta categoría
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.SPACING.sm,
  },
  selectedText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  separator: {
    color: theme.COLORS.grey[400],
  },
  subcategoryText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.COLORS.common.white,
    borderTopLeftRadius: theme.BORDER_RADIUS.lg,
    borderTopRightRadius: theme.BORDER_RADIUS.lg,
    height: '70%',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.grey[100],
    margin: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: theme.SPACING.sm,
  },
  searchIcon: {
    marginRight: theme.SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: theme.FONT_SIZE.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  noSubcategoryButton: {
    padding: theme.SPACING.md,
    backgroundColor: theme.COLORS.grey[100],
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
  },
  noSubcategoryText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.primary.main,
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
  }
});

export default CategoryHierarchySelector;