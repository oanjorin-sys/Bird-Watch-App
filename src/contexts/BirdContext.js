import React, { createContext, useContext, useState, useCallback } from 'react';
import { birdAPI } from '../utils/api';
import { useAuth } from './AuthContext';

const BirdContext = createContext({});

export const useBird = () => {
  const context = useContext(BirdContext);
  if (!context) {
    throw new Error('useBird must be used within a BirdProvider');
  }
  return context;
};

export const BirdProvider = ({ children }) => {
  const { authToken, user, updateUser } = useAuth();
  const [currentBird, setCurrentBird] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [communityFeed, setCommunityFeed] = useState([]);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [nearbyBirds, setNearbyBirds] = useState([]);

  const identifyBird = useCallback(async (imageUri, location = null) => {
    if (!authToken) {
      throw new Error('Authentication required');
    }

    try {
      setIsIdentifying(true);
      
      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'bird-photo.jpg',
      });

      if (location) {
        formData.append('location', JSON.stringify(location));
      }

      const result = await birdAPI.identifyBird(formData, authToken);
      
      if (result) {
        setCurrentBird(result);
        
        // Update user's scan count
        if (user) {
          const today = new Date().toDateString();
          const lastScanDate = user.last_scan_date ? new Date(user.last_scan_date).toDateString() : '';
          
          if (today !== lastScanDate) {
            // Reset daily count for new day
            await updateUser({
              scans_today: 1,
              last_scan_date: new Date().toISOString()
            });
          } else {
            // Increment daily count
            await updateUser({
              scans_today: (user.scans_today || 0) + 1,
              last_scan_date: new Date().toISOString()
            });
          }
        }
        
        return result;
      }
      
      throw new Error('Failed to identify bird');
    } catch (error) {
      console.error('Bird identification error:', error);
      throw error;
    } finally {
      setIsIdentifying(false);
    }
  }, [authToken, user, updateUser]);

  const getMySightings = useCallback(async () => {
    if (!authToken) return [];

    try {
      const response = await birdAPI.getMySightings(authToken);
      setSightings(response.sightings || []);
      return response.sightings || [];
    } catch (error) {
      console.error('Error fetching sightings:', error);
      return [];
    }
  }, [authToken]);

  const deleteSighting = useCallback(async (sightingId) => {
    if (!authToken) return false;

    try {
      await birdAPI.deleteSighting(sightingId, authToken);
      setSightings(prev => prev.filter(s => s.id !== sightingId));
      return true;
    } catch (error) {
      console.error('Error deleting sighting:', error);
      return false;
    }
  }, [authToken]);

  const getCommunityFeed = useCallback(async (limit = 20, offset = 0) => {
    try {
      const response = await birdAPI.getCommunityFeed(limit, offset);
      
      if (offset === 0) {
        setCommunityFeed(response.posts || []);
      } else {
        setCommunityFeed(prev => [...prev, ...(response.posts || [])]);
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching community feed:', error);
      return { posts: [], total: 0 };
    }
  }, []);

  const createCommunityPost = useCallback(async (birdId, caption, location = null) => {
    if (!authToken) {
      throw new Error('Authentication required');
    }

    try {
      const formData = new FormData();
      formData.append('bird_id', birdId);
      formData.append('caption', caption);
      if (location) {
        formData.append('location', location);
      }

      const response = await birdAPI.createCommunityPost(formData, authToken);
      
      if (response.post) {
        setCommunityFeed(prev => [response.post, ...prev]);
        return response.post;
      }
      
      throw new Error('Failed to create post');
    } catch (error) {
      console.error('Error creating community post:', error);
      throw error;
    }
  }, [authToken]);

  const likePost = useCallback(async (postId) => {
    if (!authToken) return false;

    try {
      const response = await birdAPI.likePost(postId, authToken);
      
      if (response.likes !== undefined) {
        setCommunityFeed(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, likes: response.likes }
              : post
          )
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  }, [authToken]);

  const getNearbyBirds = useCallback(async (latitude, longitude, radius = 25) => {
    try {
      const response = await birdAPI.getNearbyBirds(latitude, longitude, radius);
      setNearbyBirds(response || []);
      return response || [];
    } catch (error) {
      console.error('Error fetching nearby birds:', error);
      return [];
    }
  }, []);

  const getBirdDetail = useCallback(async (birdId) => {
    try {
      const response = await birdAPI.getBirdDetail(birdId);
      return response;
    } catch (error) {
      console.error('Error fetching bird detail:', error);
      throw error;
    }
  }, []);

  const searchBirds = useCallback(async (query) => {
    try {
      const response = await birdAPI.searchBirds(query);
      return response.birds || [];
    } catch (error) {
      console.error('Error searching birds:', error);
      return [];
    }
  }, []);

  const getPopularBirds = useCallback(async () => {
    try {
      const response = await birdAPI.getPopularBirds();
      return response.popular_birds || [];
    } catch (error) {
      console.error('Error fetching popular birds:', error);
      return [];
    }
  }, []);

  const getUserStats = useCallback(async () => {
    if (!authToken) return null;

    try {
      const response = await birdAPI.getUserStats(authToken);
      return response;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }, [authToken]);

  const value = {
    currentBird,
    setCurrentBird,
    sightings,
    communityFeed,
    nearbyBirds,
    isIdentifying,
    
    // Actions
    identifyBird,
    getMySightings,
    deleteSighting,
    getCommunityFeed,
    createCommunityPost,
    likePost,
    getNearbyBirds,
    getBirdDetail,
    searchBirds,
    getPopularBirds,
    getUserStats,
  };

  return (
    <BirdContext.Provider value={value}>
      {children}
    </BirdContext.Provider>
  );
};