declare module 'react-native-chart-kit' {
  import { ComponentType } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  // Configuración general para todos los gráficos
  export interface ChartConfig {
    backgroundColor?: string;
    backgroundGradientFrom?: string;
    backgroundGradientTo?: string;
    backgroundGradientFromOpacity?: number;
    backgroundGradientToOpacity?: number;
    color?: (opacity?: number) => string;
    labelColor?: (opacity?: number) => string;
    strokeWidth?: number;
    barPercentage?: number;
    barRadius?: number;
    propsForDots?: object;
    propsForLabels?: TextStyle;
    decimalPlaces?: number;
    useShadowColorFromDataset?: boolean;
    formatYLabel?: (label: string) => string;
    formatXLabel?: (label: string) => string;
  }

  // Datos para PieChart
  export interface PieChartData {
    name: string;
    value: number;
    color: string;
    legendFontColor?: string;
    legendFontSize?: number;
    legendFontFamily?: string;
  }

  // Propiedades para PieChart
  export interface PieChartProps {
    data: PieChartData[];
    width: number;
    height: number;
    chartConfig: ChartConfig;
    accessor: string;
    backgroundColor?: string;
    paddingLeft?: string;
    absolute?: boolean;
    hasLegend?: boolean;
    center?: [number, number];
    avoidFalseZero?: boolean;
    style?: ViewStyle;
  }

  // Datos para LineChart, BarChart, etc.
  export interface Dataset {
    data: number[];
    color?: string | ((opacity: number) => string);
    colors?: Array<string | ((opacity: number) => string)>;
    strokeWidth?: number;
    withDots?: boolean;
    withScrollableDot?: boolean;
  }

  export interface ChartData {
    labels: string[];
    datasets: Dataset[];
  }

  // Propiedades para Line y Bar Charts
  export interface AbstractChartProps {
    width: number;
    height: number;
    data: ChartData;
    chartConfig: ChartConfig;
    style?: ViewStyle;
    bezier?: boolean;
    withInnerLines?: boolean;
    withOuterLines?: boolean;
    withHorizontalLines?: boolean;
    withVerticalLines?: boolean;
    withHorizontalLabels?: boolean;
    withVerticalLabels?: boolean;
    fromZero?: boolean;
    yAxisLabel?: string;
    yAxisSuffix?: string;
    xAxisLabel?: string;
    yAxisInterval?: number;
    segments?: number;
  }

  // Propiedades específicas para cada tipo de gráfico
  export interface LineChartProps extends AbstractChartProps {
    bezier?: boolean;
    withShadow?: boolean;
    withDots?: boolean;
    withScrollableDot?: boolean;
    decorator?: () => any;
    onDataPointClick?: (data: { value: number; dataset: Dataset; getColor: (opacity: number) => string }) => void;
  }

  export interface BarChartProps extends AbstractChartProps {
    withHorizontalLabels?: boolean;
    showBarTops?: boolean;
    showValuesOnTopOfBars?: boolean;
  }

  // Exportación de los componentes
  export const PieChart: ComponentType<PieChartProps>;
  export const LineChart: ComponentType<LineChartProps>;
  export const BarChart: ComponentType<BarChartProps>;
  export const ProgressChart: ComponentType<any>;
  export const ContributionGraph: ComponentType<any>;
  export const StackedBarChart: ComponentType<any>;
}