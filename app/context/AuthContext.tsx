import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============= TIPOS =============
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  rol: string;
}

export interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registro: (nombre: string, email: string, password: string) => Promise<void>;
  updateUser: (usuario: Usuario) => void;
}

// ============= CREAR CONTEXTO =============
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============= PROVIDER =============
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = 'https://ecotrack-api-6686.onrender.com';

  // ============= RECUPERAR SESIÓN AL INICIAR =============
  useEffect(() => {
    const recuperarSesion = async () => {
      try {
        console.log('🔄 Recuperando sesión...');
        const tokenGuardado = await AsyncStorage.getItem('auth_token');
        const usuarioGuardado = await AsyncStorage.getItem('auth_usuario');

        if (tokenGuardado && usuarioGuardado) {
          console.log('✅ Sesión encontrada');
          setToken(tokenGuardado);
          setUsuario(JSON.parse(usuarioGuardado));

          // Aquí puedes validar que el token sigue siendo válido
          // Por ahora lo asumimos válido
        } else {
          console.log('❌ No hay sesión guardada');
        }
      } catch (error) {
        console.error('Error recuperando sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };

    recuperarSesion();
  }, []);

  // ============= LOGIN =============
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('📡 Enviando credenciales...');

      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      console.log('📊 Status HTTP:', response.status);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en login');
      }

      const data = await response.json();
      console.log('✅ Login exitoso');
      console.log('🎫 Token recibido:', data.access_token.substring(0, 20) + '...');

      // Guardar en AsyncStorage
      await AsyncStorage.setItem('auth_token', data.access_token);
      await AsyncStorage.setItem('auth_usuario', JSON.stringify(data.user));

      // Guardar en estado
      setToken(data.access_token);
      setUsuario(data.user);
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ============= REGISTRO =============
  const registro = async (nombre: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('📡 Registrando usuario...');

      const response = await fetch(`${API_URL}/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          password: password,
        }),
      });

      console.log('📊 Status HTTP:', response.status);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en registro');
      }

      const data = await response.json();
      console.log('✅ Registro exitoso - ID usuario:', data.id);

      // Después de registrarse, hacer login automático
      await login(email, password);
    } catch (error) {
      console.error('❌ Error en registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ============= LOGOUT =============
  const logout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      
      // Limpiar AsyncStorage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_usuario');
      // También limpiar el antiguo AsyncStorage (compatibilidad)
      await AsyncStorage.removeItem('usuario');

      // Limpiar estado
      setToken(null);
      setUsuario(null);
      
      console.log('✅ Sesión cerrada');
    } catch (error) {
      console.error('❌ Error al logout:', error);
      throw error;
    }
  };

  // ============= ACTUALIZAR USUARIO =============
  const updateUser = (usuarioActualizado: Usuario) => {
    console.log('📝 Actualizando usuario localmente');
    setUsuario(usuarioActualizado);
    AsyncStorage.setItem('auth_usuario', JSON.stringify(usuarioActualizado));
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        isLoading,
        isAuthenticated: !!token && !!usuario,
        login,
        logout,
        registro,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};