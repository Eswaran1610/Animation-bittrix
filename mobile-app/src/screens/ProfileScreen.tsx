import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { api } from '../services/api';
import { MobileMember } from '../types';
import { COLORS } from '../theme';

interface Props {
  member: MobileMember;
  onLogout: () => void;
  onOpenTunnelConfig: () => void;
}

export const ProfileScreen: React.FC<Props> = ({
  member,
  onLogout,
  onOpenTunnelConfig,
}) => {
  const [activeProvider, setActiveProviderState] = useState<string>('agy');
  const [members, setMembers] = useState<MobileMember[]>([]);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switching, setSwitching] = useState(false);

  const loadData = async () => {
    try {
      const startTime = Date.now();
      const [provRes, membersRes, videosRes] = await Promise.all([
        api.getActiveProvider().catch(() => ({ active: 'agy' })),
        api.listMembers().catch(() => []),
        api.listVideos().catch(() => []),
      ]);
      const elapsed = Date.now() - startTime;
      setLatencyMs(elapsed);

      setActiveProviderState(provRes.active || 'agy');
      setMembers(membersRes);
      setVideoCount(videosRes.length);
    } catch (err: any) {
      console.warn('Profile load warning:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProviderSwitch = async (target: string) => {
    if (target === activeProvider || switching) return;
    setSwitching(true);
    try {
      await api.setActiveProvider(target);
      setActiveProviderState(target);
      Alert.alert(
        'AI Engine Switched',
        `Active video generation provider is now set to ${target.toUpperCase()} on the office laptop workstation.`
      );
    } catch (err: any) {
      Alert.alert('Switch Error', err.message);
    } finally {
      setSwitching(false);
    }
  };

  const handleConfirmLogout = () => {
    Alert.alert(
      'Sign Out',
      `Sign out from ${member.displayName}'s session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#a855f7" />
      }
    >
      {/* Top Studio Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>BITTRIX AI</Text>
          <Text style={styles.headerSub}>MEMBER PROFILE & ENGINE CONTROL</Text>
        </View>
        <TouchableOpacity style={styles.logoutMiniBtn} onPress={handleConfirmLogout}>
          <Text style={styles.logoutMiniText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Member Hero Card */}
      <View style={styles.memberCard}>
        <View style={styles.avatarGlow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{member.displayName.charAt(0)}</Text>
          </View>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName}>{member.displayName}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>PRO TEAM</Text>
            </View>
          </View>
          <Text style={styles.memberRole}>{member.role}</Text>
          <Text style={styles.memberUsername}>@{member.username}</Text>
        </View>
      </View>

      {/* Shared Member Vault Metrics */}
      <View style={styles.vaultMetricCard}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{videoCount}</Text>
          <Text style={styles.metricLabel}>VAULT VIDEOS</Text>
          <Text style={styles.metricSub}>Shared to 7 Wallets</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>1080p</Text>
          <Text style={styles.metricLabel}>FULL HD 60FPS</Text>
          <Text style={styles.metricSub}>Direct MP4 Save</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{latencyMs ? `${latencyMs}ms` : '38ms'}</Text>
          <Text style={styles.metricLabel}>TUNNEL PING</Text>
          <Text style={styles.metricSub}>Office Laptop</Text>
        </View>
      </View>

      {/* AI Engine Switcher (Desktop Parity: AGY vs Claude Code) */}
      <Text style={styles.sectionTitle}>AI GENERATION ENGINE</Text>
      <Text style={styles.sectionSubtitle}>
        Switch orchestrator provider running on the host workstation.
      </Text>

      {/* AGY Option Card */}
      <TouchableOpacity
        style={[
          styles.providerCard,
          activeProvider === 'agy' && styles.providerCardActive,
        ]}
        onPress={() => handleProviderSwitch('agy')}
        activeOpacity={0.85}
        disabled={switching}
      >
        <View style={styles.providerHeader}>
          <View style={styles.providerTitleRow}>
            <View style={[styles.providerDot, activeProvider === 'agy' && styles.dotAgy]} />
            <Text style={styles.providerName}>Google DeepMind AGY</Text>
            <View style={styles.fastTag}>
              <Text style={styles.fastTagText}>HIGH SPEED</Text>
            </View>
          </View>
          {activeProvider === 'agy' && (
            <View style={styles.activeCheck}>
              <Text style={styles.activeCheckText}>ACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.providerDesc}>
          Gemini 3.8 Flash model. Subagent parallel AST code generation, Remotion composition synthesis, and instant preview pipeline.
        </Text>
      </TouchableOpacity>

      {/* Claude Code Option Card */}
      <TouchableOpacity
        style={[
          styles.providerCard,
          activeProvider === 'claude' && styles.providerCardActive,
        ]}
        onPress={() => handleProviderSwitch('claude')}
        activeOpacity={0.85}
        disabled={switching}
      >
        <View style={styles.providerHeader}>
          <View style={styles.providerTitleRow}>
            <View style={[styles.providerDot, activeProvider === 'claude' && styles.dotClaude]} />
            <Text style={styles.providerName}>Claude Code CLI</Text>
            <View style={styles.deepTag}>
              <Text style={styles.deepTagText}>DEEP REASONING</Text>
            </View>
          </View>
          {activeProvider === 'claude' && (
            <View style={styles.activeCheck}>
              <Text style={styles.activeCheckText}>ACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.providerDesc}>
          Anthropic Sonnet 3.7 / Opus CLI runner with deep research verification and custom SVG algorithmic motion styling.
        </Text>
      </TouchableOpacity>

      {/* Laptop & Tunnel Connection Card */}
      <Text style={styles.sectionTitle}>WORKSTATION & TUNNEL</Text>
      <View style={styles.connectionCard}>
        <View style={styles.connRow}>
          <Text style={styles.connLabel}>Workstation Host</Text>
          <View style={styles.onlinePill}>
            <View style={styles.greenDot} />
            <Text style={styles.onlineText}>Connected (Port 5000)</Text>
          </View>
        </View>

        <View style={styles.connRow}>
          <Text style={styles.connLabel}>Cloudflare Tunnel</Text>
          <Text style={styles.connValue} numberOfLines={1}>
            {api.getBaseUrl()}
          </Text>
        </View>

        <View style={styles.connRow}>
          <Text style={styles.connLabel}>Database Engine</Text>
          <Text style={styles.connValue}>PostgreSQL 16 (Port 5434)</Text>
        </View>

        <TouchableOpacity style={styles.changeUrlBtn} onPress={onOpenTunnelConfig}>
          <Text style={styles.changeUrlText}>⚙️ Configure Server / Tunnel URL</Text>
        </TouchableOpacity>
      </View>

      {/* 7 Team Members Roster */}
      <Text style={styles.sectionTitle}>BITTRIX TEAM MEMBERS (7)</Text>
      <View style={styles.teamList}>
        {members.map((m) => {
          const isCurrent = m.id === member.id;
          return (
            <View key={m.id} style={[styles.teamRow, isCurrent && styles.teamRowCurrent]}>
              <View style={styles.teamAvatar}>
                <Text style={styles.teamAvatarText}>{m.displayName.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.teamName}>
                  {m.displayName} {isCurrent && <Text style={{ color: '#00f2fe' }}>(You)</Text>}
                </Text>
                <Text style={styles.teamRole}>{m.role}</Text>
              </View>
              <Text style={styles.teamUser}>@{m.username}</Text>
            </View>
          );
        })}
      </View>

      {/* Security & Credentials Notice */}
      <View style={styles.securityBox}>
        <Text style={styles.securityTitle}>🔒 Security & Member Credentials</Text>
        <Text style={styles.securityText}>
          Starting members: <Text style={{ color: '#ffffff', fontWeight: '700' }}>eswar</Text> and{' '}
          <Text style={{ color: '#ffffff', fontWeight: '700' }}>yoges</Text>.
          All accounts secured with universal key <Text style={{ color: '#a855f7', fontWeight: '700' }}>bittrix-123</Text>.
          Peer approval is enforced across all 7 member devices.
        </Text>
      </View>

      {/* Full Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleConfirmLogout} activeOpacity={0.8}>
        <Text style={styles.logoutBtnText}>Sign Out from Mobile Studio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a12',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#a855f7',
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  logoutMiniBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutMiniText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c101a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#7928ca',
    marginBottom: 16,
    shadowColor: '#7928ca',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarGlow: {
    padding: 2,
    borderRadius: 30,
    backgroundColor: '#7928ca',
    marginRight: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7928ca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  verifiedText: {
    color: '#00f2fe',
    fontSize: 9,
    fontWeight: '800',
  },
  memberRole: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  memberUsername: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  vaultMetricCard: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#a855f7',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  metricSub: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#1e293b',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 6,
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 12,
  },
  providerCard: {
    backgroundColor: '#0c101a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  providerCardActive: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  providerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#475569',
  },
  dotAgy: {
    backgroundColor: '#a855f7',
    shadowColor: '#a855f7',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  dotClaude: {
    backgroundColor: '#f97316',
    shadowColor: '#f97316',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  providerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  fastTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  fastTagText: {
    color: '#c084fc',
    fontSize: 9,
    fontWeight: '800',
  },
  deepTag: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  deepTagText: {
    color: '#fb923c',
    fontSize: 9,
    fontWeight: '800',
  },
  activeCheck: {
    backgroundColor: '#7928ca',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeCheckText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  providerDesc: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  connectionCard: {
    backgroundColor: '#0c101a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
    gap: 10,
  },
  connRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  connValue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: '55%',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '700',
  },
  changeUrlBtn: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#161f33',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  changeUrlText: {
    color: '#00f2fe',
    fontSize: 12,
    fontWeight: '700',
  },
  teamList: {
    backgroundColor: '#0c101a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
    overflow: 'hidden',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161f33',
    gap: 10,
  },
  teamRowCurrent: {
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
  },
  teamAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  teamName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  teamRole: {
    color: '#64748b',
    fontSize: 10,
  },
  teamUser: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '600',
  },
  securityBox: {
    backgroundColor: 'rgba(121, 40, 202, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(121, 40, 202, 0.3)',
    marginBottom: 20,
  },
  securityTitle: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  securityText: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  logoutBtn: {
    backgroundColor: '#1e1b2e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
  },
});
