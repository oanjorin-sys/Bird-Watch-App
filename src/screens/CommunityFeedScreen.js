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
  Button,
  IconButton,
  Badge,
  TextInput,
  Modal,
  Portal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useBird } from '../contexts/BirdContext';
import { utils } from '../utils/api';
import { useFocusEffect } from '@react-navigation/native';

export default function CommunityFeedScreen({ navigation }) {
  const { user, canAccessPremiumFeature } = useAuth();
  const { communityFeed, getCommunityFeed, likePost, createCommunityPost } = useBird();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [selectedBirdId, setSelectedBirdId] = useState('');
  const [posting, setPosting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [])
  );

  const loadFeed = async () => {
    try {
      setLoading(true);
      await getCommunityFeed(20, 0);
    } catch (error) {
      utils.showError('Failed to load community feed');
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    try {
      await getCommunityFeed(20, communityFeed.length);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const handleLike = async (postId) => {
    try {
      await likePost(postId);
    } catch (error) {
      utils.showError('Failed to like post');
    }
  };

  const handleCreatePost = () => {
    if (!canAccessPremiumFeature('community_post')) {
      navigation.navigate('PremiumUpsell', { feature: 'community_post' });
      return;
    }
    
    setShowCreatePost(true);
  };

  const submitPost = async () => {
    if (!newPostCaption.trim()) {
      utils.showError('Please enter a caption for your post');
      return;
    }

    if (!selectedBirdId) {
      utils.showError('Please select a bird for your post');
      return;
    }

    setPosting(true);
    
    try {
      await createCommunityPost(selectedBirdId, newPostCaption.trim());
      
      setShowCreatePost(false);
      setNewPostCaption('');
      setSelectedBirdId('');
      
      utils.showSuccess('Post shared with the community!');
    } catch (error) {
      utils.showError(error.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return postTime.toLocaleDateString();
  };

  const renderPost = ({ item }) => (
    <Card style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Icon name="account" size={24} color="#6b7280" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user_name}</Text>
            <Text style={styles.postTime}>{formatTimeAgo(item.timestamp)}</Text>
          </View>
        </View>
        
        <IconButton
          icon="dots-vertical"
          size={20}
          onPress={() => {
            // Show post options menu
            Alert.alert(
              'Post Options',
              'What would you like to do?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Report', onPress: () => utils.showSuccess('Post reported') },
              ]
            );
          }}
        />
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('BirdDetail', { birdId: item.bird_id })}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.image_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <Card.Content style={styles.postContent}>
        <View style={styles.birdInfo}>
          <Text style={styles.birdName}>{item.common_name}</Text>
          <Text style={styles.scientificName}>{item.scientific_name}</Text>
        </View>
        
        <Text style={styles.caption}>{item.caption}</Text>
        
        {item.location && (
          <View style={styles.locationInfo}>
            <Icon name="map-marker" size={14} color="#6b7280" />
            <Text style={styles.locationText}>{item.location.name}</Text>
          </View>
        )}
      </Card.Content>

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Icon name="heart" size={20} color="#ef4444" />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => utils.showSuccess('Comments feature coming soon!')}
        >
          <Icon name="comment" size={20} color="#6b7280" />
          <Text style={styles.actionText}>{item.comments.length}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => utils.showSuccess('Share feature coming soon!')}
        >
          <Icon name="share" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="account-group" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Posts Yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share a bird sighting with the community!
      </Text>
      {canAccessPremiumFeature('community_post') ? (
        <Button
          mode="contained"
          onPress={handleCreatePost}
          style={styles.emptyButton}
          icon="plus"
        >
          Create First Post
        </Button>
      ) : (
        <Button
          mode="contained"
          onPress={() => navigation.navigate('PremiumUpsell', { feature: 'community_post' })}
          style={styles.emptyButton}
          icon="crown"
        >
          Upgrade to Post
        </Button>
      )}
    </View>
  );

  const mockBirds = [
    { bird_id: 'american_robin', common_name: 'American Robin' },
    { bird_id: 'northern_cardinal', common_name: 'Northern Cardinal' },
    { bird_id: 'bald_eagle', common_name: 'Bald Eagle' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Feed</Text>
        <Badge style={styles.postCount}>
          {communityFeed.length} posts
        </Badge>
      </View>

      {/* Feed List */}
      <FlatList
        data={communityFeed}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Post FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreatePost}
        label="Share"
      />

      {/* Create Post Modal */}
      <Portal>
        <Modal
          visible={showCreatePost}
          onDismiss={() => setShowCreatePost(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.createPostCard}>
            <Card.Content>
              <Text style={styles.modalTitle}>Share a Bird Sighting</Text>
              
              {/* Bird Selection */}
              <Text style={styles.fieldLabel}>Select Bird</Text>
              <View style={styles.birdSelection}>
                {mockBirds.map((bird) => (
                  <TouchableOpacity
                    key={bird.bird_id}
                    style={[
                      styles.birdOption,
                      selectedBirdId === bird.bird_id && styles.selectedBird,
                    ]}
                    onPress={() => setSelectedBirdId(bird.bird_id)}
                  >
                    <Text
                      style={[
                        styles.birdOptionText,
                        selectedBirdId === bird.bird_id && styles.selectedBirdText,
                      ]}
                    >
                      {bird.common_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Caption Input */}
              <Text style={styles.fieldLabel}>Caption</Text>
              <TextInput
                mode="outlined"
                multiline
                numberOfLines={4}
                value={newPostCaption}
                onChangeText={setNewPostCaption}
                placeholder="Share your bird watching experience..."
                style={styles.captionInput}
                outlineColor="#e5e7eb"
                activeOutlineColor="#059669"
              />
              
              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowCreatePost(false)}
                  style={styles.cancelButton}
                  disabled={posting}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={submitPost}
                  style={styles.postButton}
                  loading={posting}
                  disabled={posting}
                >
                  Share Post
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  postCount: {
    backgroundColor: '#059669',
  },
  listContent: {
    padding: 16,
  },
  postCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  postTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  postImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f3f4f6',
  },
  postContent: {
    paddingTop: 12,
  },
  birdInfo: {
    marginBottom: 8,
  },
  birdName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  caption: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
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
  modalContainer: {
    padding: 20,
  },
  createPostCard: {
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  birdSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  birdOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedBird: {
    backgroundColor: '#059669',
  },
  birdOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedBirdText: {
    color: '#ffffff',
  },
  captionInput: {
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#6b7280',
  },
  postButton: {
    flex: 1,
    backgroundColor: '#059669',
  },
});