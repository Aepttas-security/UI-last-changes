import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  StatusBar,
} from 'react-native';
import Svg, { Circle, Rect, Line, G } from 'react-native-svg';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';
import { useParentalControl } from '../hooks/useParentalControl';

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
  const {
    isLoading,
    backendAvailable,
    children,
    selectedProfileId,
    selectProfile,
    deviceLocked,
    changeDeviceLock,
    limitMinutes,
    currentUsageMinutes,
    changeChildDailyLimit,
    apps,
    toggleBlockApp,
    blockedUrls,
    addBlacklistUrl,
    removeBlacklistUrl,
    blockedCategories,
    toggleFilterCategory,
    location,
    geofences,
    addNewGeofence,
    reportSummary,
    sosActive,
    triggerSOS,
    activeAlerts,
    updateSosPreferences,
    getSosPreferences,
    generateLinkingCode,
  } = useParentalControl();

  const [activeTab, setActiveTab] = useState('Overview');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [sosBannerVisible, setSosBannerVisible] = useState(true);
  
  // Geofencing state
  const [geofenceRadius, setGeofenceRadius] = useState(120);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);

  // Notification State
  const [demoPhone, setDemoPhone] = useState('+1 (555) 019-8372');
  const [demoEmail, setDemoEmail] = useState('parent@family.net');
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);
  
  const [notifyLimitsPhone, setNotifyLimitsPhone] = useState(true);
  const [notifyLimitsEmail, setNotifyLimitsEmail] = useState(true);

  const [notifyLocationPhone, setNotifyLocationPhone] = useState(true);
  const [notifyLocationEmail, setNotifyLocationEmail] = useState(true);

  const [notifySosPhone, setNotifySosPhone] = useState(true);
  const [notifySosEmail, setNotifySosEmail] = useState(true);

  // SOS state
  const [sosTriggeredBy, setSosTriggeredBy] = useState('');

  // Pairing Code & QR Code state
  const [pairingCode, setPairingCode] = useState('');

  const refreshPairingCode = async () => {
    const code = await generateLinkingCode();
    if (code) {
      setPairingCode(code);
    }
  };

  // Generate pairing code on Link tab load or profile change
  useEffect(() => {
    if (activeTab === 'Link') {
      refreshPairingCode();
    }
  }, [activeTab, selectedProfileId]);

  // Load preferences when profile changes
  useEffect(() => {
    const prefs = getSosPreferences();
    if (prefs) {
      setEmailAlertsEnabled(prefs.email_enabled);
      setSmsAlertsEnabled(prefs.phone_enabled);
      setDemoEmail(prefs.parent_email || 'parent@family.net');
      setDemoPhone(prefs.parent_phone || '+1 (555) 019-8372');
    }
  }, [selectedProfileId]);

  // Save preferences when they change
  useEffect(() => {
    updateSosPreferences(emailAlertsEnabled, demoEmail, smsAlertsEnabled, demoPhone);
  }, [emailAlertsEnabled, demoEmail, smsAlertsEnabled, demoPhone]);

  useEffect(() => {
    if (sosActive) {
      setSosBannerVisible(true);
    }
  }, [sosActive]);

  const renderQRCode = (code: string, size = 180) => {
    const matrixSize = 21; // 21x21 grid for QR Version 1
    const cellSize = size / matrixSize;
    const matrix = Array(matrixSize).fill(null).map(() => Array(matrixSize).fill(false));

    // Draw finder patterns helper
    const drawFinderPattern = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[row + r][col + c] = isBorder || isCenter;
        }
      }
    };

    // Draw the three standard finder patterns
    drawFinderPattern(0, 0); // Top-left
    drawFinderPattern(0, 14); // Top-right
    drawFinderPattern(14, 0); // Bottom-left

    // Seed generation based on pairing code (e.g., "942-817")
    let seed = 0;
    for (let i = 0; i < code.length; i++) {
      seed = (seed * 31 + code.charCodeAt(i)) & 0xffffffff;
    }

    const pseudoRandom = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 16) / 65535;
    };

    // Fill the grid based on the deterministic seed
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Skip finder patterns
        const isTopLeft = r < 8 && c < 8;
        const isTopRight = r < 8 && c >= 13;
        const isBottomLeft = r >= 13 && c < 8;

        if (!isTopLeft && !isTopRight && !isBottomLeft) {
          matrix[r][c] = pseudoRandom() > 0.45;
        }
      }
    }

    // Add timing pattern lines (alternating dark/light rows/cols at line index 6)
    for (let i = 8; i < 13; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Accumulate rects
    const rects: React.ReactNode[] = [];
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        if (matrix[r][c]) {
          rects.push(
            <Rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill={colors.cyanAccent}
            />
          );
        }
      }
    }

    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect width={size} height={size} fill={colors.cardBackgroundLight} rx={12} />
        <G translate="10, 10" scale="0.88">
          {rects}
        </G>
      </Svg>
    );
  };

  const activeChild = children.find(p => p.id === selectedProfileId) || children[0] || initialProfiles[0];
  if (activeChild) {
    activeChild.currentUsageMinutes = currentUsageMinutes;
    activeChild.totalLimitMinutes = limitMinutes;
  }

  const currentLimitMinutes = limitMinutes;
  const setLimitMinutes = changeChildDailyLimit;

  const handleToggleCategory = (category: string, val: boolean) => {
    toggleFilterCategory(category, val);
  };

  const handleAddUrl = () => {
    if (customUrlInput.trim().length > 0) {
      addBlacklistUrl(customUrlInput.trim());
      setCustomUrlInput('');
    }
  };

  const handleRemoveUrl = (url: string) => {
    removeBlacklistUrl(url);
  };

  const tabs = ['Overview', 'Limits', 'Apps', 'Filter', 'Location', 'Reports', 'Alerts', 'SOS', 'Link'];

  // Circular progress math
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = activeChild.currentUsageMinutes / currentLimitMinutes;
  const strokeDashoffset = circumference - (Math.min(1, progressPercent) * (270 / 360)) * circumference;

  const renderNotificationSettings = (
    title: string,
    phoneEnabled: boolean,
    setPhoneEnabled: (val: boolean) => void,
    emailEnabled: boolean,
    setEmailEnabled: (val: boolean) => void
  ) => (
    <View style={[styles.settingCard, { marginTop: 16 }]}>
      <Text style={styles.settingTitle}>{title} Notifications</Text>
      <Text style={styles.settingSub}>Choose where to receive alerts</Text>

      <View style={styles.cardDivider} />

      <View style={styles.contactRow}>
        <Icon name="phone" color={colors.cyanAccent} size={20} />
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Parent Phone (Demo)</Text>
          <Text style={styles.contactValue}>{demoPhone}</Text>
        </View>
        <Switch
          value={phoneEnabled}
          onValueChange={setPhoneEnabled}
          trackColor={{ true: colors.greenSuccess }}
        />
      </View>

      <View style={[styles.contactRow, { marginTop: 12 }]}>
        <Icon name="email" color={colors.purpleAccent} size={20} />
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Parent Email (Demo)</Text>
          <Text style={styles.contactValue}>{demoEmail}</Text>
        </View>
        <Switch
          value={emailEnabled}
          onValueChange={setEmailEnabled}
          trackColor={{ true: colors.greenSuccess }}
        />
      </View>
    </View>
  );

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
        {children.map(profile => {
          const isSelected = selectedProfileId === profile.id;
          return (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.profileCard,
                isSelected ? { borderColor: profile.avatarColor } : styles.profileCardInactive,
              ]}
              onPress={() => selectProfile(profile.id)}
            >
              <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
                <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profileSub} numberOfLines={1}>
                  {profile.age} yrs • {profile.deviceName || profile.device}
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
      {sosActive && sosBannerVisible && (
        <TouchableOpacity style={styles.sosBanner} onPress={() => setSosBannerVisible(false)}>
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
                onPress={() => changeDeviceLock(!deviceLocked)}
              >
                <Icon name={deviceLocked ? 'lock-open' : 'lock'} color="#fff" size={18} />
                <Text style={styles.remoteLockBtnText}>
                  {deviceLocked ? 'Unlock Child Device Now' : 'Lock Child Device Remotely'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* App Usage List */}
            <Text style={styles.blockSectionTitle}>Most Used Apps Today</Text>
            {(activeChild.appUsage || []).map((usage: any) => (
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

            {renderNotificationSettings('Screen Time Limits', notifyLimitsPhone, setNotifyLimitsPhone, notifyLimitsEmail, setNotifyLimitsEmail)}
          </View>
        )}

        {activeTab === 'Apps' && (
          <View style={{ width: '100%' }}>
            <Text style={styles.blockSectionTitle}>App Restriction Policies</Text>
            {apps.map(app => {
              const isBlocked = app.is_blocked;
              return (
                <View key={app.app_id} style={styles.policyRow}>
                  <View style={styles.policyLeft}>
                    <Icon
                      name={
                        app.app_name === 'Roblox' || app.app_name === 'Minecraft'
                          ? 'gamepad'
                          : app.app_name.includes('YouTube')
                          ? 'play-circle'
                          : 'globe'
                      }
                      color={isBlocked ? colors.redDanger : colors.greenSuccess}
                      size={20}
                    />
                    <Text style={styles.policyName}>{app.app_name}</Text>
                  </View>
                  <View style={styles.policyRight}>
                    <Text style={[styles.statusText, { color: isBlocked ? colors.redDanger : colors.greenSuccess }]}>
                      {isBlocked ? 'BLOCKED' : 'ALLOWED'}
                    </Text>
                    <Switch
                      value={!isBlocked}
                      onValueChange={() => toggleBlockApp(app.app_id, app.app_name)}
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
            <Text style={styles.blockSectionTitle}>Content Category Filter</Text>
            {Object.keys(blockedCategories).map(category => {
              const isBlocked = blockedCategories[category];
              return (
                <View key={category} style={styles.policyRow}>
                  <View style={styles.policyLeft}>
                    <Icon
                      name={
                        category === 'Adult Content' ? 'block' :
                        category === 'Gambling' ? 'casino' :
                        category === 'Social Media' ? 'people' :
                        category === 'Gaming' ? 'sports-esports' :
                        category === 'Violence/Weapons' ? 'gavel' : 'category'
                      }
                      color={isBlocked ? colors.redDanger : colors.greenSuccess}
                      size={20}
                    />
                    <Text style={styles.policyName}>{category}</Text>
                  </View>
                  <View style={styles.policyRight}>
                    <Text style={[styles.statusText, { color: isBlocked ? colors.redDanger : colors.greenSuccess }]}>
                      {isBlocked ? 'BLOCKED' : 'ALLOWED'}
                    </Text>
                    <Switch
                      value={!isBlocked}
                      onValueChange={val => handleToggleCategory(category, !val)}
                      trackColor={{ true: colors.greenSuccess, false: colors.redDanger }}
                    />
                  </View>
                </View>
              );
            })}

            <Text style={[styles.blockSectionTitle, { marginTop: 24 }]}>Custom Domain Filter</Text>
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
            {/* Enable Location Tracking Switch Card */}
            <View style={styles.settingCard}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Enable Location Tracking</Text>
                  <Text style={styles.settingSub}>Track child's device location and enforce safe zone</Text>
                </View>
                <Switch
                  value={locationTrackingEnabled}
                  onValueChange={setLocationTrackingEnabled}
                  trackColor={{ true: colors.greenSuccess }}
                />
              </View>
            </View>

            {locationTrackingEnabled && (
              <View style={[styles.locationRadarCard, { marginTop: 16 }]}>
                {/* Geofence Radar Svg */}
                <Svg width="100%" height={200} viewBox="0 0 320 200">
                  {/* Radar Grid */}
                  <Circle cx="160" cy="100" r="80" stroke={colors.greenSuccess + '33'} strokeWidth="1" fill="none" />
                  <Circle cx="160" cy="100" r="50" stroke={colors.greenSuccess + '33'} strokeWidth="1" fill="none" />
                  <Circle cx="160" cy="100" r="20" stroke={colors.greenSuccess + '33'} strokeWidth="1" fill="none" />
                  <Line x1="160" y1="10" x2="160" y2="190" stroke={colors.greenSuccess + '22'} strokeWidth="1" />
                  <Line x1="70" y1="100" x2="250" y2="100" stroke={colors.greenSuccess + '22'} strokeWidth="1" />

                  {/* Geofence safe zone circle */}
                  <Circle cx="160" cy="100" r={Math.min(90, geofenceRadius / 2)} fill={colors.greenSuccess + '1a'} />
                  <Circle cx="160" cy="100" r={Math.min(90, geofenceRadius / 2)} stroke={colors.greenSuccess} strokeWidth="1.5" fill="none" strokeDasharray="4,4" />

                  {/* Child Position */}
                  <Circle cx="140" cy="80" r="6" fill={colors.purpleAccent} />
                  <Circle cx="140" cy="80" r="12" stroke={colors.purpleAccent} strokeWidth="1" fill="none" opacity={0.5} />
                </Svg>

                {/* Safe Zone Radius row */}
                <View style={styles.radiusInputRow}>
                  <Text style={styles.radiusLabelText}>Safe Zone Radius:</Text>
                  <View style={styles.radiusInputContainer}>
                    <TextInput
                      style={styles.radiusInput}
                      value={geofenceRadius.toString()}
                      onChangeText={val => {
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed)) {
                          setGeofenceRadius(parsed);
                        } else if (val === '') {
                          setGeofenceRadius(0);
                        }
                      }}
                      keyboardType="numeric"
                      textAlign="center"
                    />
                  </View>
                  <Text style={styles.radiusUnitText}>meters</Text>
                </View>

                {/* Adjust geofence radius slider */}
                <View style={styles.sliderContainer}>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setGeofenceRadius(Math.max(10, geofenceRadius - 10))}
                  >
                    <Text style={styles.sliderButtonText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.sliderTrackBg}>
                    <View
                      style={[
                        styles.sliderTrackFill,
                        { width: `${Math.max(0, Math.min(100, ((geofenceRadius - 10) / 490) * 100))}%` },
                      ]}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => setGeofenceRadius(Math.min(500, geofenceRadius + 10))}
                  >
                    <Text style={styles.sliderButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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

        {activeTab === 'Alerts' && (
          <View style={{ width: '100%' }}>
            <View style={styles.alertsCard}>
              <Text style={styles.alertsCardTitle}>Notification Preferences</Text>
              <Text style={styles.alertsCardSub}>
                Receive alerts when your child visits restricted sites or leaves the safe zone.
              </Text>

              {/* Email Alerts Section */}
              <View style={styles.alertOptionSection}>
                <View style={styles.alertOptionHeader}>
                  <View style={styles.alertIconRow}>
                    <Icon name="email" color={colors.cyanAccent} size={22} />
                    <Text style={styles.alertOptionTitle}>Email Alerts</Text>
                  </View>
                  <Switch
                    value={emailAlertsEnabled}
                    onValueChange={setEmailAlertsEnabled}
                    trackColor={{ true: colors.greenSuccess }}
                  />
                </View>
                <Text style={styles.alertOptionSub}>
                  Send notifications to your registered email
                </Text>
                <TextInput
                  style={styles.alertsInput}
                  placeholder="Enter parent's email address"
                  placeholderTextColor={colors.textMuted}
                  value={demoEmail}
                  onChangeText={setDemoEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.alertSectionDivider} />

              {/* SMS / Phone Alerts Section */}
              <View style={styles.alertOptionSection}>
                <View style={styles.alertOptionHeader}>
                  <View style={styles.alertIconRow}>
                    <Icon name="phone" color={colors.purpleAccent} size={22} />
                    <Text style={styles.alertOptionTitle}>SMS / Phone Alerts</Text>
                  </View>
                  <Switch
                    value={smsAlertsEnabled}
                    onValueChange={setSmsAlertsEnabled}
                    trackColor={{ true: colors.greenSuccess }}
                  />
                </View>
                <Text style={styles.alertOptionSub}>
                  Send text messages to your phone number
                </Text>
                <TextInput
                  style={styles.alertsInput}
                  placeholder="Enter parent's phone number"
                  placeholderTextColor={colors.textMuted}
                  value={demoPhone}
                  onChangeText={setDemoPhone}
                  keyboardType="phone-pad"
                />
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
                triggerSOS(13.0827, 80.2707, 'Simulated SOS panic alert triggered from Child Device');
                setActiveTab('Overview');
              }}
            >
              <Text style={styles.primaryBtnText}>Trigger Simulated SOS</Text>
            </TouchableOpacity>

            {renderNotificationSettings('Emergency SOS', notifySosPhone, setNotifySosPhone, notifySosEmail, setNotifySosEmail)}
          </View>
        )}

        {activeTab === 'Link' && (
          <View style={styles.linkingView}>
            <View style={styles.qrCard}>
              <Text style={styles.qrCardTitle}>Link Child Device</Text>
              
              <View style={styles.qrCodeWrapper}>
                {renderQRCode(pairingCode)}
                <View style={styles.scanLine} />
              </View>

              <View style={styles.codeContainer}>
                <Text style={styles.linkingCodeText}>{pairingCode || '000-000'}</Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={refreshPairingCode}
                  activeOpacity={0.7}
                >
                  <Icon name="refresh" color={colors.cyanAccent} size={16} />
                  <Text style={styles.refreshBtnText}>Refresh</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.linkingInstructions}>
                Scan the QR code or enter the 6-digit pairing code on the child device to establish a secure connection.
              </Text>

              <View style={styles.statusBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.linkStatusText}>Waiting for connection...</Text>
              </View>
            </View>
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 8,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  contactValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
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
    marginTop: 40,
    width: '100%',
    paddingBottom: 40,
  },
  linkingInstructions: {
    color: '#6B6E85',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  qrCard: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.cyanAccent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  qrCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.cyanAccent,
    opacity: 0.4,
    top: '50%',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    width: '100%',
    justifyContent: 'space-between',
  },
  linkingCodeText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.cyanAccent,
    letterSpacing: 2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  refreshBtnText: {
    color: colors.cyanAccent,
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orangeWarning,
    marginRight: 8,
  },
  linkStatusText: {
    color: colors.orangeWarning,
    fontSize: 11,
    fontWeight: '600',
  },
  radiusInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  radiusLabelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  radiusInputContainer: {
    width: 80,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radiusInput: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    width: '100%',
    height: '100%',
    padding: 0,
    textAlign: 'center',
  },
  radiusUnitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertsCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  alertsCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertsCardSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 16,
  },
  alertOptionSection: {
    width: '100%',
    marginVertical: 4,
  },
  alertOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  alertIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertOptionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  alertOptionSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: 34,
    marginTop: 2,
    marginBottom: 10,
  },
  alertsInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    paddingHorizontal: 12,
    fontSize: 14,
    marginLeft: 34,
    marginTop: 4,
  },
  alertSectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
});
