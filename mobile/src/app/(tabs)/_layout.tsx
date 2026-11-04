import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

type IconName = ComponentProps<typeof Ionicons>['name'];

const tabIcon = (name: IconName) => {
  const TabIcon = ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color as string} />
  );
  return TabIcon;
};

// Alunos veem só "Posts" e "Conta"; as abas administrativas existem apenas
// para professores (Tabs.Protected remove a aba e bloqueia a rota).
export default function TabsLayout() {
  const { isTeacher } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.paper },
        headerTitleStyle: { fontFamily: Fonts.serif, color: Colors.ink, fontSize: 20 },
        headerShadowVisible: false,
        tabBarActiveTintColor: Colors.deep,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: { backgroundColor: Colors.white, borderTopColor: Colors.line },
        sceneStyle: { backgroundColor: Colors.paper },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Blog da Escola', tabBarLabel: 'Posts', tabBarIcon: tabIcon('newspaper-outline') }} />

      <Tabs.Protected guard={isTeacher}>
        <Tabs.Screen name="admin" options={{ title: 'Gerenciar posts', tabBarLabel: 'Admin', tabBarIcon: tabIcon('create-outline') }} />
        <Tabs.Screen name="teachers" options={{ title: 'Professores', tabBarIcon: tabIcon('school-outline') }} />
        <Tabs.Screen name="students" options={{ title: 'Alunos', tabBarIcon: tabIcon('people-outline') }} />
      </Tabs.Protected>

      <Tabs.Screen name="account" options={{ title: 'Minha conta', tabBarLabel: 'Conta', tabBarIcon: tabIcon('person-circle-outline') }} />
    </Tabs>
  );
}
