import React, { useState, useRef, useEffect } from 'react';
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
  Badge,
  Divider,
} from 'react-native-paper';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useBird } from '../contexts/BirdContext';
import { utils } from '../utils/api';

const { width, height } = Dimensions.get('window');

export default function ScanResultsScreen({ route, navigation }) {
  const { birdData, imageUri, location } = route.params;
  const { canAccessPremiumFeature } = useAuth();
  const { createCommunityPost } = useBird();
  
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playAudio = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      if (!canAccessPremiumFeature('full_audio') && !isPlaying) {
        navigation.navigate('PremiumUpsell', { feature: 'full_audio' });
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: birdData.audio.mating_call },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
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
    }
  };

  const shareToCommnity = async () => {
    if (!canAccessPremiumFeature('community_post')) {
      navigation.navigate('PremiumUpsell', { feature: 'community_post' });
      return;
    }

    try {
      await createCommunityPost(
        birdData.bird_id,
        `Just spotted a ${birdData.common_name}! 🐦`,
        location ? `${location.latitude}, ${location.longitude}` : null
      );
      
      utils.showSuccess('Shared to community feed!');
    } catch (error) {
      utils.showError('Failed to share to community');
    }
  };

  const viewMigrationMap = () => {
    if (!canAccessPremiumFeature('migration_maps')) {
      navigation.navigate('PremiumUpsell', { feature: 'migration_maps' });
      return;
    }
    
    // Navigate to migration map view
    navigation.navigate('BirdDetail', { 
      birdId: birdData.bird_id, 
      initialTab: 'migration' 
    });
  };

  const getRarityInfo = () => {
    const rarity = birdData.rarity.status.toLowerCase();
    return {
      color: utils.getRarityColor(rarity),
      icon: utils.getRarityIcon(rarity),
      label: rarity.charAt(0).toUpperCase() + rarity.slice(1),
    };
  };

  const rarityInfo = getRarityInfo();

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
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: imageUri || birdData.images.primary }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.confidenceBadge}>
              <Badge style={styles.confidenceText}>
                {utils.formatConfidence(birdData.confidence)} Confidence
              </Badge>
            </View>
          </View>
        </View>

        {/* Bird Info Header */}
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <View style={styles.nameSection}>
              <Text style={styles.commonName}>{birdData.common_name}</Text>
              <Text style={styles.scientificName}>{birdData.scientific_name}</Text>
              
              <View style={styles.raritySection}>
                <Icon 
                  name={rarityInfo.icon} 
                  size={20} 
                  color={rarityInfo.color} 
                />
                <Text style={[styles.rarityText, { color: rarityInfo.color }]}>
                  {rarityInfo.label}
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={isPlaying ? stopAudio : playAudio}
              >
                <Icon
                  name={isPlaying ? 'pause' : 'play'}
                  size={24}
                  color="#ffffff"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={shareToCommnity}
              >
                <Icon name="share" size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('BirdDetail', { birdId: birdData.bird_id })}
              >
                <Icon name="information" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Description */}
        <Card style={styles.descriptionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description} numberOfLines={showFullDescription ? undefined : 3}>
              {birdData.description}
            </Text>
            <Button
              mode="text"
              onPress={() => setShowFullDescription(!showFullDescription)}
              labelStyle={styles.readMoreButton}
            >
              {showFullDescription ? 'Show Less' : 'Read More'}
            </Button>
          </Card.Content>
        </Card>

        {/* Audio Section */}
        <Card style={styles.audioCard}>
          <Card.Content>
            <View style={styles.audioHeader}>
              <Text style={styles.sectionTitle}>Mating Call</Text>
              {birdData.premium_locked?.full_audio && (
                <Chip
                  icon="crown"
                  style={styles.premiumChip}
                  textStyle={styles.premiumChipText}
                >
                  Premium
                </Chip>
              )}
            </View>
            
            <View style={styles.audioPlayer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={isPlaying ? stopAudio : playAudio}
              >
                <Icon
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="#ffffff"
                />
              </TouchableOpacity>
              
              <View style={styles.audioInfo}>
                <Text style={styles.audioTitle}>
                  {isPlaying ? 'Playing...' : 'Tap to play mating call'}
                </Text>
                <Text style={styles.audioDescription}>
                  {birdData.audio.description}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Key Information Grid */}
        <View style={styles.infoGrid}>
          <Card style={styles.gridCard}>
            <Card.Content style={styles.gridContent}>
              <Icon name="home" size={24} color="#059669" />
              <Text style={styles.gridTitle}>Habitat</Text>
              <Text style={styles.gridValue}>
                {birdData.habitat.primary}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.gridCard}>
            <Card.Content style={styles.gridContent}>
              <Icon name="map-marker" size={24} color="#059669" />
              <Text style={styles.gridTitle}>Native To</Text>
              <Text style={styles.gridValue}>
                {birdData.native_regions.original_range}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.gridCard}>
            <Card.Content style={styles.gridContent}>
              <Icon name="food-apple" size={24} color="#059669" />
              <Text style={styles.gridTitle}>Diet</Text>
              <Text style={styles.gridValue}>
                {birdData.diet.primary}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.gridCard}>
            <Card.Content style={styles.gridContent}>
              <Icon name="heart" size={24} color="#059669" />
              <Text style={styles.gridTitle}>Mating</Text>
              <Text style={styles.gridValue}>
                {birdData.mating_season.period}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Migration Map Preview */}
        <Card style={styles.migrationCard}>
          <Card.Content>
            <View style={styles.migrationHeader}>
              <Text style={styles.sectionTitle}>Migration Pattern</Text>
              {birdData.premium_locked?.migration_maps && (
                <Chip
                  icon="crown"
                  style={styles.premiumChip}
                  textStyle={styles.premiumChipText}
                >
                  Premium
                </Chip>
              )}
            </View>
            
            <Text style={styles.migrationSummary}>
              {birdData.migration_patterns.summary}
            </Text>
            
            <Button
              mode="contained"
              onPress={viewMigrationMap}
              style={styles.migrationButton}
              contentStyle={styles.migrationButtonContent}
              icon="map"
            >
              View Interactive Map
            </Button>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('BirdDetail', { birdId: birdData.bird_id })}
            style={styles.detailButton}
            contentStyle={styles.buttonContent}
            icon="book-open-variant"
          >
            View Full Details
          </Button>
          
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.continueButton}
            contentStyle={styles.buttonContent}
            icon="camera"
          >
            Scan Another Bird
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
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    width: width,
    height: 300,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  confidenceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 4,
  },
  infoContent: {
    padding: 20,
  },
  nameSection: {
    flex: 1,
  },
  commonName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#6b7280',
    marginBottom: 12,
  },
  raritySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rarityText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
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
    marginBottom: 8,
  },
  readMoreButton: {
    color: '#059669',
    fontSize: 14,
  },
  audioCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
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
  premiumChipText: {
    color: '#ffffff',
    fontSize: 12,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  audioDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  gridCard: {
    width: (width - 48) / 2,
    margin: 8,
    borderRadius: 12,
  },
  gridContent: {
    alignItems: 'center',
    padding: 16,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  gridValue: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  migrationCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
  },
  migrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  migrationSummary: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  migrationButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  migrationButtonContent: {
    paddingVertical: 8,
  },
  actionButtons: {
    marginHorizontal: 16,
    marginTop: 8,
    gap: 12,
  },
  detailButton: {
    borderColor: '#059669',
    borderRadius: 8,
  },
  continueButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  bottomSpacing: {
    height: 40,
  },
});