// src/components/CategorySelectionModal.tsx
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
import { X, Search, ChevronRight, Plus } from 'lucide-react-native';
import theme from '../theme/theme';
import { CategoryWithChildren, Category } from '../database/asyncStorageDB';

interface CategorySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  categories: CategoryWithChildren[];
  onSelectCategory: (category: Category) => void;
  onSelectSubcategory: (category: Category, subcategory: Category) => void;
  onAddCategory: () => void;
  type?: 'ingreso' | 'gasto' | 'all';
}

const CategorySelectionModal: React.FC<CategorySelectionModalProps> = ({
  visible,
  onClose,
  categories,
  onSelectCategory,
  onSelectSubcategory,
  onAddCategory,
  type = 'all'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithChildren[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Filtrar categorías por tipo y búsqueda
  useEffect(() => {
    let filtered = [...categories];
    
    // Filtrar por tipo
    if (type !== 'all') {
      filtered = filtered.filter(cat => cat.tipo === type);
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      // Buscar en categorías principales
      const matchingMainCategories = filtered.filter(cat => 
        cat.nombre.toLowerCase().includes(query)
      );
      
      // Buscar en subcategorías y mantener las categorías principales
      const matchingSubCategories = filtered.filter(cat => 
        cat.children?.some(subCat => subCat.nombre.toLowerCase().includes(query))
      );
      
      // Combinar resultados únicos
      const combinedResults = [...matchingMainCategories];
      
      matchingSubCategories.forEach(category => {
        if (!combinedResults.some(cat => cat.id === category.id)) {
          // Filtrar solo las subcategorías que coinciden
          const matchingChildren = category.children?.filter(
            subCat => subCat.nombre.toLowerCase().includes(query)
          );
          
          combinedResults.push({
            ...category,
            children: matchingChildren
          });
          
          // Expandir automáticamente categorías con subcategorías que coinciden
          setExpandedCategories(prev => {
            const newSet = new Set(prev);
            newSet.add(category.id);
            return newSet;
          });
        }
      });
      
      filtered = combinedResults;
    }
    
    setFilteredCategories(filtered);
  }, [categories, searchQuery, type]);
  
  // Alternar expansión de categoría
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };
  
  // Seleccionar categoría
  const handleSelectCategory = (category: Category) => {
    setSelectedCategoryId(category.id);
    onSelectCategory(category);
    
    // Si no tiene subcategorías, cerrar el modal
    const mainCategory = categories.find(cat => cat.id === category.id);
    if (!mainCategory?.children || mainCategory.children.length === 0) {
      onClose();
    } else {
      // Expandir para mostrar subcategorías
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.add(category.id);
        return newSet;
      });
    }
  };
  
  // Seleccionar subcategoría
  const handleSelectSubcategory = (subcategory: Category) => {
    const mainCategory = categories.find(cat => 
      cat.children?.some(sub => sub.id === subcategory.id)
    );
    
    if (mainCategory) {
      onSelectSubcategory(mainCategory, subcategory);
      onClose();
    }
  };
  
  // Renderizar elemento de categoría
  const renderCategoryItem = ({ item }: { item: CategoryWithChildren }) => {
    const isExpanded = expandedCategories.has(item.id);
    const isSelected = selectedCategoryId === item.id;
    const hasSubcategories = item.children && item.children.length > 0;
    
    return (
      <View>
        <TouchableOpacity
          style={[
            styles.categoryItem,
            isSelected && styles.selectedCategoryItem
          ]}
          onPress={() => handleSelectCategory(item)}
        >
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
            <Text style={[
              styles.categoryName,
              isSelected && styles.selectedCategoryName
            ]}>
              {item.nombre}
            </Text>
          </View>
          
          {hasSubcategories && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleCategoryExpansion(item.id)}
            >
              <ChevronRight
                size={20}
                color={theme.COLORS.grey[500]}
                style={{
                  transform: [{ rotate: isExpanded ? '90deg' : '0deg' }]
                }}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        
        {/* Subcategorías */}
        {isExpanded && hasSubcategories && (
          <View style={styles.subcategoriesContainer}>
            {item.children?.map(subcategory => (
              <TouchableOpacity
                key={subcategory.id}
                style={styles.subcategoryItem}
                onPress={() => handleSelectSubcategory(subcategory)}
              >
                <View style={[styles.subcategoryDot, { backgroundColor: subcategory.color }]} />
                <Text style={styles.subcategoryName}>{subcategory.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar categoría</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={theme.COLORS.text.primary} />
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
            keyExtractor={(item) => item.id}
            renderItem={renderCategoryItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>
                  No se encontraron categorías
                </Text>
              </View>
            )}
          />
          
          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={onAddCategory}
          >
            <Plus size={18} color={theme.COLORS.common.white} />
            <Text style={styles.addCategoryButtonText}>Nueva categoría</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    backgroundColor: theme.COLORS.common.white,
    borderTopLeftRadius: theme.BORDER_RADIUS.lg,
    borderTopRightRadius: theme.BORDER_RADIUS.lg,
    padding: theme.SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
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
    paddingHorizontal: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
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
    paddingBottom: theme.SPACING.md,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.md,
  },
  selectedCategoryItem: {
    backgroundColor: theme.COLORS.primary.light,
  },
  categoryInfo: {
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
  categoryName: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  selectedCategoryName: {
    fontWeight: "600",
    color: theme.COLORS.primary.main,
  },
  expandButton: {
    padding: theme.SPACING.xs,
  },
  subcategoriesContainer: {
    marginLeft: theme.SPACING.xl,
    borderLeftWidth: 1,
    borderLeftColor: theme.COLORS.grey[300],
    paddingLeft: theme.SPACING.sm,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.sm,
  },
  subcategoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.SPACING.sm,
  },
  subcategoryName: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.primary,
  },
  emptyListContainer: {
    padding: theme.SPACING.xl,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.md,
    marginTop: theme.SPACING.sm,
  },
  addCategoryButtonText: {
    color: theme.COLORS.common.white,
    fontWeight: "500",
    marginLeft: theme.SPACING.xs,
  },
});

export default CategorySelectionModal;