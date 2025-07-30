import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import {
  Text,
  Card,
  List,
  Button,
  Divider,
  Badge,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useBird } from '../contexts/BirdContext';
import { utils } from '../utils/api';

export default function SettingsScreen({ navigation }) {
  const { user, logout, updateUser, checkSubscriptionStatus, canAccessPremiumFeature } = useAuth();
  const { getUserStats } = useBird();
  
  const [userStats, setUserStats] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const stats = await getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      utils.showError('Name cannot be empty');
      return;
    }

    if (!utils.isValidEmail(editEmail)) {
      utils.showError('Please enter a valid email address');
      return;
    }

    try {
      await updateUser({
        full_name: editName.trim(),
        email: editEmail.trim(),
      });
      
      setShowEditProfile(false);
      utils.showSuccess('Profile updated successfully');
    } catch (error) {
      utils.showError('Failed to update profile');
    }
  };

  const getSubscriptionDisplay = () => {
    const plan = checkSubscriptionStatus();
    switch (plan) {
      case 'premium_monthly':
        return { name: 'Premium Monthly', color: '#059669' };
      case 'premium_yearly':
        return { name: 'Premium Yearly', color: '#059669' };
      default:
        return { name: 'Free Plan', color: '#6b7280' };
    }
  };

  const subscriptionInfo = getSubscriptionDisplay();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.avatar}>
              <Icon name="account" size={48} color="#6b7280" />
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.full_name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Badge 
                style={[styles.subscriptionBadge, { backgroundColor: subscriptionInfo.color }]}
              >
                {subscriptionInfo.name}
              </Badge>
            </View>
            
            <Button
              mode="outlined"
              onPress={() => setShowEditProfile(true)}
              style={styles.editButton}
              compact
            >
              Edit
            </Button>
          </Card.Content>
        </Card>

        {/* Stats Section */}
        {userStats && (
          <Card style={styles.statsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Your Bird Watching Stats</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.total_scans}</Text>
                  <Text style={styles.statLabel}>Total Scans</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.unique_species}</Text>
                  <Text style={styles.statLabel}>Species Found</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.scans_today}</Text>
                  <Text style={styles.statLabel}>Today's Scans</Text>
                </View>
              </View>
              
              <Text style={styles.memberSince}>
                Member since {new Date(userStats.member_since).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Subscription Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Subscription</Text>
            
            <List.Item
              title="Current Plan"
              description={subscriptionInfo.name}
              left={props => <Icon {...props} name="crown" size={24} color={subscriptionInfo.color} />}
              right={props => (
                <Button
                  mode={checkSubscriptionStatus() === 'free' ? 'contained' : 'outlined'}
                  onPress={() => navigation.navigate('PremiumUpsell')}
                  style={checkSubscriptionStatus() === 'free' ? styles.upgradeButton : styles.manageButton}
                  compact
                >
                  {checkSubscriptionStatus() === 'free' ? 'Upgrade' : 'Manage'}
                </Button>
              )}
            />
            
            {checkSubscriptionStatus() !== 'free' && (
              <>
                <Divider style={styles.divider} />
                <List.Item
                  title="Premium Features"
                  description="All features unlocked"
                  left={props => <Icon {...props} name="check-circle" size={24} color="#059669" />}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* App Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>App Settings</Text>
            
            <List.Item
              title="Sound Effects"
              description="Play sounds for bird calls and app interactions"
              left={props => <Icon {...props} name="volume-high" size={24} color="#059669" />}
              right={() => (
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  color="#059669"
                />
              )}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Push Notifications"
              description={canAccessPremiumFeature('push_notifications') ? "Rare bird alerts enabled" : "Upgrade for notifications"}
              left={props => <Icon {...props} name="bell" size={24} color="#059669" />}
              right={() => (
                <Switch
                  value={notifications && canAccessPremiumFeature('push_notifications')}
                  onValueChange={setNotifications}
                  disabled={!canAccessPremiumFeature('push_notifications')}
                  color="#059669"
                />
              )}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Storage & Privacy"
              description="Manage your data and privacy settings"
              left={props => <Icon {...props} name="shield-check" size={24} color="#059669" />}
              right={props => <Icon {...props} name="chevron-right" size={24} color="#6b7280" />}
              onPress={() => utils.showSuccess('Privacy settings coming soon!')}
            />
          </Card.Content>
        </Card>

        {/* Help & Support */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Help & Support</Text>
            
            <List.Item
              title="Help Center"
              description="Get help and find answers"
              left={props => <Icon {...props} name="help-circle" size={24} color="#059669" />}
              right={props => <Icon {...props} name="chevron-right" size={24} color="#6b7280" />}
              onPress={() => utils.showSuccess('Help center coming soon!')}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Contact Support"
              description="Get in touch with our team"
              left={props => <Icon {...props} name="email" size={24} color="#059669" />}
              right={props => <Icon {...props} name="chevron-right" size={24} color="#6b7280" />}
              onPress={() => utils.showSuccess('Contact support: support@birdscope.ai')}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Rate App"
              description="Help us improve BirdScope AI"
              left={props => <Icon {...props} name="star" size={24} color="#059669" />}
              right={props => <Icon {...props} name="chevron-right" size={24} color="#6b7280" />}
              onPress={() => utils.showSuccess('Thank you for your support!')}
            />
          </Card.Content>
        </Card>

        {/* About */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>About</Text>
            
            <List.Item
              title="App Version"
              description="1.0.0"
              left={props => <Icon {...props} name="information" size={24} color="#059669" />}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Terms of Service"
              left={props => <Icon {...props} name="file-document" size={24} color="#059669" />}
              right={props => <Icon {...props} name="chevron-right" size={24} color="#6b7280" />}
              onPress={() => utils.showSuccess('Terms of service coming soon!')}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Privacy Policy"
              left={props => <Icon {...props} name="shield-account" size={24} color="#059669" />}
              right={props => <Icon {...props} name="chevron-right" size={24} color="#6b7280" />}
              onPress={() => utils.showSuccess('Privacy policy coming soon!')}
            />
          </Card.Content>
        </Card>

        {/* Sign Out */}
        <Card style={styles.signOutCard}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.signOutButton}
              contentStyle={styles.signOutButtonContent}
              icon="logout"
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog visible={showEditProfile} onDismiss={() => setShowEditProfile(false)}>
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Full Name"
              value={editName}
              onChangeText={setEditName}
              mode="outlined"
              style={styles.editInput}
              outlineColor="#e5e7eb"
              activeOutlineColor="#059669"
            />
            
            <TextInput
              label="Email"
              value={editEmail}
              onChangeText={setEditEmail}
              mode="outlined"
              style={styles.editInput}
              keyboardType="email-address"
              autoCapitalize="none"
              outlineColor="#e5e7eb"
              activeOutlineColor="#059669"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditProfile(false)}>Cancel</Button>
            <Button onPress={handleUpdateProfile} mode="contained" style={styles.saveButton}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  subscriptionBadge: {
    alignSelf: 'flex-start',
  },
  editButton: {
    borderColor: '#059669',
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
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
  memberSince: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#f3f4f6',
  },
  upgradeButton: {
    backgroundColor: '#059669',
  },
  manageButton: {
    borderColor: '#059669',
  },
  signOutCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  signOutButton: {
    borderColor: '#ef4444',
  },
  signOutButtonContent: {
    paddingVertical: 8,
  },
  editInput: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#059669',
  },
  bottomSpacing: {
    height: 40,
  },
});