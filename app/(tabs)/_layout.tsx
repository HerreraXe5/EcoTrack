import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

// Evitar que SplashScreen se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const [loaded, fontError] = useFonts({
    SpaceMono: require('../../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [loaded, fontError]);

  if (!loaded && !fontError) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#115E3E',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#115E3E',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      {/* Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      {/* Nuevo Pesaje */}
      <Tabs.Screen
        name="nuevo-pesaje"
        options={{
          title: 'Nuevo Pesaje',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      {/* Historial */}
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'list' : 'list-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      {/* Perfil */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      {/* Logros */}
      <Tabs.Screen
        name="logros"
        options={{
          title: 'Logros',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'trophy' : 'trophy-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      {/* Admin - Solo visible si es admin */}
      {isAuthenticated && (
        <Tabs.Screen
          name="admin-categorias"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                color={color}
                size={24}
              />
            ),
          }}
        />
      )}

      {/* Pantallas ocultas del tab bar */}
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null, // Ocultar del tab bar
        }}
      />
      <Tabs.Screen
        name="admin-calibrar"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="admin-nueva-categoria"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="editar-perfil"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="eliminar"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="_layout"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}