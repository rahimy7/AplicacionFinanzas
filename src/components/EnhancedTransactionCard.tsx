

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CreditCard, Tag } from 'lucide-react-native';
import theme from '../theme/theme';
import { CURRENCY_SYMBOL } from '../constants/currency';
import { getCategories, Category } from '../database/asyncStorageDB';

interface EnhancedTransactionCardProps {
  id: string | number;
  concepto: string;
  categoria: string;
  categoriaId?: string;
  subcategoria?: string;
  subcategoriaId?: string;
  monto: number;
  fecha: string;
  onPress?: () => void;
}

const EnhancedTransactionCard: React.FC<EnhancedTransactionCardProps> = ({
  id,
  concepto,
  categoria,
  categoriaId,
  subcategoria,
  subcategoriaId,
  monto,
  fecha,
  onPress
}) => {
  const [mainCategory, setMainCategory] = useState<Category | null>(null);
  const [subcategoryData, setSubcategoryData] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load category information
  useEffect(() => {
    const loadCategoryInfo = async () => {
      try {
        setIsLoading(true);
        const allCategories = await getCategories();
        
        // If we have subcategoryId, find both subcategory and main category
        if (subcategoriaId) {
          const subcat = allCategories.find(c => c.id === subcategoriaId);
          if (subcat && subcat.categoriaPadreId) {
            setSubcategoryData(subcat);
            
            // Find parent category
            const parent = allCategories.find(c => c.id === subcat.categoriaPadreId);
            if (parent) {
              setMainCategory(parent);
            }
          }
        } 
        // If we have categoriaId but no subcategoryId
        else if (categoriaId) {
          const cat = allCategories.find(c => c.id === categoriaId);
          if (cat) {
            setMainCategory(cat);
          }
        }
        // Legacy support - find by name
        else if (categoria) {
          const cat = allCategories.find(c => c.nombre === categoria);
          if (cat) {
            setMainCategory(cat);
          }
        }
      } catch (error) {
        console.error('Error loading category information:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCategoryInfo();
  }, [categoriaId, subcategoriaId, categoria]);

  // Get appropriate icon for the category
  const getCategoryIcon = () => {
    return <Tag size={20} color={theme.COLORS.grey[600]} />;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        { backgroundColor: mainCategory?.color || theme.COLORS.grey[200] }
      ]}>
        {getCategoryIcon()}
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.mainInfo}>
          <Text style={styles.concepto}>{concepto}</Text>
          <Text style={[
            styles.monto,
            monto > 0 ? styles.montoPositivo : styles.montoNegativo
          ]}>
            {monto > 0 ? '+' : ''}{CURRENCY_SYMBOL}{Math.abs(monto).toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.secondaryInfo}>
          {/* Show category hierarchy */}
          <View style={styles.categoryInfo}>
            {isLoading ? (
              <Text style={styles.categoria}>Cargando...</Text>
            ) : subcategoryData ? (
              // Show main category and subcategory
              <View style={styles.hierarchyContainer}>
                <Text style={styles.mainCategory}>{mainCategory?.nombre || categoria}</Text>
                <Text style={styles.separator}>›</Text>
                <Text style={styles.subcategory}>{subcategoryData.nombre || subcategoria}</Text>
              </View>
            ) : (
              // Show only main category
              <Text style={styles.categoria}>{mainCategory?.nombre || categoria}</Text>
            )}
          </View>
          
          <Text style={styles.fecha}>{fecha}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.grey[200],
    backgroundColor: theme.COLORS.common.white,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.SPACING.md,
  },
  infoContainer: {
    flex: 1,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs,
  },
  concepto: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "500",
    color: theme.COLORS.text.primary,
  },
  monto: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
  },
  montoPositivo: {
    color: theme.COLORS.success.main,
  },
  montoNegativo: {
    color: theme.COLORS.error.main,
  },
  secondaryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoria: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  hierarchyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainCategory: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  separator: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.grey[400],
    marginHorizontal: 4,
  },
  subcategory: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.primary.main,
    fontWeight: "500",
  },
  fecha: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
});

export default EnhancedTransactionCard;// src/components/EnhancedTransactionCard.tsx