import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  FAB,
  Card,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useBird } from '../contexts/BirdContext';
import { utils } from '../utils/api';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ navigation }) {
  const { user, getRemainingScans, canAccessPremiumFeature } = useAuth();
  const { identifyBird, isIdentifying } = useBird();
  
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  
  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    // Camera permissions
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    
    // Media library permissions
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    // Location permissions
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    setHasPermission(cameraStatus === 'granted');
    
    if (locationStatus === 'granted') {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) return;

    // Check scan limits for free users
    const remainingScans = getRemainingScans();
    if (remainingScans === 0) {
      Alert.alert(
        'Daily Limit Reached',
        'You have reached your daily limit of 3 bird scans. Upgrade to Premium for unlimited scans!',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => navigation.navigate('PremiumUpsell') 
          },
        ]
      );
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });
      
      setCapturedImage(photo.uri);
    } catch (error) {
      utils.showError('Failed to take picture. Please try again.');
    }
  };

  const pickImage = async () => {
    // Check scan limits for free users
    const remainingScans = getRemainingScans();
    if (remainingScans === 0) {
      Alert.alert(
        'Daily Limit Reached',
        'You have reached your daily limit of 3 bird scans. Upgrade to Premium for unlimited scans!',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => navigation.navigate('PremiumUpsell') 
          },
        ]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      utils.showError('Failed to pick image. Please try again.');
    }
  };

  const identifyBirdPhoto = async () => {
    if (!capturedImage) return;

    try {
      const result = await identifyBird(capturedImage, location);
      
      if (result) {
        navigation.navigate('ScanResults', { 
          birdData: result,
          imageUri: capturedImage,
          location: location 
        });
        setCapturedImage(null);
      }
    } catch (error) {
      if (error.message.includes('Daily scan limit reached')) {
        Alert.alert(
          'Upgrade to Premium',
          'You have reached your daily limit. Upgrade to Premium for unlimited bird identification!',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Upgrade Now', 
              onPress: () => navigation.navigate('PremiumUpsell') 
            },
          ]
        );
      } else {
        utils.showError(error.message || 'Failed to identify bird');
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const toggleCameraType = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="camera-off" size={64} color="#6b7280" />
        <Text style={styles.noPermissionText}>No access to camera</Text>
        <Button 
          mode="contained" 
          onPress={requestPermissions}
          style={styles.permissionButton}
        >
          Grant Permission
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bird Identification</Text>
        <View style={styles.headerRight}>
          {getRemainingScans() !== -1 && (
            <Badge style={styles.scanBadge}>
              {getRemainingScans()} scans left
            </Badge>
          )}
        </View>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {capturedImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            
            {isIdentifying && (
              <View style={styles.identifyingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.identifyingText}>Identifying bird...</Text>
              </View>
            )}
            
            <View style={styles.previewActions}>
              <Button
                mode="outlined"
                onPress={retakePicture}
                style={[styles.previewButton, styles.retakeButton]}
                labelStyle={styles.previewButtonLabel}
                disabled={isIdentifying}
              >
                Retake
              </Button>
              <Button
                mode="contained"
                onPress={identifyBirdPhoto}
                style={[styles.previewButton, styles.identifyButton]}
                labelStyle={styles.previewButtonLabel}
                disabled={isIdentifying}
              >
                {isIdentifying ? 'Identifying...' : 'Identify Bird'}
              </Button>
            </View>
          </View>
        ) : (
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            flashMode={flashMode}
            onCameraReady={() => setIsCameraReady(true)}
          >
            <View style={styles.cameraOverlay}>
              {/* Top Controls */}
              <View style={styles.topControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleFlash}
                >
                  <Icon
                    name={flashMode === Camera.Constants.FlashMode.off ? 'flash-off' : 'flash'}
                    size={24}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </View>

              {/* Center Guide */}
              <View style={styles.centerGuide}>
                <View style={styles.focusFrame} />
                <Text style={styles.guideText}>
                  Center the bird in the frame
                </Text>
              </View>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                <TouchableOpacity
                  style={styles.galleryButton}
                  onPress={pickImage}
                >
                  <Icon name="image" size={24} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                  disabled={!isCameraReady}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={toggleCameraType}
                >
                  <Icon name="camera-flip" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </Camera>
        )}
      </View>

      {/* Tips Card */}
      {!capturedImage && (
        <Card style={styles.tipsCard}>
          <Card.Content>
            <Text style={styles.tipsTitle}>📸 Photography Tips</Text>
            <Text style={styles.tipsText}>
              • Get close to the bird (within 10-15 feet){'\n'}
              • Ensure good lighting{'\n'}
              • Keep the bird in focus{'\n'}
              • Avoid backlit shots{'\n'}
              • Include the full bird in frame
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <FAB
          icon="book-open-variant"
          style={styles.fab}
          onPress={() => navigation.navigate('MySightings')}
          label="My Sightings"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  noPermissionText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    backgroundColor: '#059669',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#059669',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanBadge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  guideText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 50,
    paddingBottom: 30,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'cover',
  },
  identifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  identifyingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
    fontWeight: 'bold',
  },
  previewActions: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  retakeButton: {
    borderColor: '#ffffff',
  },
  identifyButton: {
    backgroundColor: '#059669',
  },
  previewButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  quickActions: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  fab: {
    backgroundColor: '#059669',
  },
});