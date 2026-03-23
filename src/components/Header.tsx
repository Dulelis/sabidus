import { Text, View } from 'react-native';

import { styles } from '../styles/appStyles';

export function Header() {
  return (
    <View style={styles.topBar}>
      <View>
        <Text style={styles.brand}>SabiduS</Text>
        <Text style={styles.brandSubcopy}>Aprender com foco, busca e rotina.</Text>
      </View>
      <View style={styles.brandBadge}>
        <Text style={styles.brandBadgeText}>Pro</Text>
      </View>
    </View>
  );
}
