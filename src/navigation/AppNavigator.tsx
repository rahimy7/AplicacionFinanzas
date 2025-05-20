import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home, CreditCard, BarChart2, Plus, PieChart } from 'lucide-react-native';
import CategoryManagement from '../screens/CategoryManagement';
import Analytics from '../screens/Analytics';

// Screens
import Dashboard from '../screens/Dashboard';
import Transactions from '../screens/Transactions';
import Budgets from '../screens/Budgets';
import AddTransaction from '../screens/AddTransaction';
import AddBudget from '../screens/ImprovedAddBudget';


// Components
import Sidebar from '../components/Layout/Sidebar';
import theme from '../theme/theme';
import { RootStackParamList, TabParamList } from '../types/navigation';
import ImprovedAddBudget from '../screens/ImprovedAddBudget';

// Pantallas temporales para secciones no implementadas
const Settings = () => <View style={{ flex: 1, backgroundColor: theme.COLORS.background.default }} />;
const Family = () => <View style={{ flex: 1, backgroundColor: theme.COLORS.background.default }} />;

// Componente vacío para el botón central
const EmptyComponent = () => null;

// Componente para el botón personalizado de nueva transacción
const CustomAddButton = () => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.customButtonContainer}>
      <View style={styles.customButtonShadow}>
        <TouchableOpacity 
          style={styles.customButton}
          onPress={() => navigation.navigate('AddTransaction' as never)}
        >
          <Plus size={24} color={theme.COLORS.common.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};



const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

interface TabNavigatorWrapperProps {
  isSidebarVisible: boolean;
  toggleSidebar: () => void;
  navigation: any;
  route: any;
}

const TabNavigatorWrapper: React.FC<TabNavigatorWrapperProps> = ({
  isSidebarVisible,
  toggleSidebar,
  navigation,
  route
}) => {
  // Aquí puedes usar isSidebarVisible y toggleSidebar como necesites
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.COLORS.primary.main,
        tabBarInactiveTintColor: theme.COLORS.grey[400],
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      {/* Resto de tus tabs... */}
    </Tab.Navigator>
  );
};

const MainStack = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(false);

  const toggleSidebar = (): void => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {(props) => (
          <TabNavigatorWrapper
            {...props}
            isSidebarVisible={isSidebarVisible}
            toggleSidebar={toggleSidebar}
          />
        )}
      </Stack.Screen>
      {/* Resto de tus pantallas... */}
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: theme.COLORS.primary.main,
          tabBarInactiveTintColor: theme.COLORS.grey[400],
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={Dashboard}
          options={{
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="Transactions"
          component={Transactions}
          options={{
            tabBarIcon: ({ color }) => <CreditCard size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="NewTransaction"
          component={EmptyComponent}
          options={{
            tabBarButton: () => <CustomAddButton />,
          }}
        />
        <Tab.Screen
          name="Budgets"
          component={Budgets}
          options={{
            tabBarIcon: ({ color }) => <BarChart2 size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={Analytics}
          options={{
            tabBarIcon: ({ color }) => <PieChart size={24} color={color} />,
          }}
        />
      </Tab.Navigator>

      <Sidebar
        activeScreen="dashboard"
        onScreenChange={() => {}}
        onClose={toggleMenu}
        visible={menuOpen}
        navigation={undefined}
      />
    </View>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="AddTransaction" component={AddTransaction} />
        <Stack.Screen name="AddBudget" component={ImprovedAddBudget} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Family" component={Family} />
        <Stack.Screen name="CategoryManagement" component={CategoryManagement} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  tabBar: {
    height: 60,
    backgroundColor: theme.COLORS.common.white,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.grey[200],
    ...Platform.select({
      ios: {
        shadowColor: theme.COLORS.common.black,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  customButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButtonShadow: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.COLORS.common.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.COLORS.common.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  customButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarToggle: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 999,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.COLORS.common.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});



export default AppNavigator;