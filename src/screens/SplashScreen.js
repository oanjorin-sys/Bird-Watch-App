import React, { useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const { isAuthenticated, isLoading } = useAuth();
  const logoScale = new Animated.Value(0);
  const logoOpacity = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);

  useEffect(() => {
    // Animate logo entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after animations and auth check
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Login');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  return (
    <LinearGradient
      colors={['#065f46', '#059669', '#10b981']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <View style={styles.logoBackground}>
            <Image
              source={require('../../assets/bird-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={styles.title}>BirdScope AI</Text>
          <Text style={styles.subtitle}>
            Discover the fascinating world of birds
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: textOpacity }]}>
        <Text style={styles.footerText}>Powered by AI • Made with ❤️</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 80,
    height: 80,
    tintColor: '#ffffff',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});