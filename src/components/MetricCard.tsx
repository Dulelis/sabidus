import { Text, View } from 'react-native';

import { styles } from '../styles/appStyles';

type MetricCardProps = {
  value: string;
  label: string;
  accent: 'blue' | 'orange';
};

export function MetricCard({ value, label, accent }: MetricCardProps) {
  return (
    <View
      style={[
        styles.metricCard,
        accent === 'blue' ? styles.metricBlue : styles.metricOrange,
      ]}
    >
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
