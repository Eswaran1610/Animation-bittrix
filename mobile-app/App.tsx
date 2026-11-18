import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/LoginScreen';
import { IdeaPoolScreen } from './src/screens/IdeaPoolScreen';
import { PipelineRadarScreen } from './src/screens/PipelineRadarScreen';
import { PreviewReviewScreen } from './src/screens/PreviewReviewScreen';
import { VideoLibraryScreen } from './src/screens/VideoLibraryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { TunnelConfigModal } from './src/screens/TunnelConfigModal';
import { MobileMember } from './src/types';
import { api } from './src/services/api';

import { BottomTabBar, TabKey } from './src/components/BottomTabBar';

type Screen = 'login' | 'pool' | 'radar' | 'preview' | 'library' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [currentMember, setCurrentMember] = useState<MobileMember | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [activeTopic, setActiveTopic] = useState<string>('');
  const [tunnelModalVisible, setTunnelModalVisible] = useState(false);

  const handleLoginSuccess = (member: MobileMember) => {
    setCurrentMember(member);
    setCurrentScreen('pool');
  };

  const handleLogout = () => {
    api.setToken(null, null);
    setCurrentMember(null);
    setCurrentScreen('login');
  };

  const handleOpenRadar = (projectId: string, topic: string) => {
    setActiveProjectId(projectId);
    setActiveTopic(topic);
    setCurrentScreen('radar');
  };

  const handleOpenPreview = (projectId: string) => {
    setActiveProjectId(projectId);
    setCurrentScreen('preview');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.content}>
          {currentScreen === 'login' && (
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onOpenTunnelConfig={() => setTunnelModalVisible(true)}
            />
          )}

          {currentScreen === 'pool' && currentMember && (
            <IdeaPoolScreen
              member={currentMember}
              onOpenRadar={handleOpenRadar}
              onOpenPreview={handleOpenPreview}
              onOpenLibrary={() => setCurrentScreen('library')}
              onLogout={handleLogout}
            />
          )}

          {currentScreen === 'radar' && (
            <PipelineRadarScreen
              projectId={activeProjectId}
              topic={activeTopic}
              onBack={() => setCurrentScreen('pool')}
              onPreviewReady={(pId) => {
                setActiveProjectId(pId);
                setCurrentScreen('preview');
              }}
            />
          )}

          {currentScreen === 'preview' && currentMember && (
            <PreviewReviewScreen
              projectId={activeProjectId}
              member={currentMember}
              onBack={() => setCurrentScreen('pool')}
              onFinalRenderComplete={() => setCurrentScreen('library')}
            />
          )}

          {currentScreen === 'library' && (
            <VideoLibraryScreen onBack={() => setCurrentScreen('pool')} />
          )}

          {currentScreen === 'profile' && currentMember && (
            <ProfileScreen
              member={currentMember}
              onLogout={handleLogout}
              onOpenTunnelConfig={() => setTunnelModalVisible(true)}
            />
          )}
        </View>

        {/* Persistent Bottom Studio Navigation Bar (when authenticated) */}
        {currentMember && currentScreen !== 'login' && (
          <BottomTabBar
            activeTab={currentScreen as TabKey}
            onTabPress={(tab) => setCurrentScreen(tab)}
            isRadarActive={currentScreen === 'radar'}
            hasPreview={Boolean(activeProjectId)}
          />
        )}

        <TunnelConfigModal
          visible={tunnelModalVisible}
          onClose={() => setTunnelModalVisible(false)}
          onSaved={(url) => {
            console.log('Updated server URL:', url);
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a12',
  },
  content: {
    flex: 1,
  },
});
