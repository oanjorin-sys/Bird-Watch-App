import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionAPI, utils } from '../utils/api';

const { width, height } = Dimensions.get('window');

export default function PremiumUpsellScreen({ route, navigation }) {
  const { user, updateUser } = useAuth();
  const { feature } = route.params || {};
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium_monthly');
  
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    loadPlans();
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await subscriptionAPI.getPlans();
      setPlans(response.plans || []);
    } catch (error) {
      utils.showError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    
    try {
      // Mock payment method for development
      const paymentMethodId = 'mock_payment_method';
      
      const response = await subscriptionAPI.subscribe(
        selectedPlan,
        paymentMethodId,
        user.authToken
      );
      
      if (response.subscription_id) {
        // Update user subscription status
        await updateUser({
          subscription_plan: selectedPlan,
        });
        
        utils.showSuccess('Welcome to BirdScope Premium!');
        navigation.goBack();
      } else {
        utils.showError('Subscription failed. Please try again.');
      }
    } catch (error) {
      utils.showError(error.message || 'Subscription failed');
    } finally {
      setSubscribing(false);
    }
  };

  const getFeatureTitle = () => {
    switch (feature) {
      case 'full_audio':
        return '🎵 Full Audio Library';
      case 'migration_maps':
        return '🗺️ Interactive Migration Maps';
      case 'community_post':
        return '👥 Community Posting';
      case 'unlimited_sightings':
        return '💾 Unlimited Storage';
      case 'export_sightings':
        return '📤 Export Features';
      default:
        return '👑 Premium Features';
    }
  };

  const getFeatureDescription = () => {
    switch (feature) {
      case 'full_audio':
        return 'Access complete mating call audio library with high-quality recordings';
      case 'migration_maps':
        return 'View interactive migration routes and seasonal patterns';
      case 'community_post':
        return 'Share your bird sightings with the BirdScope community';
      case 'unlimited_sightings':
        return 'Save unlimited bird sightings to your personal collection';
      case 'export_sightings':
        return 'Export your sightings data in various formats';
      default:
        return 'Unlock all premium features for the ultimate bird watching experience';
    }
  };

  const premiumFeatures = [
    {
      icon: 'infinity',
      title: 'Unlimited Bird Scans',
      description: 'Identify as many birds as you want, no daily limits',
      highlight: feature === 'unlimited_scans',
    },
    {
      icon: 'map',
      title: 'Interactive Migration Maps',
      description: 'Visualize bird migration routes and seasonal patterns',
      highlight: feature === 'migration_maps',
    },
    {
      icon: 'music-note',
      title: 'Full Audio Library',
      description: 'Access complete mating call recordings and bird sounds',
      highlight: feature === 'full_audio',
    },
    {
      icon: 'information',
      title: 'Detailed Bird Information',
      description: 'In-depth diet, rarity, and conservation data',
      highlight: feature === 'detailed_info',
    },
    {
      icon: 'database',
      title: 'Unlimited Sighting Storage',
      description: 'Save all your bird discoveries with export options',
      highlight: feature === 'unlimited_sightings',
    },
    {
      icon: 'account-group',
      title: 'Community Features',
      description: 'Post and interact with other bird enthusiasts',
      highlight: feature === 'community_post',
    },
    {
      icon: 'download',
      title: 'Offline Mode',
      description: 'Download regional bird packs for offline use',
      highlight: feature === 'offline_mode',
    },
    {
      icon: 'bell',
      title: 'Rare Bird Alerts',
      description: 'Get notified about rare species spotted nearby',
      highlight: feature === 'push_notifications',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#059669', '#10b981', '#34d399']}
          style={styles.header}
        >
          <Animated.View
            style={[
              styles.headerContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.crownIcon}>
              <Icon name="crown" size={48} color="#ffffff" />
            </View>
            <Text style={styles.headerTitle}>Go Premium</Text>
            <Text style={styles.headerSubtitle}>
              Unlock the full potential of BirdScope AI
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Feature Highlight */}
        {feature && (
          <Card style={styles.featureHighlight}>
            <Card.Content style={styles.featureContent}>
              <Text style={styles.featureTitle}>{getFeatureTitle()}</Text>
              <Text style={styles.featureDescription}>
                {getFeatureDescription()}
              </Text>
              <Badge style={styles.premiumBadge}>Premium Required</Badge>
            </Card.Content>
          </Card>
        )}

        {/* Pricing Plans */}
        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.selectedPlan,
                ]}
              >
                <Card.Content style={styles.planContent}>
                  <View style={styles.planHeader}>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.planPrice}>${plan.price}</Text>
                        <Text style={styles.planInterval}>/{plan.interval}</Text>
                      </View>
                      {plan.id === 'premium_yearly' && (
                        <Badge style={styles.savingsBadge}>Save 17%</Badge>
                      )}
                    </View>
                    
                    <View style={styles.radioButton}>
                      {selectedPlan === plan.id && (
                        <View style={styles.radioButtonSelected} />
                      )}
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          
          {premiumFeatures.map((feat, index) => (
            <List.Item
              key={index}
              title={feat.title}
              description={feat.description}
              left={(props) => (
                <Icon
                  {...props}
                  name={feat.icon}
                  size={24}
                  color={feat.highlight ? '#059669' : '#6b7280'}
                />
              )}
              right={(props) => (
                <Icon
                  {...props}
                  name="check"
                  size={20}
                  color="#059669"
                />
              )}
              style={[
                styles.featureItem,
                feat.highlight && styles.highlightedFeature,
              ]}
              titleStyle={[
                styles.featureItemTitle,
                feat.highlight && styles.highlightedFeatureTitle,
              ]}
              descriptionStyle={styles.featureItemDescription}
            />
          ))}
        </View>

        {/* Free vs Premium Comparison */}
        <Card style={styles.comparisonCard}>
          <Card.Content>
            <Text style={styles.comparisonTitle}>Free vs Premium</Text>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Daily Bird Scans</Text>
              <Text style={styles.freeValue}>3/day</Text>
              <Text style={styles.premiumValue}>Unlimited</Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Migration Maps</Text>
              <Icon name="close" size={16} color="#ef4444" />
              <Icon name="check" size={16} color="#059669" />
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Full Audio Library</Text>
              <Icon name="close" size={16} color="#ef4444" />
              <Icon name="check" size={16} color="#059669" />
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Sighting Storage</Text>
              <Text style={styles.freeValue}>5 max</Text>
              <Text style={styles.premiumValue}>Unlimited</Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Community Posting</Text>
              <Icon name="close" size={16} color="#ef4444" />
              <Icon name="check" size={16} color="#059669" />
            </View>
          </Card.Content>
        </Card>

        {/* Subscribe Button */}
        <View style={styles.subscribeContainer}>
          <Button
            mode="contained"
            onPress={handleSubscribe}
            style={styles.subscribeButton}
            contentStyle={styles.subscribeButtonContent}
            loading={subscribing}
            disabled={subscribing}
          >
            {subscribing ? 'Processing...' : `Start Premium - $${plans.find(p => p.id === selectedPlan)?.price || '4.99'}`}
          </Button>
          
          <Text style={styles.disclaimer}>
            Cancel anytime. 7-day free trial included.
          </Text>
          
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            labelStyle={styles.laterButtonLabel}
            disabled={subscribing}
          >
            Maybe Later
          </Button>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  crownIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  featureHighlight: {
    margin: 16,
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  featureContent: {
    paddingVertical: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  premiumBadge: {
    backgroundColor: '#fbbf24',
    alignSelf: 'flex-start',
  },
  plansContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  planCard: {
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlan: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  planContent: {
    paddingVertical: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  planInterval: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 2,
  },
  savingsBadge: {
    backgroundColor: '#10b981',
    alignSelf: 'flex-start',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  featuresContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  featureItem: {
    paddingVertical: 8,
  },
  highlightedFeature: {
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
  },
  featureItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  highlightedFeatureTitle: {
    color: '#059669',
  },
  featureItemDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  comparisonCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  comparisonFeature: {
    flex: 2,
    fontSize: 14,
    color: '#1f2937',
  },
  freeValue: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  premiumValue: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subscribeContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  subscribeButton: {
    backgroundColor: '#059669',
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
  },
  subscribeButtonContent: {
    paddingVertical: 12,
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  laterButtonLabel: {
    color: '#6b7280',
    fontSize: 16,
  },
  bottomSpacing: {
    height: 40,
  },
});