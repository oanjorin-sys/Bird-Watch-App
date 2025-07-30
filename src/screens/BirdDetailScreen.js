import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Badge,
  List,
  Divider,
} from 'react-native-paper';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';
import { useAuth } from '../contexts/AuthContext';
import { useBird } from '../contexts/BirdContext';
import { utils } from '../utils/api';

const { width, height } = Dimensions.get('window');

export default function BirdDetailScreen({ route, navigation }) {
  const { birdId, initialTab = 'overview' } = route.params;
  const { canAccessPremiumFeature } = useAuth();
  const { getBirdDetail } = useBird();
  
  const [birdData, setBirdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(0);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadBirdDetail();
    
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [birdId]);

  const loadBirdDetail = async () => {
    try {
      setLoading(true);
      const data = await getBirdDetail(birdId);
      setBirdData(data);
    } catch (error) {
      utils.showError('Failed to load bird details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (audioUrl, index = 0) => {
    try {
      if (!canAccessPremiumFeature('full_audio')) {
        navigation.navigate('PremiumUpsell', { feature: 'full_audio' });
        return;
      }

      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      setSelectedAudio(index);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          setSelectedAudio(0);
        }
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      utils.showError('Failed to play audio');
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
      setSelectedAudio(0);
    }
  };

  const renderMigrationMap = () => {
    if (!canAccessPremiumFeature('migration_maps')) {
      return (
        <Card style={styles.premiumCard}>
          <Card.Content style={styles.premiumContent}>
            <Icon name="crown" size={48} color="#fbbf24" />
            <Text style={styles.premiumTitle}>Interactive Migration Maps</Text>
            <Text style={styles.premiumSubtitle}>
              View detailed migration routes, seasonal patterns, and breeding/winter ranges
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('PremiumUpsell', { feature: 'migration_maps' })}
              style={styles.upgradeButton}
              icon="crown"
            >
              Upgrade to Premium
            </Button>
          </Card.Content>
        </Card>
      );
    }

    // Mock interactive map - in production, use actual map component
    const mapHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .map-container { 
              width: 100%; 
              height: 400px; 
              background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
            }
            .map-title { color: #059669; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .map-subtitle { color: #6b7280; font-size: 14px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="map-container">
            <div class="map-title">🗺️ Interactive Migration Map</div>
            <div class="map-subtitle">Migration routes for ${birdData?.common_name}<br/>Spring & Fall patterns shown</div>
          </div>
          <script>
            // Mock interactive map functionality
            console.log('Migration map loaded for ${birdData?.common_name}');
          </script>
        </body>
      </html>
    `;

    return (
      <WebView
        source={{ html: mapHtml }}
        style={styles.webViewMap}
        scrollEnabled={false}
      />
    );
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Description */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{birdData.description}</Text>
        </Card.Content>
      </Card>

      {/* Quick Facts Grid */}
      <View style={styles.factsGrid}>
        <Card style={styles.factCard}>
          <Card.Content style={styles.factContent}>
            <Icon name="home" size={24} color="#059669" />
            <Text style={styles.factLabel}>Habitat</Text>
            <Text style={styles.factValue}>{birdData.habitat.primary}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.factCard}>
          <Card.Content style={styles.factContent}>
            <Icon name="heart" size={24} color="#ef4444" />
            <Text style={styles.factLabel}>Mating Season</Text>
            <Text style={styles.factValue}>{birdData.mating_season.period}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.factCard}>
          <Card.Content style={styles.factContent}>
            <Icon name="food-apple" size={24} color="#f59e0b" />
            <Text style={styles.factLabel}>Diet</Text>
            <Text style={styles.factValue}>{birdData.diet.primary}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.factCard}>
          <Card.Content style={styles.factContent}>
            <Icon 
              name={utils.getRarityIcon(birdData.rarity.status)} 
              size={24} 
              color={utils.getRarityColor(birdData.rarity.status)} 
            />
            <Text style={styles.factLabel}>Conservation</Text>
            <Text style={styles.factValue}>{birdData.rarity.conservation_status}</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Audio Samples */}
      <Card style={styles.audioCard}>
        <Card.Content>
          <View style={styles.audioHeader}>
            <Text style={styles.sectionTitle}>Sounds & Calls</Text>
            {birdData.premium_locked?.full_audio && (
              <Chip icon="crown" style={styles.premiumChip}>Premium</Chip>
            )}
          </View>
          
          <View style={styles.audioList}>
            <TouchableOpacity
              style={[styles.audioItem, selectedAudio === 0 && isPlaying && styles.activeAudio]}
              onPress={() => playAudio(birdData.audio.mating_call, 0)}
            >
              <View style={styles.audioInfo}>
                <Icon name={isPlaying && selectedAudio === 0 ? 'pause' : 'play'} size={20} color="#059669" />
                <Text style={styles.audioTitle}>Mating Call</Text>
              </View>
              <Text style={styles.audioDescription}>{birdData.audio.description}</Text>
            </TouchableOpacity>
            
            {birdData.xeno_canto_recordings?.slice(0, 3).map((recording, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.audioItem, selectedAudio === index + 1 && isPlaying && styles.activeAudio]}
                onPress={() => playAudio(recording.file_url, index + 1)}
              >
                <View style={styles.audioInfo}>
                  <Icon name={isPlaying && selectedAudio === index + 1 ? 'pause' : 'play'} size={20} color="#059669" />
                  <Text style={styles.audioTitle}>{recording.description || `Recording ${index + 1}`}</Text>
                </View>
                <Text style={styles.audioDescription}>{recording.location}, {recording.country}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderHabitatTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Habitat & Range</Text>
          
          <List.Section>
            <List.Item
              title="Primary Habitat"
              description={birdData.habitat.primary}
              left={props => <Icon {...props} name="home" size={24} color="#059669" />}
            />
            <Divider />
            <List.Item
              title="Native Regions"
              description={birdData.native_regions.original_range}
              left={props => <Icon {...props} name="earth" size={24} color="#059669" />}
            />
            <Divider />
            <List.Item
              title="Countries Found"
              description={birdData.habitat.countries.join(', ')}
              left={props => <Icon {...props} name="flag" size={24} color="#059669" />}
            />
            <Divider />
            <List.Item
              title="Continents"
              description={birdData.habitat.continents.join(', ')}
              left={props => <Icon {...props} name="map" size={24} color="#059669" />}
            />
          </List.Section>
        </Card.Content>
      </Card>
    </View>
  );

  const renderMigrationTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Migration Patterns</Text>
          <Text style={styles.description}>{birdData.migration_patterns.summary}</Text>
          
          <List.Section style={styles.migrationDetails}>
            <List.Item
              title="Migration Timing"
              description={birdData.migration_patterns.timing}
              left={props => <Icon {...props} name="clock" size={24} color="#059669" />}
            />
            <List.Item
              title="Distance Traveled"
              description={birdData.migration_patterns.distance}
              left={props => <Icon {...props} name="map-marker-distance" size={24} color="#059669" />}
            />
            <List.Item
              title="Migration Routes"
              description={birdData.migration_patterns.routes.join(', ')}
              left={props => <Icon {...props} name="route" size={24} color="#059669" />}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* Interactive Map */}
      <Card style={styles.mapCard}>
        <Card.Content>
          <View style={styles.mapHeader}>
            <Text style={styles.sectionTitle}>Migration Map</Text>
            {birdData.premium_locked?.migration_maps && (
              <Chip icon="crown" style={styles.premiumChip}>Premium</Chip>
            )}
          </View>
          {renderMigrationMap()}
        </Card.Content>
      </Card>
    </View>
  );

  const renderConservationTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Conservation Status</Text>
          
          <View style={styles.conservationStatus}>
            <View style={styles.statusBadge}>
              <Icon 
                name={utils.getRarityIcon(birdData.rarity.status)} 
                size={32} 
                color={utils.getRarityColor(birdData.rarity.status)} 
              />
              <Text style={[styles.statusText, { color: utils.getRarityColor(birdData.rarity.status) }]}>
                {birdData.rarity.conservation_status}
              </Text>
            </View>
            
            <Text style={styles.populationText}>
              Global Population: {birdData.rarity.global_population}
            </Text>
            <Text style={styles.trendText}>
              Population Trend: {birdData.rarity.population_trend}
            </Text>
          </View>

          <List.Section>
            <List.Subheader>Primary Threats</List.Subheader>
            {birdData.rarity.threats.map((threat, index) => (
              <List.Item
                key={index}
                title={threat}
                left={props => <Icon {...props} name="alert-circle" size={20} color="#ef4444" />}
              />
            ))}
          </List.Section>
        </Card.Content>
      </Card>

      <Card style={styles.historyCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>History & Culture</Text>
          <Text style={styles.description}>{birdData.history_culture.cultural_significance}</Text>
          
          <List.Section>
            <List.Item
              title="First Described"
              description={birdData.history_culture.first_described}
              left={props => <Icon {...props} name="book-open-variant" size={20} color="#059669" />}
            />
            <List.Item
              title="Folklore"
              description={birdData.history_culture.folklore}
              left={props => <Icon {...props} name="drama-masks" size={20} color="#059669" />}
            />
          </List.Section>
        </Card.Content>
      </Card>
    </View>
  );

  if (loading || !birdData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading bird details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {birdData.common_name}
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: birdData.images.primary }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.birdName}>{birdData.common_name}</Text>
            <Text style={styles.scientificName}>{birdData.scientific_name}</Text>
            <View style={styles.rarityBadge}>
              <Icon 
                name={utils.getRarityIcon(birdData.rarity.status)} 
                size={16} 
                color="#ffffff" 
              />
              <Text style={styles.rarityText}>
                {birdData.rarity.status.charAt(0).toUpperCase() + birdData.rarity.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabsRow}>
              {[
                { key: 'overview', label: 'Overview', icon: 'information' },
                { key: 'habitat', label: 'Habitat', icon: 'home' },
                { key: 'migration', label: 'Migration', icon: 'map' },
                { key: 'conservation', label: 'Conservation', icon: 'shield-check' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Icon 
                    name={tab.icon} 
                    size={20} 
                    color={activeTab === tab.key ? '#059669' : '#6b7280'} 
                  />
                  <Text style={[
                    styles.tabLabel,
                    activeTab === tab.key && styles.activeTabLabel
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'habitat' && renderHabitatTab()}
        {activeTab === 'migration' && renderMigrationTab()}
        {activeTab === 'conservation' && renderConservationTab()}

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
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingTop: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
  },
  heroImage: {
    width: width,
    height: 250,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    padding: 20,
  },
  birdName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  rarityText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
  },
  tabLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  activeTabLabel: {
    color: '#059669',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 16,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginHorizontal: -8,
  },
  factCard: {
    width: (width - 48) / 2,
    margin: 8,
    borderRadius: 12,
  },
  factContent: {
    alignItems: 'center',
    padding: 16,
  },
  factLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  factValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  audioCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  audioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumChip: {
    backgroundColor: '#fbbf24',
  },
  audioList: {
    gap: 12,
  },
  audioItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  activeAudio: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#059669',
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  audioDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  migrationDetails: {
    marginTop: 16,
  },
  mapCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  webViewMap: {
    height: 300,
    borderRadius: 12,
  },
  premiumCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  premiumContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400e',
    marginTop: 12,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#b45309',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: '#fbbf24',
  },
  conservationStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  populationText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 4,
  },
  trendText: {
    fontSize: 16,
    color: '#4b5563',
  },
  historyCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  bottomSpacing: {
    height: 40,
  },
});