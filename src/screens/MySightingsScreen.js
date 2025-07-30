import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  FAB,
  Searchbar,
  Button,
  Badge,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useBird } from '../contexts/BirdContext';
import { utils } from '../utils/api';
import { useFocusEffect } from '@react-navigation/native';

export default function MySightingsScreen({ navigation }) {
  const { user, canAccessPremiumFeature } = useAuth();
  const { sightings, getMySightings, deleteSighting } = useBird();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSightings, setFilteredSightings] = useState([]);
  const [sortBy, setSortBy] = useState('date'); // date, name, confidence
  const [filterBy, setFilterBy] = useState('all'); // all, this_week, this_month
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedSighting, setSelectedSighting] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSightings();
    }, [])
  );

  useEffect(() => {
    filterAndSortSightings();
  }, [sightings, searchQuery, sortBy, filterBy]);

  const loadSightings = async () => {
    try {
      await getMySightings();
    } catch (error) {
      utils.showError('Failed to load sightings');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSightings();
    setRefreshing(false);
  };

  const filterAndSortSightings = () => {
    let filtered = [...sightings];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(sighting =>
        sighting.common_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sighting.scientific_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by time period
    const now = new Date();
    if (filterBy === 'this_week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(sighting =>
        new Date(sighting.timestamp) >= weekAgo
      );
    } else if (filterBy === 'this_month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(sighting =>
        new Date(sighting.timestamp) >= monthAgo
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.common_name.localeCompare(b.common_name);
        case 'confidence':
          return b.confidence - a.confidence;
        case 'date':
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

    setFilteredSightings(filtered);
  };

  const handleDeleteSighting = async (sightingId) => {
    Alert.alert(
      'Delete Sighting',
      'Are you sure you want to delete this sighting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteSighting(sightingId);
            if (success) {
              utils.showSuccess('Sighting deleted');
            } else {
              utils.showError('Failed to delete sighting');
            }
          },
        },
      ]
    );
  };

  const exportSightings = () => {
    if (!canAccessPremiumFeature('unlimited_sightings')) {
      navigation.navigate('PremiumUpsell', { feature: 'export_sightings' });
      return;
    }
    
    // Mock export functionality
    utils.showSuccess('Sightings exported to your downloads folder');
  };

  const renderSightingItem = ({ item }) => (
    <Card style={styles.sightingCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('BirdDetail', { birdId: item.bird_id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.birdImage}
            resizeMode="cover"
          />
          
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <View style={styles.nameSection}>
                <Text style={styles.commonName} numberOfLines={1}>
                  {item.common_name}
                </Text>
                <Text style={styles.scientificName} numberOfLines={1}>
                  {item.scientific_name}
                </Text>
              </View>
              
              <View style={styles.cardActions}>
                <Badge style={styles.confidenceBadge}>
                  {utils.formatConfidence(item.confidence)}
                </Badge>
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => {
                    setSelectedSighting(item);
                    setShowOptionsMenu(true);
                  }}
                />
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              <View style={styles.dateLocation}>
                <Icon name="calendar" size={14} color="#6b7280" />
                <Text style={styles.dateText}>
                  {utils.formatDate(item.timestamp)}
                </Text>
              </View>
              
              {item.location && (
                <View style={styles.dateLocation}>
                  <Icon name="map-marker" size={14} color="#6b7280" />
                  <Text style={styles.locationText}>
                    Location recorded
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="bird" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Sightings Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start identifying birds to build your personal collection
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Camera')}
        style={styles.emptyButton}
        icon="camera"
      >
        Identify Your First Bird
      </Button>
    </View>
  );

  const getSightingsStats = () => {
    const uniqueSpecies = new Set(sightings.map(s => s.bird_id)).size;
    const thisWeek = sightings.filter(s => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(s.timestamp) >= weekAgo;
    }).length;
    
    return { total: sightings.length, unique: uniqueSpecies, thisWeek };
  };

  const stats = getSightingsStats();
  const hasLimitReached = !canAccessPremiumFeature('unlimited_sightings') && sightings.length >= 5;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Sightings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.unique}</Text>
          <Text style={styles.statLabel}>Unique Species</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.thisWeek}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search birds..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />
        
        <Menu
          visible={showSortMenu}
          onDismiss={() => setShowSortMenu(false)}
          anchor={
            <IconButton
              icon="sort"
              size={24}
              onPress={() => setShowSortMenu(true)}
              style={styles.sortButton}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setSortBy('date');
              setShowSortMenu(false);
            }}
            title="Sort by Date"
            leadingIcon={sortBy === 'date' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setSortBy('name');
              setShowSortMenu(false);
            }}
            title="Sort by Name"
            leadingIcon={sortBy === 'name' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setSortBy('confidence');
              setShowSortMenu(false);
            }}
            title="Sort by Confidence"
            leadingIcon={sortBy === 'confidence' ? 'check' : undefined}
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setFilterBy('all');
              setShowSortMenu(false);
            }}
            title="All Time"
            leadingIcon={filterBy === 'all' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setFilterBy('this_week');
              setShowSortMenu(false);
            }}
            title="This Week"
            leadingIcon={filterBy === 'this_week' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setFilterBy('this_month');
              setShowSortMenu(false);
            }}
            title="This Month"
            leadingIcon={filterBy === 'this_month' ? 'check' : undefined}
          />
        </Menu>
      </View>

      {/* Storage Limit Warning */}
      {hasLimitReached && (
        <Card style={styles.limitWarning}>
          <Card.Content style={styles.limitContent}>
            <Icon name="alert" size={24} color="#f59e0b" />
            <View style={styles.limitText}>
              <Text style={styles.limitTitle}>Storage Limit Reached</Text>
              <Text style={styles.limitSubtitle}>
                Upgrade to Premium for unlimited sighting storage
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('PremiumUpsell')}
              style={styles.upgradeButton}
              compact
            >
              Upgrade
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Sightings List */}
      <FlatList
        data={filteredSightings}
        renderItem={renderSightingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Sighting Options Menu */}
      <Menu
        visible={showOptionsMenu}
        onDismiss={() => setShowOptionsMenu(false)}
        anchor={<View />}
      >
        <Menu.Item
          onPress={() => {
            setShowOptionsMenu(false);
            if (selectedSighting) {
              navigation.navigate('BirdDetail', { birdId: selectedSighting.bird_id });
            }
          }}
          title="View Details"
          leadingIcon="information"
        />
        <Menu.Item
          onPress={() => {
            setShowOptionsMenu(false);
            // Share functionality
            utils.showSuccess('Sharing feature coming soon!');
          }}
          title="Share"
          leadingIcon="share"
        />
        <Menu.Item
          onPress={() => {
            setShowOptionsMenu(false);
            if (selectedSighting) {
              handleDeleteSighting(selectedSighting.id);
            }
          }}
          title="Delete"
          leadingIcon="delete"
        />
      </Menu>

      {/* Export FAB */}
      {sightings.length > 0 && (
        <FAB
          icon="export"
          style={styles.fab}
          onPress={exportSightings}
          label="Export"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  searchbar: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    elevation: 0,
  },
  searchInput: {
    fontSize: 16,
  },
  sortButton: {
    marginLeft: 8,
  },
  limitWarning: {
    margin: 16,
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  limitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  limitText: {
    flex: 1,
    marginLeft: 12,
  },
  limitTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
  },
  limitSubtitle: {
    fontSize: 12,
    color: '#b45309',
  },
  upgradeButton: {
    backgroundColor: '#f59e0b',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  sightingCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  birdImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameSection: {
    flex: 1,
  },
  commonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceBadge: {
    backgroundColor: '#059669',
    marginRight: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#059669',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#059669',
  },
});