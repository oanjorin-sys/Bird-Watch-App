import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { authAPI } from '../utils/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (token && userData) {
        setAuthToken(token);
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(email, password);
      
      if (response.token && response.user) {
        await SecureStore.setItemAsync('authToken', response.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(response.user));
        
        setAuthToken(response.token);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, fullName) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(email, password, fullName);
      
      if (response.token && response.user) {
        await SecureStore.setItemAsync('authToken', response.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(response.user));
        
        setAuthToken(response.token);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, error: 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      setIsLoading(true);
      const response = await authAPI.googleLogin(googleToken);
      
      if (response.token && response.user) {
        await SecureStore.setItemAsync('authToken', response.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(response.user));
        
        setAuthToken(response.token);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, error: 'Google login failed' };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message || 'Google login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
      
      setAuthToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      await SecureStore.setItemAsync('userData', JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const checkSubscriptionStatus = () => {
    if (!user) return 'free';
    return user.subscription_plan || 'free';
  };

  const canAccessPremiumFeature = (feature) => {
    const subscription = checkSubscriptionStatus();
    if (subscription === 'free') return false;
    
    // Premium features mapping
    const premiumFeatures = {
      unlimited_scans: true,
      migration_maps: true,
      full_audio: true,
      detailed_info: true,
      unlimited_sightings: true,
      community_post: true,
      offline_mode: true,
      push_notifications: true
    };
    
    return premiumFeatures[feature] || false;
  };

  const getRemainingScans = () => {
    if (!user) return 0;
    
    const subscription = checkSubscriptionStatus();
    if (subscription !== 'free') return -1; // Unlimited
    
    const today = new Date().toDateString();
    const lastScanDate = user.last_scan_date ? new Date(user.last_scan_date).toDateString() : '';
    
    if (today !== lastScanDate) {
      return 3; // Reset daily limit
    }
    
    return Math.max(0, 3 - (user.scans_today || 0));
  };

  const value = {
    user,
    authToken,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    checkSubscriptionStatus,
    canAccessPremiumFeature,
    getRemainingScans,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};