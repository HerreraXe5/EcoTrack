import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

/**
 * Componente RootNavigator
 * Maneja la lógica de navegación basada en autenticación
 */
function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Esperar a que se cargue la sesión
    if (isLoading) {
      return;
    }

    console.log('🔐 Estado auth:', { isAuthenticated, segment: segments[0] });

    // Determinar si estamos en una ruta protegida
    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // Usuario NO autenticado intenta acceder a ruta protegida
      console.log('🔒 Redirigiendo a login...');
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Usuario autenticado intenta ir a login/registro
      console.log('✅ Usuario autenticado, redirigiendo a dashboard...');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Mostrar loader mientras se recupera sesión
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F7ED' }}>
        <ActivityIndicator size="large" color="#115E3E" />
      </View>
    );
  }

  return (
    <Stack>
      {/* RUTAS DE AUTENTICACIÓN (públicas) */}
      {!isAuthenticated ? (
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
          }}
        />
      ) : (
        <>
          {/* RUTAS PROTEGIDAS (autenticadas) */}
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />

          {/* Modales/Pantallas adicionales (sobre tabs) */}
          <Stack.Screen
            name="editar-perfil"
            options={{
              presentation: 'modal',
              title: 'Editar Perfil',
            }}
          />
          <Stack.Screen
            name="eliminar"
            options={{
              presentation: 'modal',
              title: 'Eliminar Registro',
            }}
          />
          <Stack.Screen
            name="logros"
            options={{
              presentation: 'modal',
              title: 'Logros',
            }}
          />
        </>
      )}
    </Stack>
  );
}

/**
 * Root Layout
 * Envuelve toda la app con AuthProvider
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}