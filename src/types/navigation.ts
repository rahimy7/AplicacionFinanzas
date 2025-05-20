// src/types/navigation.ts
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { Budget, Transaction } from '../database/asyncStorageDB';

export type RootStackParamList = {
  AddTransaction: { transaction?: Transaction } | undefined;
  ImprovedAddTransaction: { transaction?: Transaction } | undefined;
  Main: undefined;
  Dashboard: undefined;
  Transactions: undefined;
  Budgets: undefined;
  AddBudget: { budget?: Budget } | undefined;
  Analytics: undefined;
  Settings: undefined;
  Family: undefined;
  Login: undefined;
  CategoryManagement: undefined; // Nueva pantalla
};

// Tipos para las propiedades de navegación en componentes
export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};
// Definición de las rutas para el navegador de pestañas
export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  NewTransaction: undefined;
  Budgets: undefined;
  Goals: undefined;
  Analytics: undefined;
};

// Definición de las rutas para el navegador de pila
export type StackParamList = {
  Main: undefined;
  AddTransaction: undefined;
  AddBudget: undefined;
  Settings: undefined;
  Family: undefined;
  TransactionDetail: { id: string };
  BudgetDetail: { id: string };
};


// Tipado para la navegación en el Dashboard
export type DashboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  StackNavigationProp<StackParamList>
>;

// Tipado para la navegación en Transactions
export type TransactionsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Transactions'>,
  StackNavigationProp<StackParamList>
>;

// Tipado para la navegación en Budgets
export type BudgetsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Budgets'>,
  StackNavigationProp<StackParamList>
>;

// Tipado para la navegación en Analytics
export type AnalyticsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Analytics'>,
  StackNavigationProp<StackParamList>
>;

// Tipado para la navegación en Add screens (desde cualquier pantalla)
export type AddTransactionScreenNavigationProp = StackNavigationProp<
  StackParamList,
  'AddTransaction'
>;

export type SidebarNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export type AddBudgetScreenNavigationProp = StackNavigationProp<
  StackParamList,
  'AddBudget'
>;



// Exportamos un tipo genérico para props de navegación para pantallas de pila
export interface StackNavigationProps<T extends keyof StackParamList> {
  navigation: StackNavigationProp<StackParamList, T>;
  route: {
    params: StackParamList[T];
  };
}

