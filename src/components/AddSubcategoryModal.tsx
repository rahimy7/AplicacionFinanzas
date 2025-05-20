// src/components/AddSubcategoryModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import theme from '../theme/theme';
import { createSubcategory } from '../services/categoryService';
import { Category, CategoryWithChildren } from '../database/asyncStorageDB';

interface AddSubcategoryModalProps {
  visible: boolean;
  onClose: () => void;
  parentCategory: CategoryWithChildren | null;
  onSubcategoryAdded: () => void;
}

const AddSubcategoryModal: React.FC<AddSubcategoryModalProps> = ({
  visible,
  onClose,
  parentCategory,
  onSubcategoryAdded
}) => {
  const [subcategoryName, setSubcategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4BC0C0');
  const [loading, setLoading] = useState(false);
  
  // Colores predefinidos para elegir
  const colorOptions = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8AC24A', '#607D8B', '#E57373', '#64B5F6',
    '#81C784', '#FFB74D', '#FF8A65', '#9575CD', '#7986CB'
  ];
  
  // Función para guardar la subcategoría
  const handleSave = async () => {
    if (!parentCategory) {
      Alert.alert('Error', 'Categoría padre no seleccionada');
      return;
    }
    
    if (!subcategoryName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para la subcategoría');
      return;
    }
    
    setLoading(true);
    
    try {
      const newSubcategory = await createSubcategory(parentCategory.id, {
        nombre: subcategoryName.trim(),
        tipo: parentCategory.tipo,
        color: selectedColor,
        icono: 'tag' // Icono predeterminado
        ,
        esSubcategoria: false
      });
      
      if (!newSubcategory) {
        throw new Error('No se pudo crear la subcategoría');
      }
      
      // Limpiar el formulario
      setSubcategoryName('');
      setSelectedColor('#4BC0C0');
      
      // Notificar éxito
      Alert.alert('Éxito', 'Subcategoría creada correctamente');
      
      // Notificar al componente padre
      onSubcategoryAdded();
      
      // Cerrar el modal
      onClose();
    } catch (error) {
      console.error('Error al crear subcategoría:', error);
      Alert.alert('Error', 'No se pudo crear la subcategoría');
    } finally {
      setLoading(false);
    }
  };
  
  // Renderizar selector de color
  const renderColorSelector = () => (
    <View style={styles.colorSelectorContainer}>
      <Text style={styles.label}>Color</Text>
      <FlatList
        data={colorOptions}
        keyExtractor={(item) => item}
        numColumns={5}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.colorOption,
              { backgroundColor: item },
              selectedColor === item && styles.selectedColorOption
            ]}
            onPress={() => setSelectedColor(item)}
          />
        )}
        contentContainerStyle={styles.colorOptionsContainer}
      />
    </View>
  );
  
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
            <Text style={styles.modalTitle}>
              {parentCategory ? `Nueva subcategoría de ${parentCategory.nombre}` : 'Nueva subcategoría'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={theme.COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre de la subcategoría"
                value={subcategoryName}
                onChangeText={setSubcategoryName}
                placeholderTextColor={theme.COLORS.grey[400]}
              />
            </View>
            
            {renderColorSelector()}
          </View>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.COLORS.common.white} />
            ) : (
              <>
                <Check size={18} color={theme.COLORS.common.white} />
                <Text style={styles.saveButtonText}>Guardar</Text>
              </>
            )}
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
    backgroundColor: theme.COLORS.common.white,
    borderTopLeftRadius: theme.BORDER_RADIUS.lg,
    borderTopRightRadius: theme.BORDER_RADIUS.lg,
    padding: theme.SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.lg,
  },
  modalTitle: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: "600",
    color: theme.COLORS.text.primary,
  },
  formContainer: {
    marginBottom: theme.SPACING.lg,
  },
  inputContainer: {
    marginBottom: theme.SPACING.md,
  },
  label: {
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: "500",
    color: theme.COLORS.text.secondary,
    marginBottom: theme.SPACING.xs,
  },
  input: {
    backgroundColor: theme.COLORS.grey[100],
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
    fontSize: theme.FONT_SIZE.md,
    color: theme.COLORS.text.primary,
  },
  colorSelectorContainer: {
    marginBottom: theme.SPACING.md,
  },
  colorOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: theme.SPACING.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: theme.SPACING.xs,
    borderWidth: 1,
    borderColor: theme.COLORS.grey[300],
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: theme.COLORS.primary.main,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingVertical: theme.SPACING.md,
  },
  saveButtonText: {
    color: theme.COLORS.common.white,
    fontWeight: "500",
    fontSize: theme.FONT_SIZE.md,
    marginLeft: theme.SPACING.xs,
  },
});

export default AddSubcategoryModal;