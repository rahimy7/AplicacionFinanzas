// src/components/ImprovedTransactionCard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tag, Clock, ChevronRight } from 'lucide-react-native';
import theme from '../theme/theme';
import { CURRENCY_SYMBOL } from '../constants/currency';
import { getCategories, Category } from '../database/asyncStorageDB';

interface ImprovedTransactionCardProps {
  id: string | number;
  concepto: string;
  categoria: string;
  categoriaId?: string;
  subcategoria?: string;
  subcategoriaId?: string;
  monto: number;
  fecha: string;
  cuenta?: string;
  notas?: string;
  onPress?: () => void;
  showDetails?: boolean;
}

const ImprovedTransactionCard: React.FC<ImprovedTransactionCardProps> = ({
  id,
  concepto,
  categoria,
  categoriaId,
  subcategoria,
  subcategoriaId,
  monto,
  fecha,
  cuenta,
  notas,
  onPress,
  showDetails = false
}) => {
  const [mainCategory, setMainCategory] = useState<Category | null>(null);
  const [subcategoryData, setSubcategoryData] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(showDetails);

  // Cargar información de categoría y subcategoría
  useEffect(() => {
    const loadCategoryInfo = async () => {
      try {
        setIsLoading(true);
        const allCategories = await getCategories();
        
        // Si tenemos subcategoría, encontrar categoría principal y subcategoría
        if (subcategoriaId) {
          const subcat = allCategories.find(c => c.id === subcategoriaId);
          if (subcat && subcat.categoriaPadreId) {
            setSubcategoryData(subcat);
            
            // Encontrar categoría principal
            const parent = allCategories.find(c => c.id === subcat.categoriaPadreId);
            if (parent) {
              setMainCategory(parent);
            }
          }
        } 
        // Si solo tenemos categoría principal
        else if (categoriaId) {
          const cat = allCategories.find(c => c.id === categoriaId);
          if (cat) {
            setMainCategory(cat);
          }
        }
        // Compatibilidad - buscar por nombre
        else if (categoria) {
          const cat = allCategories.find(c => c.nombre === categoria);
          if (cat) {
            setMainCategory(cat);
          }
          
          // También intentar buscar la subcategoría por nombre
          if (subcategoria) {
            const subcat = allCategories.find(c => 
              c.nombre === subcategoria && 
              c.esSubcategoria === true
            );
            if (subcat) {
              setSubcategoryData(subcat);
            }
          }
        }
      } catch (error) {
        console.error('Error cargando información de categoría:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCategoryInfo();
  }, [categoriaId, subcategoriaId, categoria, subcategoria]);

  // Formatear fecha para mostrarla más amigable
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Manejar expansión/colapso de detalles
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress || toggleExpanded}
      activeOpacity={0.7}
    >
      {/* Sección principal - siempre visible */}
      <View style={styles.mainSection}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: mainCategory?.color || theme.COLORS.grey[300] }
        ]}>
          <Tag size={20} color={theme.COLORS.common.white} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.conceptoText} numberOfLines={1}>{concepto}</Text>
            <Text style={[
              styles.montoText,
              monto >= 0 ? styles.montoPositivo : styles.montoNegativo
            ]}>
              {monto >= 0 ? '+' : ''}{CURRENCY_SYMBOL}{Math.abs(monto).toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.detailsRow}>
            {/* Mostrar jerarquía de categoría */}
            <View style={styles.categoryContainer}>
              {isLoading ? (
                <Text style={styles.categoryText}>Cargando...</Text>
              ) : subcategoryData ? (
                <View style={styles.categoryHierarchy}>
                  <Text style={styles.categoryText}>
                    {mainCategory?.nombre || categoria}
                  </Text>
                  <Text style={styles.categorySeparator}> › </Text>
                  <Text style={styles.subcategoryText}>
                    {subcategoryData.nombre || subcategoria}
                  </Text>
                </View>
              ) : (
                <Text style={styles.categoryText}>
                  {mainCategory?.nombre || categoria}
                </Text>
              )}
            </View>
            
            <View style={styles.dateContainer}>
              <Clock size={12} color={theme.COLORS.text.secondary} style={styles.dateIcon} />
              <Text style={styles.dateText}>{formatDate(fecha)}</Text>
            </View>
          </View>
        </View>
        
        {/* Indicador de expansión solo si hay detalles adicionales */}
        {(cuenta || notas) && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleExpanded}
          >
            <ChevronRight
              size={20}
              color={theme.COLORS.grey[400]}
              style={{
                transform: [{ rotate: expanded ? '90deg' : '0deg' }]
              }}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Sección de detalles - visible solo cuando está expandido */}
      {expanded && (cuenta || notas) && (
        <View style={styles.expandedSection}>
          {cuenta && (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Cuenta:</Text>
              <Text style={styles.expandedValue}>{cuenta}</Text>
            </View>
          )}
          
          {notas && (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Notas:</Text>
              <Text style={styles.expandedValue}>{notas}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.common.white,
    borderRadius: theme.BORDER_RADIUS.md,
    marginBottom: theme.SPACING.sm,
    overflow: 'hidden',
    ...theme.SHADOWS.sm,
  },
  mainSection: {
    flexDirection: 'row',
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.SPACING.md,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs,
  },
  conceptoText: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "500",
    color: theme.COLORS.text.primary,
    flex: 1,
    marginRight: theme.SPACING.sm,
  },
  montoText: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: "600",
    textAlign: 'right',
  },
  montoPositivo: {
    color: theme.COLORS.success.main,
  },
  montoNegativo: {
    color: theme.COLORS.error.main,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryContainer: {
    flex: 1,
    marginRight: theme.SPACING.sm,
  },
  categoryHierarchy: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.secondary,
  },
  categorySeparator: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.grey[400],
  },
  subcategoryText: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.primary.main,
    fontWeight: "500",
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.COLORS.text.secondary,
  },
  expandButton: {
    padding: theme.SPACING.xs,
    marginLeft: theme.SPACING.xs,
  },
  expandedSection: {
    backgroundColor: theme.COLORS.grey[50],
    padding: theme.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.grey[200],
  },
  expandedRow: {
    marginBottom: theme.SPACING.sm,
  },
  expandedLabel: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    color: theme.COLORS.text.secondary,
    marginBottom: 2,
  },
  expandedValue: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.text.primary,
  },
});

export default ImprovedTransactionCard;