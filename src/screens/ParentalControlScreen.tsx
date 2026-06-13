import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  FlatList,
  StatusBar,
} from 'react-native';
import Svg, { Circle, Rect, Line, Path, G } from 'react-native-svg';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
  batteryLevel: number;
  deviceName: string;
  lastActive: string;
  currentUsageMinutes: number;
  totalLimitMinutes: number;
  appUsage: { name: string; time: string; color: string }[];
}

interface ParentalControlScreenProps {
  onBack: () => void;
}

const initialProfiles: ChildProfile[] = [
  {
    id: '1',
    name: 'Alex',
    age: 12,
    avatarColor: colors.purpleAccent,
    batteryLevel: 84,
    deviceName: 'Samsung S23 Ultra',
    lastActive: 'Active Now',
    currentUsageMinutes: 135,
    totalLimitMinutes: 240,
    appUsage: [
      { name: 'Roblox', time: '1h 15m', color: colors.pinkAccent },
      { name: 'YouTube', time: '45m', color: colors.purpleAccent },
      { name: 'Chrome', time: '15m', color: colors.cyanAccent }
    ]
  },
  {
    id: '2',
    name: 'Emma',
    age: 8,
    avatarColor: colors.pinkAccent,
    batteryLevel: 92,
    deviceName: 'iPad Mini 6',
    lastActive: 'Active 5m ago',
    currentUsageMinutes: 75,
    totalLimitMinutes: 120,
    appUsage: [
      { name: 'YouTube Kids', time: '45m', color: colors.orangeWarning },
      { name: 'Minecraft', time: '30m', color: colors.greenSuccess }
    ]
  }
];

export const ParentalControlScreen: React.FC<ParentalControlScreenProps> = ({ onBack }) => {
  const [selectedProfileId, setSelectedProfileId] = useState('1');
  const [activeTab, setActiveTab] = useState('Overview');
  const [deviceLocked, setDeviceLocked] = useState(false);

  // Limits state
  const [alexLimitMinutes, setAlexLimitMinutes] = useState(240);
  const [emmaLimitMinutes, setEmmaLimitMinutes] = useState(120);

  // App Blocks state (map structure)
  const [alexBlockedApps, setAlexBlockedApps] = useState<{ [key: string]: boolean }>({
    Roblox: false, YouTube: false, Chrome: false, Discord: true, TikTok: true
  });
  const [emmaBlockedApps, setEmmaBlockedApps] = useState<{ [key: string]: boolean }>({
    'YouTube Kids': false, Minecraft: false, Roblox: true, YouTube: true, Safari: false
  });

  // Filter state
  const [blockedUrls, setBlockedUrls] = useState<string[]>([
    'tiktok.com', 'instagram.com', 'snapchat.com', 'reddit.com'
  ]);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Geofencing state
  const [geofenceRadius, setGeofenceRadius] = useState(120);

  // SOS state
  const [sosActive, setSosActive] = useState(false);
  const [sosTriggeredBy, setSosTriggeredBy] = useState('');

  const currentLimitMinutes = selectedProfileId === '1' ? alexLimitMinutes : emmaLimitMinutes;
  const setLimitMinutes = selectedProfileId === '1' ? setAlexLimitMinutes : setEmmaLimitMinutes;

  const currentBlockedApps = selectedProfileId === '1' ? alexBlockedApps : emmaBlockedApps;
  const setCurrentBlockedApps = selectedProfileId === '1' ? setAlexBlockedApps : setEmmaBlockedApps;

  const activeChild = initialProfiles.find(p => p.id === selectedProfileId) || initialProfiles[0];

  const handleToggleBlockApp = (appName: string, val: boolean) => {
    setCurrentBlockedApps({
      ...currentBlockedApps,
      [appName]: val
    });
  };

  const handleAddUrl = () => {
    if (customUrlInput.trim().length > 0) {
      setBlockedUrls([...blockedUrls, customUrlInput.trim().toLowerCase()]);
      setCustomUrlInput('');
    }
  };

  const handleRemoveUrl = (url: string) => {
    setBlockedUrls(blockedUrls.filter(u => u !== url));
  };

  const tabs = ['Overview', 'Limits', 'Apps', 'Filter', 'Location', 'Reports', 'SOS', 'Link'];

  // Circular progress math
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = activeChild.currentUsageMinutes / currentLimitMinutes;
  const strokeDashoffset = circumference - (Math.min(1, progressPercent) * (270 / 360)) * circumference;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.contentWrapper}>

      {/* 1. TOP HEADER APP BAR WITH BACK BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-back" color="#fff" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Parental Control Shield</Text>
          <Text style={styles.headerSubtitle}>Manage and protect child devices</Text>
        </View>
      </View>

      {/* 2. CHILD PROFILE SELECTOR ROW */}
      <View style={styles.profilesRow}>
        {initialProfiles.map(profile => {
          const isSelected = selectedProfileId === profile.id;
          return (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.profileCard,
                isSelected ? { borderColor: profile.avatarColor } : styles.profileCardInactive,
              ]}
              onPress={() => setSelectedProfileId(profile.id)}
            >
              <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
                <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profileSub} numberOfLines={1}>
                  {profile.age} yrs • {profile.deviceName}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. HORIZONTAL SCROLLABLE TABS */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          {tabs.map(tab => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isSelected && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* SOS Alert Banner */}
      {sosActive && (
        <TouchableOpacity style={styles.sosBanner} onPress={() => setSosActive(false)}>
          <View style={styles.sosBannerContent}>
            <Icon name="warning" color="#fff" size={20} />
            <View style={styles.sosBannerTexts}>
              <Text style={styles.sosBannerTitle}>EMERGENCY SOS RECEIVED!</Text>
              <Text style={styles.sosBannerSub}>
                Child {sosTriggeredBy} triggered panic alert. Coordinates shared.
              </Text>
            </View>
            <View style={styles.dismissBadge}>
              <Text style={styles.dismissText}>DISMISS</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* 4. ACTIVE SUB-SCREEN VIEW CONTROLLER */}
      <ScrollView contentContainerStyle={styles.viewContent}>
        {activeTab === 'Overview' && (
          <View style={{ width: '100%' }}>
            {/* Status Card */}
            <View style={styles.deviceStatusCard}>
              <View style={styles.deviceStatusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: deviceLocked ? colors.redDanger : colors.greenSuccess },
                  ]}
                />
                <View style={styles.deviceStatusTexts}>
                  <Text style={styles.statusTitle}>
                    {deviceLocked ? 'Device Blocked (Locked)' : 'Device Active Online'}
                  </Text>
                  <Text style={styles.statusSub}>
                    {activeChild.deviceName} • Battery: {activeChild.batteryLevel}%
                  </Text>
                </View>
              </View>
              <Icon
                name={activeChild.batteryLevel > 80 ? 'battery-full' : 'battery-alert'}
                color={activeChild.batteryLevel > 20 ? colors.greenSuccess : colors.redDanger}
                size={22}
              />
            </View>

            {/* Screen Time Ring */}
            <View style={styles.overviewGaugeCard}>
              <Text style={styles.gaugeHeader}>DAILY SCREEN TIME</Text>
              <View style={styles.overviewGaugeContainer}>
                <Svg width={150} height={150} viewBox="0 0 120 120">
                  <G rotation="135" origin="60, 60">
                    <Circle
                      cx="60"
                      cy="60"
                      r={radius}
                      stroke={colors.border}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={`${(270 / 360) * circumference} ${circumference}`}
                      strokeLinecap="round"
                    />
                    <Circle
                      cx="60"
                      cy="60"
                      r={radius}
                      stroke={colors.pinkAccent}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </G>
                </Svg>
                <View style={styles.overviewGaugeTexts}>
                  <Text style={styles.usageHourText}>
                    {Math.floor(activeChild.currentUsageMinutes / 60)}h{' '}
                    {activeChild.currentUsageMinutes % 60}m
                  </Text>
                  <Text style={styles.limitLabelText}>of {currentLimitMinutes / 60}h limit</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.remoteLockBtn, { backgroundColor: deviceLocked ? colors.greenSuccess : colors.redDanger }]}
                onPress={() => setDeviceLocked(!deviceLocked)}
              >
                <Icon name={deviceLocked ? 'lock-open' : 'lock'} color="#fff" size={18} />
                <Text style={styles.remoteLockBtnText}>
                  {deviceLocked ? 'Unlock Child Device Now' : 'Lock Child Device Remotely'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* App Usage List */}
            <Text style={styles.blockSectionTitle}>Most Used Apps Today</Text>
            {activeChild.appUsage.map(usage => (
              <View key={usage.name} style={styles.usageRow}>
                <View style={styles.usageLeft}>
                  <View style={[styles.appIconContainer, { backgroundColor: usage.color + '22' }]}>
                    <Icon
                      name={
                        usage.name === 'Roblox' || usage.name === 'Minecraft'
                          ? 'gamepad'
                          : usage.name.includes('YouTube')
                          ? 'play-circle'
                          : 'globe'
                      }
                      color={usage.color}
                      size={20}
                    />
                  </View>
                  <Text style={styles.appName}>{usage.name}</Text>
                </View>
                <Text style={styles.appDuration}>{usage.time}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Limits' && (
          <View style={{ width: '100%' }}>
            <View style={styles.settingCard}>
              <Text style={styles.settingTitle}>Daily Screen Time Limit</Text>
              <Text style={styles.settingSub}>Set total minutes/hours allowed per day</Text>

              <View style={styles.limitValueRow}>
                <Text style={styles.limitBoundary}>0h</Text>
                <Text style={styles.limitCurrentValue}>
                  {Math.floor(currentLimitMinutes / 60)}h {currentLimitMinutes % 60}m
                </Text>
                <Text style={styles.limitBoundary}>6h</Text>
              </View>

              {/* Simulated Slider */}
              <View style={styles.sliderContainer}>
                <TouchableOpacity
                  style={[styles.sliderButton, { marginRight: 16 }]}
                  onPress={() => setLimitMinutes(Math.max(15, currentLimitMinutes - 15))}
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>

                <View style={styles.sliderTrackBg}>
                  <View
                    style={[
                      styles.sliderTrackFill,
                      { width: `${(currentLimitMinutes / 360) * 100}%` },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.sliderButton, { marginLeft: 16 }]}
                  onPress={() => setLimitMinutes(Math.min(360, currentLimitMinutes + 15))}
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Schedules */}
            <View style={[styles.settingCard, { marginTop: 16 }]}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Schedule Bedtime Off-Hours</Text>
                  <Text style={styles.settingSub}>Automatically locks device at night</Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  trackColor={{ true: colors.purpleAccent }}
                />
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.scheduleRow}>
                <View style={styles.scheduleLeft}>
                  <Icon name="bedtime" color={colors.purpleAccent} size={22} />
                  <View style={styles.scheduleTexts}>
                    <Text style={styles.scheduleTitle}>Bedtime Lock Time</Text>
                    <Text style={styles.scheduleTime}>Everyday 21:00 to 07:00</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Icon name="edit" color={colors.textMuted} size={18} />
                </TouchableOpacity>
              </View>

              <View style={[styles.scheduleRow, { marginTop: 16 }]}>
                <View style={styles.scheduleLeft}>
                  <Icon name="school" color={colors.cyanAccent} size={22} />
                  <View style={styles.scheduleTexts}>
                    <Text style={styles.scheduleTitle}>School Hour Block</Text>
                    <Text style={styles.scheduleTime}>Mon-Fri 08:30 to 14:30</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Icon name="edit" color={colors.textMuted} size={18} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'Apps' && (
          <View style={{ width: '100%' }}>
            <Text style={styles.blockSectionTitle}>App Restriction Policies</Text>
            {Object.keys(currentBlockedApps).map(appName => {
              const isBlocked = currentBlockedApps[appName];
              return (
                <View key={appName} style={styles.policyRow}>
                  <View style={styles.policyLeft}>
                    <Icon
                      name={
                        appName === 'Roblox' || appName === 'Minecraft'
                          ? 'gamepad'
                          : appName.includes('YouTube')
                          ? 'play-circle'
                          : 'globe'
                      }
                      color={isBlocked ? colors.redDanger : colors.greenSuccess}
                      size={20}
                    />
                    <Text style={styles.policyName}>{appName}</Text>
                  </View>
                  <View style={styles.policyRight}>
                    <Text style={[styles.statusText, { color: isBlocked ? colors.redDanger : colors.greenSuccess }]}>
                      {isBlocked ? 'BLOCKED' : 'ALLOWED'}
                    </Text>
                    <Switch
                      value={!isBlocked}
                      onValueChange={val => handleToggleBlockApp(appName, !val)}
                      trackColor={{ true: colors.greenSuccess, false: colors.redDanger }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'Filter' && (
          <View style={{ width: '100%' }}>
            <View style={styles.settingCard}>
              <Text style={styles.settingTitle}>Website Domain Filter</Text>
              <Text style={styles.settingSub}>Block inappropriate or unwanted web content</Text>

              <View style={styles.addUrlRow}>
                <TextInput
                  style={styles.urlInput}
                  placeholder="Enter domain (e.g. facebook.com)"
                  placeholderTextColor={colors.textMuted}
                  value={customUrlInput}
                  onChangeText={setCustomUrlInput}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.addUrlBtn} onPress={handleAddUrl}>
                  <Text style={styles.addUrlBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.blockSectionTitle}>Blocked Websites ({blockedUrls.length})</Text>
            {blockedUrls.map(url => (
              <View key={url} style={styles.urlRow}>
                <Text style={styles.urlText}>{url}</Text>
                <TouchableOpacity onPress={() => handleRemoveUrl(url)}>
                  <Icon name="close" color={colors.redDanger} size={18} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Location' && (
          <View style={{ width: '100%' }}>
            {/* Geofence Radar Svg */}
            <View style={styles.locationRadarCard}>
              <Svg width="100%" height={200} viewBox="0 0 320 200">
                {/* Radar Grid */}
                <Circle cx="160" cy="100" r="80" stroke={colors.border} strokeWidth="1" fill="none" opacity={0.4} />
                <Circle cx="160" cy="100" r="50" stroke={colors.border} strokeWidth="1" fill="none" opacity={0.4} />
                <Circle cx="160" cy="100" r="20" stroke={colors.border} strokeWidth="1" fill="none" opacity={0.4} />
                <Line x1="160" y1="10" x2="160" y2="190" stroke={colors.border} strokeWidth="1" opacity={0.3} />
                <Line x1="70" y1="100" x2="250" y2="100" stroke={colors.border} strokeWidth="1" opacity={0.3} />

                {/* Geofence safe zone circle */}
                <Circle cx="160" cy="100" r={geofenceRadius / 2} fill={colors.greenSuccess} opacity={0.15} />
                <Circle cx="160" cy="100" r={geofenceRadius / 2} stroke={colors.greenSuccess} strokeWidth="1.5" fill="none" strokeDasharray="4,4" />

                {/* Child Position */}
                <Circle cx="140" cy="80" r="6" fill={colors.purpleAccent} />
                <Circle cx="140" cy="80" r="12" stroke={colors.purpleAccent} strokeWidth="1" fill="none" opacity={0.5} />
              </Svg>

              <Text style={styles.radarLabel}>Safe Zone Radius: {geofenceRadius} meters</Text>

              {/* Adjust geofence radius */}
              <View style={styles.sliderContainer}>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => setGeofenceRadius(Math.max(50, geofenceRadius - 10))}
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <View style={styles.sliderTrackBg}>
                  <View
                    style={[
                      styles.sliderTrackFill,
                      { width: `${((geofenceRadius - 50) / 150) * 100}%` },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => setGeofenceRadius(Math.min(200, geofenceRadius + 10))}
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'Reports' && (
          <View style={{ width: '100%' }}>
            <View style={styles.reportCard}>
              <Text style={styles.reportHeaderTitle}>CATEGORY ACTIVITY</Text>
              <View style={styles.reportBarRow}>
                <Text style={styles.reportBarLabel}>Social Apps</Text>
                <View style={styles.reportBarBg}>
                  <View style={[styles.reportBarFill, { width: '42%', backgroundColor: colors.pinkAccent }]} />
                </View>
                <Text style={styles.reportBarPct}>42%</Text>
              </View>
              <View style={styles.reportBarRow}>
                <Text style={styles.reportBarLabel}>Gaming Apps</Text>
                <View style={styles.reportBarBg}>
                  <View style={[styles.reportBarFill, { width: '48%', backgroundColor: colors.purpleAccent }]} />
                </View>
                <Text style={styles.reportBarPct}>48%</Text>
              </View>
              <View style={styles.reportBarRow}>
                <Text style={styles.reportBarLabel}>Educational</Text>
                <View style={styles.reportBarBg}>
                  <View style={[styles.reportBarFill, { width: '10%', backgroundColor: colors.cyanAccent }]} />
                </View>
                <Text style={styles.reportBarPct}>10%</Text>
              </View>
            </View>

            <Text style={styles.blockSectionTitle}>Recent Blocked Activities</Text>
            <View style={styles.activityAlert}>
              <Icon name="cancel" color={colors.redDanger} size={18} />
              <View style={styles.activityAlertTexts}>
                <Text style={styles.activityAlertText}>Attempted to open: tiktok.com</Text>
                <Text style={styles.activityAlertTime}>Today, 11:20 AM</Text>
              </View>
            </View>
            <View style={[styles.activityAlert, { marginTop: 8 }]}>
              <Icon name="cancel" color={colors.redDanger} size={18} />
              <View style={styles.activityAlertTexts}>
                <Text style={styles.activityAlertText}>Discord app launch blocked by policy</Text>
                <Text style={styles.activityAlertTime}>Today, 09:15 AM</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'SOS' && (
          <View style={styles.sosSimulationView}>
            <Icon name="warning" color={colors.redDanger} size={48} />
            <Text style={styles.sosPrompt}>Simulate a panic alarm event from the child device.</Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.redDanger }]}
              onPress={() => {
                setSosTriggeredBy(activeChild.name);
                setSosActive(true);
                setActiveTab('Overview');
              }}
            >
              <Text style={styles.primaryBtnText}>Trigger Simulated SOS</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Link' && (
          <View style={styles.linkingView}>
            <Icon name="vpn-key" color={colors.cyanAccent} size={48} />
            <Text style={styles.linkingCode}>942-817</Text>
            <Text style={styles.linkingInstructions}>
              Enter this 6-digit pairing code on the new child device to link it under your parental account.
            </Text>
          </View>
        )}
      </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginLeft: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  profilesRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  profileCard: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  profileCardInactive: {
    borderColor: colors.border,
    opacity: 0.6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  profileInfo: {
    marginLeft: 10,
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileSub: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.pinkAccent,
  },
  tabText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sosBanner: {
    backgroundColor: colors.redDanger,
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
  },
  sosBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sosBannerTexts: {
    flex: 1,
    marginLeft: 12,
  },
  sosBannerTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
  sosBannerSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    marginTop: 2,
  },
  dismissBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dismissText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  viewContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deviceStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  deviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  deviceStatusTexts: {
    marginLeft: 10,
  },
  statusTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  overviewGaugeCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  gaugeHeader: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  overviewGaugeContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  overviewGaugeTexts: {
    position: 'absolute',
    alignItems: 'center',
  },
  usageHourText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  limitLabelText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  remoteLockBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteLockBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  blockSectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 6,
  },
  usageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  appDuration: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  settingCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  settingSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  limitValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  limitBoundary: {
    color: colors.textMuted,
    fontSize: 12,
  },
  limitCurrentValue: {
    color: colors.pinkAccent,
    fontSize: 20,
    fontWeight: 'bold',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sliderTrackBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: colors.pinkAccent,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleTexts: {
    marginLeft: 10,
  },
  scheduleTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scheduleTime: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  policyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  policyName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  policyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 10,
  },
  addUrlRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  urlInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: '#fff',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addUrlBtn: {
    width: 60,
    height: 44,
    backgroundColor: colors.cyanAccent,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addUrlBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  urlText: {
    color: '#fff',
    fontSize: 13,
  },
  locationRadarCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
  },
  radarLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
  },
  reportCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  reportHeaderTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B6E85',
    letterSpacing: 1,
    marginBottom: 16,
  },
  reportBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportBarLabel: {
    width: 90,
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  reportBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  reportBarFill: {
    height: '100%',
  },
  reportBarPct: {
    width: 30,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  activityAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  activityAlertTexts: {
    marginLeft: 10,
    flex: 1,
  },
  activityAlertText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  activityAlertTime: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  sosSimulationView: {
    alignItems: 'center',
    marginTop: 60,
    width: '100%',
  },
  sosPrompt: {
    color: '#6B6E85',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  linkingView: {
    alignItems: 'center',
    marginTop: 80,
    width: '100%',
  },
  linkingCode: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.cyanAccent,
    letterSpacing: 2,
    marginVertical: 16,
  },
  linkingInstructions: {
    color: '#6B6E85',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 40,
  },
});
