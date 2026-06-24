import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/styles/theme';

// Import Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { GeoTrackingScreen } from './src/screens/GeoTrackingScreen';
import { ParentalControlScreen } from './src/screens/ParentalControlScreen';
import { MalwareAnalysisScreen } from './src/screens/MalwareAnalysisScreen';
import { CallerIntelligenceScreen } from './src/screens/CallerIntelligenceScreen';
import { ChildLinkScreen } from './src/screens/ChildLinkScreen';
import { ChildModeScreen } from './src/screens/ChildModeScreen';
import { VulnerabilityDetectionScreen } from './src/screens/VulnerabilityDetectionScreen';

type ScreenName =
  | 'Login'
  | 'SignUp'
  | 'Dashboard'
  | 'GeoTracking'
  | 'ParentalControl'
  | 'MalwareAnalysis'
  | 'CallerIntelligence'
  | 'ChildLink'
  | 'ChildMode'
  | 'VulnerabilityDetection';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Login');
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState('');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Login':
        return (
          <LoginScreen
            onSignInSuccess={() => {
              setSignUpSuccessMessage('');
              setCurrentScreen('Dashboard');
            }}
            onSetUpChildDevice={() => setCurrentScreen('ChildLink')}
            onGoToSignUp={() => {
              setSignUpSuccessMessage('');
              setCurrentScreen('SignUp');
            }}
            signUpSuccessMessage={signUpSuccessMessage}
          />
        );
      case 'SignUp':
        return (
          <SignUpScreen
            onSignUpSuccess={() => {
              setSignUpSuccessMessage('Account created successfully! Please sign in.');
              setCurrentScreen('Login');
            }}
            onGoToLogin={() => {
              setSignUpSuccessMessage('');
              setCurrentScreen('Login');
            }}
          />
        );
      case 'Dashboard':
        return (
          <DashboardScreen
            onSignOut={() => setCurrentScreen('Login')}
            onOpenGeoTracking={() => setCurrentScreen('GeoTracking')}
            onOpenParentalControl={() => setCurrentScreen('ParentalControl')}
            onOpenMalwareAnalysis={() => setCurrentScreen('MalwareAnalysis')}
            onOpenCallerIntelligence={() => setCurrentScreen('CallerIntelligence')}
            onOpenVulnerabilityDetection={() => setCurrentScreen('VulnerabilityDetection')}
          />
        );
      case 'GeoTracking':
        return <GeoTrackingScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'ParentalControl':
        return <ParentalControlScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'MalwareAnalysis':
        return <MalwareAnalysisScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'CallerIntelligence':
        return <CallerIntelligenceScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'VulnerabilityDetection':
        return <VulnerabilityDetectionScreen onBack={() => setCurrentScreen('Dashboard')} />;
      case 'ChildLink':
        return (
          <ChildLinkScreen
            onBack={() => setCurrentScreen('Login')}
            onLinkSuccess={() => setCurrentScreen('ChildMode')}
          />
        );
      case 'ChildMode':
        return <ChildModeScreen onUnlink={() => setCurrentScreen('Login')} />;
      default:
        return (
          <LoginScreen
            onSignInSuccess={() => setCurrentScreen('Dashboard')}
            onSetUpChildDevice={() => setCurrentScreen('ChildLink')}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          {renderScreen()}
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
});

export default App;
