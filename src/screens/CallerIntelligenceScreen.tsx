import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  FlatList,
  Modal,
  Platform,
  ToastAndroid,
  Alert,
  StatusBar,
} from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';

interface MockCall {
  name: string;
  number: string;
  riskScore: number;
  type: 'Normal' | 'Spam' | 'Scam' | 'High-Risk';
  carrier: string;
  location: string;
  frequency: string;
}

interface BlockedNumber {
  number: string;
  name: string;
  reason: string;
  date: string;
}

interface SpamCall {
  name: string;
  number: string;
  riskScore: number;
  date: string;
}

interface CallReport {
  id: string;
  number: string;
  type: string;
  description: string;
  timestamp: string;
}

interface CallerIntelligenceScreenProps {
  onBack: () => void;
}

export const CallerIntelligenceScreen: React.FC<CallerIntelligenceScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  // Mock databases
  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumber[]>([
    { number: '+1 (800) 555-0199', name: 'Robo-Loan Inc.', reason: 'Aggressive Spam Dialing', date: '2026-06-02' },
    { number: '+1 (866) 492-3001', name: 'Imposter IRS Agent', reason: 'Scam Attempt', date: '2026-06-03' },
    { number: '+1 (510) 902-8811', name: 'Insurance Telemarketer', reason: 'Unwanted Solicitation', date: '2026-06-04' }
  ]);

  const [spamCalls, setSpamCalls] = useState<SpamCall[]>([
    { name: 'Suspected Robocall', number: '+1 (202) 555-0143', riskScore: 85, date: '2026-06-04 11:30 AM' },
    { name: 'Phishing Attempt', number: '+1 (312) 555-0178', riskScore: 92, date: '2026-06-04 09:15 AM' },
    { name: 'Telemarketing SPAM', number: '+1 (415) 555-0192', riskScore: 75, date: '2026-06-03 04:22 PM' }
  ]);

  const [reportHistory, setReportHistory] = useState<CallReport[]>([
    { id: '1', number: '+1 (415) 555-0192', type: 'Telemarketing', description: 'Called 5 times in 2 hours with pre-recorded message', timestamp: '2026-06-03 05:00 PM' }
  ]);

  const [recentAlerts, setRecentAlerts] = useState<string[]>([
    'Critical Scam Blocked: +1 (866) 492-3001 at 09:42 AM',
    'Auto-Blocked Telemarketer: +1 (510) 902-8811 at 08:30 AM',
    'Spam Risk Detected: +1 (202) 555-0143 at 11:30 AM'
  ]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<MockCall | null>(null);

  // Settings
  const [autoBlockEnabled, setAutoBlockEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState(75); // 0.75 in Kotlin
  const [privacyLogging, setPrivacyLogging] = useState(false);

  // Simulator
  const [activeSimulatedCall, setActiveSimulatedCall] = useState<MockCall | null>(null);

  // Popups
  const [showSpamWarning, setShowSpamWarning] = useState(false);
  const [showScamAlert, setShowScamAlert] = useState(false);
  const [showHighRiskAlert, setShowHighRiskAlert] = useState(false);
  const [showBlockConfirmation, setShowBlockConfirmation] = useState(false);
  const [showReportPopup, setShowReportPopup] = useState(false);

  // Temp reporting variables
  const [reportType, setReportType] = useState('Robocall / Telemarketing');
  const [reportDesc, setReportDesc] = useState('');
  const [callerToBlockOrReport, setCallerToBlockOrReport] = useState<MockCall | null>(null);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Notice', message);
    }
  };

  const handleSimulateCall = (call: MockCall) => {
    setActiveSimulatedCall(call);
    if (call.type === 'Spam') {
      setShowSpamWarning(true);
    } else if (call.type === 'Scam') {
      setShowScamAlert(true);
    } else if (call.type === 'High-Risk') {
      setShowHighRiskAlert(true);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      const db: MockCall[] = [
        { name: 'Leo (Family)', number: '+1 (555) 019-2831', riskScore: 2, type: 'Normal', carrier: 'AT&T', location: 'San Jose, CA', frequency: '12 calls/week' },
        { name: 'IRS Impostor', number: '+1 (866) 492-3001', riskScore: 98, type: 'Scam', carrier: 'VoIP Provider', location: 'Washington DC, USA', frequency: '88 calls/week' },
        { name: 'Prize Sweepstakes Fraud', number: '+1 (800) 999-5566', riskScore: 95, type: 'High-Risk', carrier: 'CenturyLink', location: 'Miami, FL', frequency: '150 calls/week' },
        { name: 'Suspected Robodialer', number: '+1 (202) 555-0143', riskScore: 85, type: 'Spam', carrier: 'Level 3 Telecom', location: 'Seattle, WA', frequency: '45 calls/week' }
      ];

      const cleanQuery = searchQuery.trim().replace(/\D/g, '');
      const found = db.find(c => c.number.replace(/\D/g, '').includes(cleanQuery));

      if (found) {
        setSearchResult(found);
      } else {
        setSearchResult({
          name: 'Unknown Caller',
          number: searchQuery,
          riskScore: 50,
          type: 'Normal',
          carrier: 'Unknown Carrier',
          location: 'Unknown Location',
          frequency: '1 call/week'
        });
      }
    }
  };

  // Score circular gauge
  const radius = 40;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const angle = 0.94 * 260; // 94% secure
  const strokeDashoffset = circumference - (angle / 360) * circumference;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (activeTab !== 0) {
              setActiveTab(0);
            } else {
              onBack();
            }
          }}
        >
          <Icon name="arrow-back" color="#fff" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Caller Intelligence</Text>
          <Text style={styles.headerSubtitle}>Real-Time Call Shield & Spam Analysis Hub</Text>
        </View>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRowContainer}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {[
            'Dashboard',
            'Live Call Simulator',
            'Number Search',
            'Call History',
            'Spam & Blocked',
            'Scam Info Center',
            'Analytics & Settings'
          ].map((label, idx) => {
            const isSelected = activeTab === idx;
            return (
              <TouchableOpacity
                key={label}
                style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                onPress={() => setActiveTab(idx)}
              >
                <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* VIEW PANEL CONTROLLER */}
      <ScrollView contentContainerStyle={styles.viewContent}>
        {activeTab === 0 && (
          <View style={{ width: '100%' }}>
            {/* Security Score Widget */}
            <View style={styles.dashboardCard}>
              <View style={styles.gaugeRow}>
                <View style={styles.gaugeContainer}>
                  <Svg width={90} height={90} viewBox="0 0 100 100">
                    <G rotation="-220" origin="50, 50">
                      <Circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke="#140c3f"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${(260 / 360) * circumference} ${circumference}`}
                        strokeLinecap="round"
                      />
                      <Circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke={colors.cyanAccent}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </G>
                  </Svg>
                  <View style={styles.gaugeTextWrapper}>
                    <Text style={styles.gaugePct}>94%</Text>
                    <Text style={styles.gaugeLabel}>Secure</Text>
                  </View>
                </View>

                <View style={styles.gaugeInfo}>
                  <Text style={styles.gaugeInfoTitle}>Caller Security Score</Text>
                  <Text style={styles.gaugeInfoSub}>Shield is actively filtering unknown incoming calls.</Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.greenStatusDot} />
                    <Text style={styles.statusText}>Protected & Safe</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Call Stats Grid */}
            <View style={styles.statsRow}>
              <View style={styles.statWidget}>
                <Text style={styles.statWidgetLabel}>Calls Today</Text>
                <Text style={styles.statWidgetValue}>
                  {42 + spamCalls.length + blockedNumbers.length}
                </Text>
              </View>
              <View style={[styles.statWidget, { borderColor: colors.orangeWarning + '55' }]}>
                <Text style={styles.statWidgetLabel}>Spam Calls</Text>
                <Text style={[styles.statWidgetValue, { color: colors.orangeWarning }]}>
                  {spamCalls.length}
                </Text>
              </View>
              <View style={[styles.statWidget, { borderColor: colors.redDanger + '55' }]}>
                <Text style={styles.statWidgetLabel}>Blocked Calls</Text>
                <Text style={[styles.statWidgetValue, { color: colors.redDanger }]}>
                  {blockedNumbers.length}
                </Text>
              </View>
            </View>

            {/* Recent Alerts */}
            <Text style={styles.sectionTitle}>RECENT SECURITY ALERTS</Text>
            {recentAlerts.map((alert, idx) => (
              <View key={idx} style={styles.alertItem}>
                <Icon name="notifications-active" color={colors.cyanAccent} size={16} />
                <Text style={styles.alertText}>{alert}</Text>
              </View>
            ))}

            {/* Quick Actions */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>QUICK ACTION CHANNELS</Text>
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.actionWidget} onPress={() => setActiveTab(1)}>
                <Icon name="phone-callback" color={colors.greenSuccess} size={24} />
                <Text style={styles.actionWidgetTitle}>Simulate Live Call</Text>
                <Text style={styles.actionWidgetSub}>Test shield triggers</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionWidget} onPress={() => setActiveTab(2)}>
                <Icon name="search" color={colors.cyanAccent} size={24} />
                <Text style={styles.actionWidgetTitle}>Directory Lookup</Text>
                <Text style={styles.actionWidgetSub}>Reputation database</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 1 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionTitle}>ACTIVE INCOMING CALL SIMULATION ENGINE</Text>
            <View style={styles.simulatorBtnsRow}>
              <TouchableOpacity
                style={[styles.simBtn, { borderColor: colors.greenSuccess }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'Father Leo',
                    number: '+1 (555) 019-2831',
                    riskScore: 2,
                    type: 'Normal',
                    carrier: 'Verizon Wireless',
                    location: 'San Jose, CA',
                    frequency: '12 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>Safe Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { borderColor: colors.orangeWarning }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'Telemarketing Robocall',
                    number: '+1 (202) 555-0143',
                    riskScore: 85,
                    type: 'Spam',
                    carrier: 'Level 3 Telecom',
                    location: 'Seattle, WA',
                    frequency: '45 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>Spam Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { borderColor: colors.redDanger }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'IRS Impostor Fraud',
                    number: '+1 (866) 492-3001',
                    riskScore: 98,
                    type: 'Scam',
                    carrier: 'VoIP Core',
                    location: 'Washington DC, USA',
                    frequency: '88 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>Scam Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { borderColor: '#ff1111' }]}
                onPress={() =>
                  handleSimulateCall({
                    name: 'Bank Fraud Hijacker',
                    number: '+1 (800) 999-5566',
                    riskScore: 99,
                    type: 'High-Risk',
                    carrier: 'Imposter Network',
                    location: 'New York, USA',
                    frequency: '150 calls/week'
                  })
                }
              >
                <Text style={styles.simBtnText}>High-Risk Call</Text>
              </TouchableOpacity>
            </View>

            {/* Simulated Active Call Screen */}
            {activeSimulatedCall ? (
              <View style={styles.callScreenCard}>
                <Icon name="phone-in-talk" color={colors.purpleAccent} size={48} />
                <Text style={styles.callScreenName}>{activeSimulatedCall.name}</Text>
                <Text style={styles.callScreenNumber}>{activeSimulatedCall.number}</Text>
                <Text style={styles.callScreenCarrier}>
                  Carrier: {activeSimulatedCall.carrier} | {activeSimulatedCall.location}
                </Text>
                <Text
                  style={[
                    styles.callScreenScore,
                    {
                      color:
                        activeSimulatedCall.riskScore > 80
                          ? colors.redDanger
                          : activeSimulatedCall.riskScore > 50
                          ? colors.orangeWarning
                          : colors.greenSuccess,
                    },
                  ]}
                >
                  Risk Score: {activeSimulatedCall.riskScore}%
                </Text>

                <View style={styles.callActionsRow}>
                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: 'rgba(107, 110, 133, 0.2)' }]}
                    onPress={() => {
                      showToast(`Call allowed from ${activeSimulatedCall.name}`);
                      setActiveSimulatedCall(null);
                    }}
                  >
                    <Text style={styles.callBtnText}>Allow</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      setCallerToBlockOrReport(activeSimulatedCall);
                      setShowBlockConfirmation(true);
                    }}
                  >
                    <Text style={styles.callBtnText}>Block</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.cyanAccent }]}
                    onPress={() => {
                      setCallerToBlockOrReport(activeSimulatedCall);
                      setReportDesc('');
                      setShowReportPopup(true);
                    }}
                  >
                    <Text style={[styles.callBtnText, { color: '#000' }]}>Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.callScreenCardEmpty}>
                <Icon name="phone-in-talk" color="#6B6E85" size={48} />
                <Text style={styles.emptyCallText}>No simulated call active. Tap one of the triggers above.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 2 && (
          <View style={{ width: '100%' }}>
            <View style={styles.searchCard}>
              <Text style={styles.searchTitle}>Reputation Directory Search</Text>
              <Text style={styles.searchSub}>Lookup the trust index of any phone number</Text>

              <View style={styles.searchInputRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter number (e.g. +1 (800) 555-0199)"
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                  <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>

            {searchResult && (
              <View style={styles.searchResultCard}>
                <Text style={styles.resultTitle}>Search Result Details:</Text>
                <Text style={styles.resultName}>{searchResult.name}</Text>
                <Text style={styles.resultNumber}>{searchResult.number}</Text>
                <Text style={styles.resultSub}>Carrier: {searchResult.carrier}</Text>
                <Text style={styles.resultSub}>Location: {searchResult.location}</Text>
                <Text style={styles.resultSub}>Frequency: {searchResult.frequency}</Text>
                <Text
                  style={[
                    styles.resultScoreText,
                    {
                      color:
                        searchResult.riskScore > 80
                          ? colors.redDanger
                          : searchResult.riskScore > 50
                          ? colors.orangeWarning
                          : colors.greenSuccess,
                    },
                  ]}
                >
                  Risk Index: {searchResult.riskScore}/100
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 3 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionTitle}>CALL HISTORY LOGS</Text>
            <View style={styles.listEmptyPlaceholder}>
              <Icon name="phone" color={colors.textMuted} size={48} />
              <Text style={styles.placeholderText}>All incoming calls cleared. Secure filter active.</Text>
            </View>
          </View>
        )}

        {activeTab === 4 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionTitle}>SPAM CALLS LOG</Text>
            {spamCalls.map((spam, idx) => (
              <View key={idx} style={styles.blockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockedName}>{spam.name}</Text>
                  <Text style={styles.blockedNumber}>{spam.number}</Text>
                  <Text style={styles.blockedDate}>Score: {spam.riskScore}% | {spam.date}</Text>
                </View>
                <TouchableOpacity
                  style={styles.unblockBtn}
                  onPress={() => {
                    setBlockedNumbers([
                      ...blockedNumbers,
                      { number: spam.number, name: spam.name, reason: 'Auto-Blocked from Spam List', date: 'Today' }
                    ]);
                    setSpamCalls(spamCalls.filter((_, i) => i !== idx));
                    showToast(`Blocked: ${spam.number}`);
                  }}
                >
                  <Text style={styles.unblockBtnText}>Block</Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>BLOCKED TELEPHONY REGISTRY</Text>
            {blockedNumbers.map((blocked, idx) => (
              <View key={idx} style={styles.blockedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockedName}>{blocked.name}</Text>
                  <Text style={styles.blockedNumber}>{blocked.number}</Text>
                  <Text style={styles.blockedDate}>Reason: {blocked.reason} | {blocked.date}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.unblockBtn, { borderColor: colors.greenSuccess }]}
                  onPress={() => {
                    setBlockedNumbers(blockedNumbers.filter((_, i) => i !== idx));
                    showToast(`Unblocked: ${blocked.number}`);
                  }}
                >
                  <Text style={[styles.unblockBtnText, { color: colors.greenSuccess }]}>Unblock</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 5 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionTitle}>SCAM THREAT INTELLIGENCE CENTER</Text>
            <View style={styles.scamCard}>
              <Text style={styles.scamTitle}>IRS Government Impersonation</Text>
              <Text style={styles.scamDesc}>
                Scammers call claiming to be IRS agents. They state you owe back taxes and threaten arrest if not paid immediately via gift cards or wire transfers.
              </Text>
              <Text style={styles.scamAction}>Rule: The IRS will never demand immediate payment over the phone.</Text>
            </View>

            <View style={[styles.scamCard, { marginTop: 16 }]}>
              <Text style={styles.scamTitle}>Bank OTP & Credential Theft</Text>
              <Text style={styles.scamDesc}>
                Attackers impersonate bank fraud departments. They ask you to read back a verification code sent to your phone to "cancel a fraudulent charge," which they actually use to drain your account.
              </Text>
              <Text style={styles.scamAction}>Rule: Never share OTP or login codes with any caller.</Text>
            </View>
          </View>
        )}

        {activeTab === 6 && (
          <View style={{ width: '100%' }}>
            <View style={styles.settingCard}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Auto-Block High-Risk Calls</Text>
                  <Text style={styles.settingSub}>Silently terminate known fraud senders</Text>
                </View>
                <Switch value={autoBlockEnabled} onValueChange={setAutoBlockEnabled} trackColor={{ true: colors.purpleAccent }} />
              </View>

              <View style={[styles.switchRow, { marginTop: 20 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Spam Alert Notifications</Text>
                  <Text style={styles.settingSub}>Display floating warning banners for risk callers</Text>
                </View>
                <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ true: colors.purpleAccent }} />
              </View>

              <View style={styles.cardDivider} />

              <Text style={styles.settingTitle}>Filter Sensitivity: {sensitivity}%</Text>
              <Text style={styles.settingSub}>Threshold for auto-blocking based on AI Risk score</Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity style={styles.sliderButton} onPress={() => setSensitivity(Math.max(10, sensitivity - 5))}>
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <View style={styles.sliderTrackBg}>
                  <View style={[styles.sliderTrackFill, { width: `${sensitivity}%` }]} />
                </View>
                <TouchableOpacity style={styles.sliderButton} onPress={() => setSensitivity(Math.min(100, sensitivity + 5))}>
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Privacy-Preserving Logging</Text>
                  <Text style={styles.settingSub}>Anonymize numbers before threat analysis uploads</Text>
                </View>
                <Switch value={privacyLogging} onValueChange={setPrivacyLogging} trackColor={{ true: colors.purpleAccent }} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* POPUP 1: SPAM WARNING DIALOG */}
      <Modal transparent={true} visible={showSpamWarning && activeSimulatedCall !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: colors.orangeWarning }]}>
            <View style={styles.popupHeader}>
              <Icon name="warning" color={colors.orangeWarning} size={36} />
              <Text style={styles.popupTitle}>SPAM CALL DETECTED</Text>
            </View>
            {activeSimulatedCall && (
              <>
                <Text style={styles.popupSub}>Number: {activeSimulatedCall.number}</Text>
                <Text style={[styles.popupRiskText, { color: colors.redDanger }]}>
                  Risk Score: {activeSimulatedCall.riskScore}%
                </Text>
                <Text style={styles.popupDesc}>
                  This number matches active automated spam networks. We recommend blocking this caller.
                </Text>

                <View style={styles.popupActions}>
                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: 'rgba(107, 110, 133, 0.2)' }]}
                    onPress={() => {
                      showToast('Call allowed under observation');
                      setShowSpamWarning(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Allow</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      setBlockedNumbers([
                        ...blockedNumbers,
                        { number: activeSimulatedCall.number, name: activeSimulatedCall.name, reason: 'Spam Network Warning', date: 'Today' }
                      ]);
                      showToast('Caller Blocked');
                      setActiveSimulatedCall(null);
                      setShowSpamWarning(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Block</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 2: SCAM WARNING DIALOG */}
      <Modal transparent={true} visible={showScamAlert && activeSimulatedCall !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: colors.redDanger, backgroundColor: '#2E0914' }]}>
            <View style={styles.popupHeader}>
              <Icon name="gavel" color={colors.redDanger} size={36} />
              <Text style={styles.popupTitle}>IMMEDIATE SCAM WARNING</Text>
            </View>
            {activeSimulatedCall && (
              <>
                <Text style={[styles.popupRiskText, { color: colors.redDanger, fontWeight: '900' }]}>
                  Threat Level: CRITICAL RISK
                </Text>
                <Text style={styles.popupSub}>Caller: {activeSimulatedCall.name}</Text>
                <Text style={styles.popupSub}>Number: {activeSimulatedCall.number}</Text>
                <Text style={styles.popupDesc}>
                  Recommended Action: HANG UP IMMEDIATELY. This caller has been reported trying to spoof government bodies for credential fraud.
                </Text>

                <View style={styles.popupActions}>
                  <TouchableOpacity style={styles.popupTextBtn} onPress={() => setShowScamAlert(false)}>
                    <Text style={styles.popupTextBtnText}>Dismiss Alert</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      setBlockedNumbers([
                        ...blockedNumbers,
                        { number: activeSimulatedCall.number, name: activeSimulatedCall.name, reason: 'Scam Warning Block', date: 'Today' }
                      ]);
                      showToast('Scam Number Terminated & Blocked');
                      setActiveSimulatedCall(null);
                      setShowScamAlert(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Block & Report</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 3: HIGH-RISK CALLER DIALOG */}
      <Modal transparent={true} visible={showHighRiskAlert && activeSimulatedCall !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#ff1111', backgroundColor: '#2e0000' }]}>
            <View style={styles.popupHeader}>
              <Icon name="cancel" color="#ff1111" size={44} />
              <Text style={styles.popupTitle}>CRITICAL: HIGH RISK ATTACK</Text>
            </View>
            {activeSimulatedCall && (
              <>
                <Text style={[styles.popupRiskText, { color: '#ff1111', fontWeight: '900' }]}>
                  Risk Evaluation Score: {activeSimulatedCall.riskScore}%
                </Text>
                <Text style={styles.popupDesc}>
                  This caller is linked to known financial phishing campaigns. The connection is highly suspicious.
                </Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: '#ff1111', height: 46 }]}
                  onPress={() => {
                    setBlockedNumbers([
                      ...blockedNumbers,
                      { number: activeSimulatedCall.number, name: activeSimulatedCall.name, reason: 'Critical AI High-Risk Auto-Block', date: 'Today' }
                    ]);
                    showToast('Immediate Block Executed');
                    setActiveSimulatedCall(null);
                    setShowHighRiskAlert(false);
                  }}
                >
                  <Text style={styles.primaryBtnText}>IMMEDIATE BLOCK SENDER</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.popupTextBtn, { marginTop: 12 }]} onPress={() => setShowHighRiskAlert(false)}>
                  <Text style={styles.popupTextBtnText}>Ignore Risk (Dangerous)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 4: BLOCK CONFIRMATION */}
      <Modal transparent={true} visible={showBlockConfirmation && callerToBlockOrReport !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.popupTitle}>Confirm Block Caller</Text>
            {callerToBlockOrReport && (
              <>
                <Text style={styles.popupDesc}>
                  Are you sure you want to block calls and texts from {callerToBlockOrReport.name} ({callerToBlockOrReport.number})?
                </Text>

                <View style={styles.popupActions}>
                  <TouchableOpacity style={styles.popupTextBtn} onPress={() => setShowBlockConfirmation(false)}>
                    <Text style={styles.popupTextBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.redDanger }]}
                    onPress={() => {
                      setBlockedNumbers([
                        ...blockedNumbers,
                        { number: callerToBlockOrReport.number, name: callerToBlockOrReport.name, reason: 'User Block', date: 'Today' }
                      ]);
                      showToast('Caller Blocked');
                      setActiveSimulatedCall(null);
                      setShowBlockConfirmation(false);
                    }}
                  >
                    <Text style={styles.popupBtnText}>Confirm Block</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* POPUP 5: REPORT SENDER FORM */}
      <Modal transparent={true} visible={showReportPopup && callerToBlockOrReport !== null} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: colors.cyanAccent }]}>
            <Text style={styles.popupTitle}>Report Caller to Threat Database</Text>
            {callerToBlockOrReport && (
              <>
                <Text style={styles.reportFormLabel}>Report Type:</Text>
                {['Robocall / Telemarketing', 'Phishing / Identity Theft', 'Government Impersonation', 'Harassment'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioRow}
                    onPress={() => setReportType(type)}
                  >
                    <View style={styles.radioOuter}>
                      {reportType === type && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{type}</Text>
                  </TouchableOpacity>
                ))}

                <TextInput
                  style={styles.reportInput}
                  placeholder="Incident Description (Optional)"
                  placeholderTextColor={colors.textMuted}
                  value={reportDesc}
                  onChangeText={setReportDesc}
                  multiline={true}
                />

                <View style={styles.popupActions}>
                  <TouchableOpacity style={styles.popupTextBtn} onPress={() => setShowReportPopup(false)}>
                    <Text style={styles.popupTextBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.popupBtn, { backgroundColor: colors.cyanAccent }]}
                    onPress={() => {
                      setReportHistory([
                        ...reportHistory,
                        {
                          id: Math.random().toString(),
                          number: callerToBlockOrReport.number,
                          type: reportType,
                          description: reportDesc || 'No description provided.',
                          timestamp: 'Today 15:00'
                        }
                      ]);
                      showToast('Report Submitted. Thank you for securing the network!');
                      setShowReportPopup(false);
                    }}
                  >
                    <Text style={[styles.popupBtnText, { color: '#000' }]}>Submit Report</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: '#0F0A2B',
    borderWidth: 1,
    borderColor: '#337b2cbf',
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
    color: '#6B6E85',
    fontSize: 11,
    marginTop: 2,
  },
  tabsRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  tabsRow: {
    paddingHorizontal: 14,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#07051F',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.12)',
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(0, 119, 182, 0.2)',
    borderColor: '#00E5FF',
  },
  tabBtnText: {
    fontSize: 11,
    color: '#6B6E85',
  },
  tabBtnTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  viewContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dashboardCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#0A0726',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    padding: 16,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gaugeContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugePct: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  gaugeLabel: {
    color: '#6B6E85',
    fontSize: 8,
  },
  gaugeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  gaugeInfoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gaugeInfoSub: {
    color: '#6B6E85',
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  greenStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  statusText: {
    color: '#00E676',
    fontSize: 10,
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  statWidget: {
    flex: 0.31,
    borderRadius: 10,
    backgroundColor: '#0A0726',
    borderWidth: 0.5,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    padding: 12,
  },
  statWidgetLabel: {
    color: '#6B6E85',
    fontSize: 10,
  },
  statWidgetValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B6E85',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0F0923',
    borderWidth: 0.5,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    padding: 12,
    width: '100%',
    marginBottom: 8,
  },
  alertText: {
    color: '#fff',
    fontSize: 11,
    marginLeft: 10,
    flex: 1,
  },
  actionWidget: {
    flex: 0.48,
    borderRadius: 10,
    backgroundColor: '#0A0726',
    padding: 14,
  },
  actionWidgetTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  actionWidgetSub: {
    color: '#6B6E85',
    fontSize: 9,
    marginTop: 2,
  },
  simulatorBtnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  simBtn: {
    width: '48%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  simBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  callScreenCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#0A0726',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.22)',
    padding: 24,
    alignItems: 'center',
  },
  callScreenCardEmpty: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    backgroundColor: '#0A0726',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCallText: {
    color: '#6B6E85',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  callScreenName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  callScreenNumber: {
    fontSize: 14,
    color: '#6B6E85',
    marginTop: 4,
  },
  callScreenCarrier: {
    fontSize: 12,
    color: '#6B6E85',
    marginTop: 2,
  },
  callScreenScore: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
  },
  callActionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  callBtn: {
    flex: 0.31,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  searchCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  searchTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  searchSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  searchInputRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  searchInput: {
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
  searchBtn: {
    width: 70,
    height: 44,
    backgroundColor: colors.cyanAccent,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  searchResultCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#07051f',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 16,
  },
  resultName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  resultNumber: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  resultScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
  },
  listEmptyPlaceholder: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 12,
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  blockedName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  blockedNumber: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  blockedDate: {
    color: '#6B6E85',
    fontSize: 10,
    marginTop: 2,
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.redDanger,
  },
  unblockBtnText: {
    color: colors.redDanger,
    fontSize: 11,
    fontWeight: 'bold',
  },
  scamCard: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  scamTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scamDesc: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  scamAction: {
    color: colors.orangeWarning,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 8,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
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
    marginHorizontal: 12,
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: colors.purpleAccent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    backgroundColor: '#0F0A2B',
    borderWidth: 1,
    padding: 20,
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  popupSub: {
    color: '#6B6E85',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  popupRiskText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  popupDesc: {
    color: '#9A8C98',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginVertical: 16,
  },
  popupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  popupBtn: {
    flex: 0.48,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  popupTextBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    flex: 0.48,
  },
  popupTextBtnText: {
    color: '#6B6E85',
    fontSize: 12,
  },
  reportFormLabel: {
    color: '#6B6E85',
    fontSize: 11,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.cyanAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cyanAccent,
  },
  radioLabel: {
    color: '#fff',
    fontSize: 13,
  },
  reportInput: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.2)',
    backgroundColor: colors.background,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginTop: 16,
    textAlignVertical: 'top',
  },
  resultTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultSub: {
    color: '#6B6E85',
    fontSize: 12,
    marginTop: 4,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
