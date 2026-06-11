import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import { useProfile, measurementsSummary, styleLabel, clearProfile } from '@/lib/profile';
import { useWardrobe, clearWardrobe } from '@/lib/wardrobe';
import { getOutfits, clearOutfits } from '@/lib/outfits';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';

interface ProfileSectionProps {
  title: string;
  value?: string;
  onPress?: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  showChevron?: boolean;
}

function ProfileSection({ title, value, onPress, icon, showChevron = true }: ProfileSectionProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <PressScale onPress={onPress} style={styles.sectionCard}>
      <View style={styles.sectionContent}>
        <View style={styles.sectionLeft}>
          <View style={styles.sectionIcon}>
            <Ionicons name={icon} size={20} color={theme.primary} />
          </View>
          <View style={styles.sectionText}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {value && <Text style={styles.sectionValue}>{value}</Text>}
          </View>
        </View>
        {showChevron && (
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        )}
      </View>
    </PressScale>
  );
}

export default function ProfileScreen() {
  const { theme, themeName, setTheme } = useTheme();
  const styles = makeStyles(theme);
  const profile = useProfile();
  const wardrobe = useWardrobe();
  const { user, signOut } = useAuth();

  const userStats = {
    wardrobeItems: wardrobe.length,
    outfitsGenerated: getOutfits().length,
    toShop: wardrobe.filter((i) => i.status === 'recommended').length,
  };

  const photoCount = profile ? [profile.photos.front, profile.photos.side].filter(Boolean).length : 0;
  const styleValue = profile
    ? styleLabel(profile.primaryStyle) +
      (profile.secondaryStyles.length ? `, +${profile.secondaryStyles.length} more` : '')
    : 'Not set';

  const openSetup = () => router.push('/setup');

  const toggleTheme = () => {
    setTheme(themeName === 'light' ? 'dark' : 'light');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Manage your notification preferences.');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy', 'Review and update your privacy settings.');
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'Get help with using the app.');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            await clearProfile();
            await clearWardrobe();
            clearOutfits();
            await AsyncStorage.removeItem('onboarded');
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/auth/me');
              await clearProfile();
              await clearWardrobe();
              clearOutfits();
              await AsyncStorage.removeItem('onboarded');
              router.replace('/onboarding');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again later.');
            }
          }
        },
      ]
    );
  };

  return (
    <Screen>
      <AnimatedScreen>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <PressScale style={styles.editButton} onPress={openSetup}>
              <Ionicons name="create-outline" size={20} color={theme.primary} />
            </PressScale>
          </View>

          <Stagger step={60} initialDelay={120}>
            {/* User Info */}
            <SlideUp>
              <Card padding="lg" style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={32} color={theme.primary} />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user?.name || 'Style Champion'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'No email provided'}</Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                      {profile ? `${styleLabel(profile.primaryStyle)} style` : 'Setup not complete'}
                    </Text>
                  </View>
                </View>
              </Card>
            </SlideUp>

            {/* Stats */}
            <SlideUp>
              <View style={styles.statsRow}>
                <Card style={styles.statCard} padding="md">
                  <Text style={styles.statValue}>{userStats.wardrobeItems}</Text>
                  <Text style={styles.statLabel}>Wardrobe Items</Text>
                </Card>
                <Card style={styles.statCard} padding="md">
                  <Text style={styles.statValue}>{userStats.outfitsGenerated}</Text>
                  <Text style={styles.statLabel}>Outfits Generated</Text>
                </Card>
                <Card style={styles.statCard} padding="md">
                  <Text style={styles.statValue}>{userStats.toShop}</Text>
                  <Text style={styles.statLabel}>To Shop</Text>
                </Card>
              </View>
            </SlideUp>

            {/* Profile Settings */}
            <SlideUp>
              <Text style={styles.sectionHeader}>Profile Settings</Text>
              <View style={styles.sectionsContainer}>
                <ProfileSection
                  title="Measurements"
                  value={profile ? measurementsSummary(profile.measurements) : 'Not set'}
                  icon="resize-outline"
                  onPress={openSetup}
                />
                <ProfileSection
                  title="Style Preferences"
                  value={styleValue}
                  icon="shirt-outline"
                  onPress={openSetup}
                />
                <ProfileSection
                  title="Photos"
                  value={photoCount > 0 ? `${photoCount} photo${photoCount > 1 ? 's' : ''} uploaded` : 'None uploaded'}
                  icon="camera-outline"
                  onPress={() => router.push('/photos')}
                />
              </View>
            </SlideUp>

            {/* App Settings */}
            <SlideUp>
              <Text style={styles.sectionHeader}>App Settings</Text>
              <View style={styles.sectionsContainer}>
                <ProfileSection
                  title="Appearance"
                  value={themeName === 'light' ? 'Light mode' : 'Dark mode'}
                  icon={themeName === 'light' ? 'sunny-outline' : 'moon-outline'}
                  onPress={toggleTheme}
                  showChevron={false}
                />
                <ProfileSection
                  title="Notifications"
                  icon="notifications-outline"
                  onPress={handleNotifications}
                />
                <ProfileSection
                  title="Privacy & Security"
                  icon="shield-checkmark-outline"
                  onPress={handlePrivacy}
                />
                <ProfileSection
                  title="Help & Support"
                  icon="help-circle-outline"
                  onPress={handleHelp}
                />
              </View>
            </SlideUp>

            {/* Sign Out */}
            <SlideUp>
              <Button
                title="Sign Out"
                variant="ghost"
                onPress={handleSignOut}
                style={styles.signOutButton}
                icon={<Ionicons name="log-out-outline" size={18} color={theme.textMuted} />}
              />
              <Button
                title="Delete Account"
                variant="ghost"
                onPress={handleDeleteAccount}
                style={styles.deleteAccountButton}
                icon={<Ionicons name="trash-outline" size={18} color={theme.danger} />}
                textStyle={{ color: theme.danger }}
              />
            </SlideUp>
          </Stagger>
        </View>
      </AnimatedScreen>
    </Screen>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    marginBottom: Layout.spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
  sectionsContainer: {
    marginBottom: Layout.spacing.lg,
  },
  sectionCard: {
    backgroundColor: theme.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: Layout.spacing.sm,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.md,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  sectionText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  sectionValue: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  signOutButton: {
    marginTop: Layout.spacing.md,
  },
  deleteAccountButton: {
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.xxl,
  },
});