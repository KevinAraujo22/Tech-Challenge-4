import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors, Fonts } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}

// As rotas protegidas são declaradas com Stack.Protected: quando o "guard" é
// falso a tela deixa de existir e o usuário é redirecionado (para o login ou
// para a página principal). O back-end também valida o token e o papel de
// cada requisição, então a proteção não depende só da interface.
function RootNavigator() {
  const { user, isLoading, isTeacher } = useAuth();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.paper },
        headerTintColor: Colors.deep,
        headerTitleStyle: { fontFamily: Fonts.serif, color: Colors.ink },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: Colors.paper },
      }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Criar conta' }} />
      </Stack.Protected>

      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="posts/[id]" options={{ title: 'Leitura' }} />

        <Stack.Protected guard={isTeacher}>
          <Stack.Screen name="posts/new" options={{ title: 'Nova postagem', presentation: 'modal' }} />
          <Stack.Screen name="posts/edit/[id]" options={{ title: 'Editar postagem' }} />
          <Stack.Screen name="people/[kind]/new" options={{ title: 'Cadastrar', presentation: 'modal' }} />
          <Stack.Screen name="people/[kind]/[id]" options={{ title: 'Editar' }} />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  );
}
