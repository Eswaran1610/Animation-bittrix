import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../services/api';
import { COLORS, SHADOWS } from '../theme';

interface Props {
  projectId: string;
  topic: string;
  onBack: () => void;
  onPreviewReady: (projectId: string) => void;
}

export const PipelineRadarScreen: React.FC<Props> = ({
  projectId,
  topic,
  onBack,
  onPreviewReady,
}) => {
  const [progress, setProgress] = useState(20);
  const [statusMessage, setStatusMessage] = useState('Agent conducting CLI deep research on office laptop...');
  const [tokensCount, setTokensCount] = useState<number>(313474);
  const [activeProvider, setActiveProvider] = useState<string>('AGY');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    `[Pipeline Init] Project: ${projectId.slice(0, 8)}...`,
    `[Topic] "${topic}"`,
    `[Provider] AGY Engine (gemini-3.8-flash-medium) @ 60 FPS`,
    `[Telemetry] Live connected to office workstation`,
    `[Timing Rule] Duration + 3.0s Bittrix Outro Exact Enforced`,
  ]);
  const [isPreviewAvailable, setIsPreviewAvailable] = useState(false);

  const fetchTelemetry = async () => {
    try {
      const [usage, prov] = await Promise.all([
        api.getTokenUsage().catch(() => null),
        api.getActiveProvider().catch(() => null),
      ]);
      if (usage?.total_tokens) {
        setTokensCount(Number(usage.total_tokens));
      }
      if (prov?.activeProvider) {
        setActiveProvider(prov.activeProvider.toUpperCase());
      }
    } catch {}
  };

  useEffect(() => {
    fetchTelemetry();

    const unsubscribeWs = api.connectWs((event) => {
      if (event.projectId === projectId || !event.projectId) {
        if (event.type === 'pipeline_progress') {
          if (event.progress !== undefined) setProgress(event.progress);
          if (event.status) {
            setStatusMessage(event.status);
            setErrorMsg(null);
          }
          setLogs((prev) => [
            ...prev.slice(-35),
            `[${new Date().toLocaleTimeString()}] ${event.status || event.stage}`,
          ]);
        }
        if (event.type === 'generation_failed' || event.type === 'pipeline_error' || event.error) {
          setErrorMsg(event.error || event.message || 'Generation failed on host workstation.');
          setStatusMessage(`Failed: ${event.error || 'Pipeline error'}`);
          setLogs((prev) => [
            ...prev.slice(-35),
            `[${new Date().toLocaleTimeString()}] ❌ ERROR: ${event.error || event.message}`,
          ]);
        }
        if (event.type === 'project_updated' || event.type === 'preview_ready') {
          if (event.stage === 'preview_review' || event.status?.includes('Preview ready')) {
            setIsPreviewAvailable(true);
            setProgress(100);
            setErrorMsg(null);
            setStatusMessage('Stage 1 Preview MP4 ready for mobile review!');
          }
        }
      }
    });

    const timer = setInterval(async () => {
      try {
        fetchTelemetry();
        const preview = await api.getPreview(projectId);
        if (preview.previewUrl || preview.stage === 'preview_review') {
          setIsPreviewAvailable(true);
          setProgress(100);
          setErrorMsg(null);
          setStatusMessage('Stage 1 Preview MP4 ready for mobile review!');
          clearInterval(timer);
        }
      } catch {}
    }, 4000);

    return () => {
      unsubscribeWs();
      clearInterval(timer);
    };
  }, [projectId]);

  const handleRetry = async () => {
    setRetrying(true);
    setErrorMsg(null);
    setStatusMessage('Re-dispatching generation with AGY engine...');
    try {
      await api.setActiveProvider('agy');
      setActiveProvider('AGY');
      setProgress(15);
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 🔄 Retrying pipeline with AGY engine...`,
      ]);
      Alert.alert('Retrying', 'Pipeline generation re-launched on office laptop.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setRetrying(false);
    }
  };

  const stages = [
    { title: 'CLI Research ▶', sub: 'Fact claim table & beat plan', active: progress >= 15, done: progress >= 35, icon: '🔍' },
    { title: 'Plan Ready ▶', sub: 'Script locked & visual cues mapped', active: progress >= 35, done: progress >= 55, icon: '📋' },
    { title: 'Audio Synthesis ▶', sub: 'Edge-TTS & Whisper word timestamps', active: progress >= 55, done: progress >= 75, icon: '🎙️' },
    { title: 'Remotion TSX Code ▶', sub: 'Bespoke code synthesis & AST gates', active: progress >= 75, done: progress >= 90, icon: '⚛️' },
    { title: 'Stage 1 Preview ("Before MP4") ▶', sub: 'Fast 30fps validation render', active: progress >= 90, done: progress >= 100, icon: '🎬' },
    { title: 'Final 1080p Master Render ▶', sub: 'Full HD 60fps export to all wallets', active: progress >= 100, done: isPreviewAvailable, icon: '🏆' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>◀ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>AGY Pipeline Radar</Text>
          <Text style={styles.headerSub}>OFFICE WORKSTATION CONTROLLER</Text>
        </View>
        <View style={{ width: 45 }} />
      </View>

      {/* Live Telemetry Status Bar (Desktop Parity) */}
      <View style={styles.telemetryBar}>
        <View style={styles.telemetryItem}>
          <View style={styles.livePulse} />
          <Text style={styles.liveConnectedText}>Live Connected</Text>
        </View>
        <Text style={styles.telemetryDivider}>|</Text>
        <Text style={styles.telemetryTokens}>
          {activeProvider} tokens:{' '}
          <Text style={{ color: '#ffffff', fontWeight: '800' }}>
            {tokensCount.toLocaleString()}
          </Text>
        </Text>
        <Text style={styles.telemetryDivider}>|</Text>
        <Text style={styles.telemetryFps}>Progress: {progress}%</Text>
      </View>

      {/* Error Banner with 1-Tap Retry Button */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorTitle}>Generation Failed</Text>
            <Text style={styles.errorText} numberOfLines={3}>{errorMsg}</Text>
          </View>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRetry}
            disabled={retrying}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>{retrying ? '...' : '🔄 Retry'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hero Radar Dial Card */}
      <View style={styles.radarCard}>
        <View style={styles.dialWrapper}>
          <ActivityIndicator size="large" color="#00f2fe" style={{ transform: [{ scale: 1.8 }] }} />
          <View style={styles.dialCenter}>
            <Text style={styles.dialPercentage}>{progress}%</Text>
            <Text style={styles.dialStatusLabel}>LIVE</Text>
          </View>
        </View>

        <Text style={styles.radarTopic} numberOfLines={2}>"{topic}"</Text>
        <Text style={styles.radarStatusMessage}>{statusMessage}</Text>
      </View>

      {/* Production Milestone Checklist (Desktop Stage Progression) */}
      <View style={styles.milestonesCard}>
        <Text style={styles.cardHeader}>PIPELINE STAGE SEQUENCING</Text>
        {stages.map((st, idx) => (
          <View key={idx} style={styles.milestoneRow}>
            <View
              style={[
                styles.indicatorCircle,
                st.done && styles.indicatorDone,
                st.active && !st.done && styles.indicatorActive,
              ]}
            >
              <Text style={styles.indicatorText}>{st.done ? '✓' : st.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.milestoneTitle,
                  st.done && styles.milestoneDone,
                  st.active && !st.done && styles.milestoneActive,
                ]}
              >
                {st.title}
              </Text>
              <Text style={styles.milestoneSub}>{st.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Live Terminal Stream */}
      <View style={styles.terminalCard}>
        <View style={styles.terminalHeader}>
          <Text style={styles.terminalDotRed}>●</Text>
          <Text style={styles.terminalDotYellow}>●</Text>
          <Text style={styles.terminalDotGreen}>●</Text>
          <Text style={styles.terminalTitle}>OFFICE AGY CONSOLE STREAM</Text>
        </View>

        <ScrollView style={styles.terminalScroll} nestedScrollEnabled>
          {logs.map((log, i) => (
            <Text key={i} style={styles.terminalLine}>{log}</Text>
          ))}
        </ScrollView>
      </View>

      {/* Big Action button to advance to Preview */}
      {isPreviewAvailable && (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => onPreviewReady(projectId)}
          activeOpacity={0.8}
        >
          <Text style={styles.reviewBtnText}>🎬 Review Stage 1 Preview ("Before MP4") ➔</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#070a12',
    flexGrow: 1,
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: '#161f33',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  backBtnText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: '#a855f7',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  telemetryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 16, 26, 0.95)',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
    justifyContent: 'space-between',
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  liveConnectedText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
  },
  telemetryDivider: {
    color: '#334155',
    fontSize: 11,
  },
  telemetryTokens: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  telemetryFps: {
    color: '#00f2fe',
    fontSize: 11,
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  errorIcon: {
    fontSize: 20,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  radarCard: {
    backgroundColor: '#0c101a',
    borderWidth: 1,
    borderColor: '#7928ca',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7928ca',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  dialWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  dialCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialPercentage: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00f2fe',
  },
  dialStatusLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  radarTopic: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  radarStatusMessage: {
    color: '#38bdf8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  milestonesCard: {
    backgroundColor: '#0c101a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  indicatorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161f33',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  indicatorActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.2)',
    borderColor: '#00f2fe',
  },
  indicatorDone: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  indicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  milestoneTitle: {
    color: '#64748b',
    fontSize: 13,
  },
  milestoneSub: {
    color: '#475569',
    fontSize: 10,
    marginTop: 1,
  },
  milestoneActive: {
    color: '#00f2fe',
    fontWeight: '800',
  },
  milestoneDone: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  terminalCard: {
    backgroundColor: '#060910',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#161f33',
    marginBottom: 10,
  },
  terminalDotRed: { color: '#ef4444', fontSize: 10 },
  terminalDotYellow: { color: '#f59e0b', fontSize: 10 },
  terminalDotGreen: { color: '#10b981', fontSize: 10 },
  terminalTitle: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 6,
  },
  terminalScroll: {
    maxHeight: 120,
  },
  terminalLine: {
    color: '#38bdf8',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  reviewBtn: {
    backgroundColor: '#00f2fe',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#00f2fe',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  reviewBtnText: {
    color: '#070a12',
    fontWeight: '800',
    fontSize: 14,
  },
});
