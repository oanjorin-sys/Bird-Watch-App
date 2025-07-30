import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { utils } from '../utils/api';

export default function LoginScreen({ navigation }) {
  const { login, register, googleLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      utils.showError('Please fill in all required fields');
      return false;
    }

    if (!utils.isValidEmail(formData.email)) {
      utils.showError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      utils.showError('Password must be at least 6 characters long');
      return false;
    }

    if (!isLogin) {
      if (!formData.fullName) {
        utils.showError('Please enter your full name');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        utils.showError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      let result;
      
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.email, formData.password, formData.fullName);
      }

      if (result.success) {
        navigation.replace('MainTabs');
      } else {
        utils.showError(result.error || 'Authentication failed');
      }
    } catch (error) {
      utils.showError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    try {
      // Mock Google token for development
      const result = await googleLogin('mock_google_token');
      
      if (result.success) {
        navigation.replace('MainTabs');
      } else {
        utils.showError(result.error || 'Google login failed');
      }
    } catch (error) {
      utils.showError(error.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      fullName: '',
      confirmPassword: '',
    });
  };

  return (
    <LinearGradient
      colors={['#065f46', '#059669', '#10b981']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/bird-icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>BirdScope AI</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome back!' : 'Join the community'}
            </Text>
          </View>

          {/* Form Card */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.formTitle}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>

              {!isLogin && (
                <TextInput
                  label="Full Name"
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                  style={styles.input}
                  mode="outlined"
                  outlineColor="#e5e7eb"
                  activeOutlineColor="#059669"
                  disabled={loading}
                />
              )}

              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                style={styles.input}
                mode="outlined"
                outlineColor="#e5e7eb"
                activeOutlineColor="#059669"
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={loading}
              />

              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                style={styles.input}
                mode="outlined"
                outlineColor="#e5e7eb"
                activeOutlineColor="#059669"
                secureTextEntry
                disabled={loading}
              />

              {!isLogin && (
                <TextInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  style={styles.input}
                  mode="outlined"
                  outlineColor="#e5e7eb"
                  activeOutlineColor="#059669"
                  secureTextEntry
                  disabled={loading}
                />
              )}

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>

              <Divider style={styles.divider} />

              <Button
                mode="outlined"
                onPress={handleGoogleLogin}
                style={styles.googleButton}
                contentStyle={styles.googleButtonContent}
                disabled={loading}
                icon="google"
              >
                Continue with Google
              </Button>

              <View style={styles.switchMode}>
                <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <Button
                  mode="text"
                  onPress={toggleMode}
                  labelStyle={styles.switchButtonLabel}
                  disabled={loading}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* Features Preview */}
          <View style={styles.features}>
            <Text style={styles.featuresTitle}>What you'll get:</Text>
            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>🔍 AI-powered bird identification</Text>
              <Text style={styles.featureItem}>📚 Comprehensive bird information</Text>
              <Text style={styles.featureItem}>🎵 Mating call audio library</Text>
              <Text style={styles.featureItem}>🗺️ Migration pattern maps</Text>
              <Text style={styles.featureItem}>👥 Community sharing</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 50,
    height: 50,
    tintColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 30,
  },
  cardContent: {
    padding: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#059669',
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#e5e7eb',
  },
  googleButton: {
    borderColor: '#059669',
    borderRadius: 8,
    marginBottom: 20,
  },
  googleButtonContent: {
    paddingVertical: 8,
  },
  switchMode: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchText: {
    color: '#6b7280',
    fontSize: 14,
  },
  switchButtonLabel: {
    color: '#059669',
    fontSize: 14,
    fontWeight: 'bold',
  },
  features: {
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  featuresList: {
    alignItems: 'flex-start',
  },
  featureItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textAlign: 'left',
  },
});