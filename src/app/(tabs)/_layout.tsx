import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F8FAFC',
        tabBarInactiveTintColor: '#475569',
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          height: 72,
          borderRadius: 24,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 8,
          backgroundColor: '#F8FAFC',
          borderTopWidth: 0,
        },
        tabBarItemStyle: {
          borderRadius: 18,
          marginHorizontal: 4,
        },
        tabBarActiveBackgroundColor: '#0F172A',
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '700',
          paddingBottom: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="pesquisar"
        options={{
          title: 'Pesquisar',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="recursos"
        options={{
          title: 'Recursos',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="conta"
        options={{
          title: 'Conta',
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}
