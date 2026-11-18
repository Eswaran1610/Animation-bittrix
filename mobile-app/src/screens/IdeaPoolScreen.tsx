import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { api } from '../services/api';
import { IdeaPitch, MobileMember } from '../types';
import { COLORS, SHADOWS } from '../theme';

interface Props {
  member: MobileMember;
  onOpenRadar: (projectId: string, topic: string) => void;
  onOpenPreview: (projectId: string) => void;
  onOpenLibrary: () => void;
  onLogout: () => void;
}

const PRESET_TOPICS = [
  'Why B-Trees Power PostgreSQL & SQLite Indexes',
  'Zero Trust Architecture vs Legacy Corporate VPNs',
  'How Redis In-Memory Key-Value Caching Works',
  'Kafka Distributed Event Streaming & Partitioning',
];

export const IdeaPoolScreen: React.FC<Props> = ({
  member,
  onOpenRadar,
  onOpenPreview,
  onOpenLibrary,
  onLogout,
}) => {
  const [ideas, setIdeas] = useState<IdeaPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pitchModalVisible, setPitchModalVisible] = useState(false);

  // Form states
  const [topic, setTopic] = useState('');
  const [durationSec, setDurationSec] = useState('30');
  const [themeId, setThemeId] = useState('tech-minimal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live telemetry (Desktop parity)
  const [tokenCount, setTokenCount] = useState<number>(313474);
  const [activeProviderName, setActiveProviderName] = useState<string>('AGY');

  const fetchIdeas = async () => {
    try {
      const data = await api.listIdeas();
      setIdeas(data);
      try {
        const usage = await api.getTokenUsage();
        if (usage?.total_tokens) setTokenCount(Number(usage.total_tokens));
        const prov = await api.getActiveProvider();
        if (prov?.activeProvider) setActiveProviderName(prov.activeProvider.toUpperCase());
      } catch {}
    } catch (err: any) {
      console.warn('Failed to fetch ideas:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
    const unsubscribeWs = api.connectWs((event) => {
      if (
        event.type === 'idea_pitched' ||
        event.type === 'idea_accepted' ||
        event.type === 'idea_generating' ||
        event.type === 'project_created' ||
        event.type === 'preview_approved_mobile'
      ) {
        fetchIdeas();
      }
    });
    return unsubscribeWs;
  }, []);

  const handlePitchSubmit = async () => {
    if (!topic.trim()) {
      Alert.alert('Required', 'Please enter a video topic.');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitIdea({
        topic: topic.trim(),
        durationSec: Number(durationSec) || 30,
        themeId,
        notes: notes.trim() || undefined,
      });
      setPitchModalVisible(false);
      setTopic('');
      setNotes('');
      fetchIdeas();
      Alert.alert(
        'Pitch Stored in Pool',
        'Your topic is now stored in the Idea Pool. Another team member must peer-approve it before video generation can start.'
      );
    } catch (err: any) {
      Alert.alert('Pitch Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptIdea = async (idea: IdeaPitch) => {
    if (idea.pitcherId === member.id) {
      Alert.alert(
        'Peer Review Rule',
        'You cannot accept your own pitch. A peer member must review and approve it to maintain video quality.'
      );
      return;
    }
    try {
      await api.acceptIdea(idea.id);
      fetchIdeas();
      Alert.alert('Topic Accepted', `You approved "${idea.topic}". The team can now generate the video!`);
    } catch (err: any) {
      Alert.alert('Accept Error', err.message);
    }
  };

  const handleGenerateVideo = async (idea: IdeaPitch) => {
    try {
      const res = await api.generateVideo(idea.id);
      fetchIdeas();
      onOpenRadar(res.projectId, idea.topic);
    } catch (err: any) {
      Alert.alert('Generation Error', err.message);
    }
  };

  const renderIdeaCard = ({ item }: { item: IdeaPitch }) => {
    const isOwner = item.pitcherId === member.id;
    const canAccept = item.status === 'pending' && !isOwner;
    const canGenerate = item.status === 'accepted' && isOwner;
    const isAcceptedWaitingAuthor = item.status === 'accepted' && !isOwner;
    const isGenerating = item.status === 'generating';
    const isPreviewReady = item.status === 'preview_ready';
    const isCompleted = item.status === 'completed';

    return (
      <View style={styles.card}>
        {/* Card Header: Pitcher & Stage Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.pitcherRow}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>{item.pitcherName.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.pitcherName}>{item.pitcherName}</Text>
              <Text style={styles.pitcherRole}>{isOwner ? 'Your Pitch' : 'Team Pitch'}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusPill,
              item.status === 'pending' && styles.statusPending,
              item.status === 'accepted' && styles.statusAccepted,
              item.status === 'generating' && styles.statusGenerating,
              item.status === 'preview_ready' && styles.statusPreviewReady,
              item.status === 'completed' && styles.statusCompleted,
            ]}
          >
            <Text style={styles.statusPillText}>{item.status.toUpperCase().replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Video Topic Title */}
        <Text style={styles.cardTitle}>{item.topic}</Text>

        {/* Technical Specs HUD */}
        <View style={styles.specsRow}>
          <View style={styles.specChip}>
            <Text style={styles.specChipText}>⏱️ {item.durationSec}s (+3s outro = {item.durationSec + 3}s)</Text>
          </View>
          <View style={styles.specChip}>
            <Text style={styles.specChipText}>🎨 {item.themeId}</Text>
          </View>
          <View style={styles.specChip}>
            <Text style={styles.specChipText}>⚡ 60 FPS Remotion</Text>
          </View>
        </View>

        {/* Peer Review Status Box */}
        <View style={styles.peerBox}>
          {item.status === 'pending' && (
            <View style={styles.peerBoxPending}>
              <Text style={styles.peerIcon}>⏳</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.peerTitlePending}>Peer Approval Required</Text>
                <Text style={styles.peerSubPending}>
                  {isOwner
                    ? 'Waiting for a peer member to accept before generation unlocks.'
                    : 'Review this topic. Tap Accept below to approve for production.'}
                </Text>
              </View>
            </View>
          )}

          {item.acceptedByName && (
            <View style={styles.peerBoxAccepted}>
              <Text style={styles.peerIcon}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.peerTitleAccepted}>Peer Verified</Text>
                <Text style={styles.peerSubAccepted}>
                  Approved by <Text style={{ color: '#10b981', fontWeight: '800' }}>{item.acceptedByName}</Text>
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Dynamic Action Buttons */}
        <View style={styles.cardActions}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, canAccept ? styles.btnAccept : styles.btnDisabled]}
              onPress={() => handleAcceptIdea(item)}
              disabled={!canAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionText}>
                {canAccept ? '✓ Peer Accept Topic' : '⏳ Awaiting Peer Approval'}
              </Text>
            </TouchableOpacity>
          )}

          {canGenerate && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.btnGenerate]}
              onPress={() => handleGenerateVideo(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionText}>🚀 Launch Video Generation (You Pitched)</Text>
            </TouchableOpacity>
          )}

          {isAcceptedWaitingAuthor && (
            <View style={[styles.primaryActionBtn, styles.btnWaitingAuthor]}>
              <Text style={styles.waitingAuthorText}>
                ✓ Approved by {item.acceptedByName || 'Peer'} — Waiting for {item.pitcherName} (Author) to Generate
              </Text>
            </View>
          )}

          {isGenerating && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.btnRadar]}
              onPress={() => onOpenRadar(item.projectId || '', item.topic)}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionText}>⚡ Track Live Pipeline Radar (0-100%)</Text>
            </TouchableOpacity>
          )}

          {isPreviewReady && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.btnPreview]}
              onPress={() => onOpenPreview(item.projectId || '')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionText}>🎬 Review Stage 1 Preview ("Before MP4") ➔</Text>
            </TouchableOpacity>
          )}

          {isCompleted && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.btnCompleted]}
              onPress={onOpenLibrary}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionText}>🏆 Watch Final 1080p MP4 in Vault</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Studio Header Bar */}
      <View style={styles.topHeader}>
        <View>
          <View style={styles.badgeRow}>
            <Text style={styles.brandTitle}>BITTRIX AI</Text>
            <View style={styles.brandTag}>
              <Text style={styles.brandTagText}>IDEA POOL</Text>
            </View>
          </View>
          <Text style={styles.memberStatus}>Logged in as: <Text style={{ color: '#00f2fe', fontWeight: '700' }}>{member.displayName}</Text></Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Live Connected & Telemetry Bar (Desktop Parity) */}
      <View style={styles.telemetryBar}>
        <View style={styles.liveTag}>
          <View style={styles.greenPulse} />
          <Text style={styles.liveTagText}>Live Connected</Text>
        </View>
        <Text style={styles.telemetryDivider}>|</Text>
        <Text style={styles.tokenText}>
          {activeProviderName} tokens:{' '}
          <Text style={{ color: '#ffffff', fontWeight: '800' }}>
            {tokenCount.toLocaleString()}
          </Text>
        </Text>
        <Text style={styles.telemetryDivider}>|</Text>
        <Text style={styles.fpsText}>60 FPS Remotion</Text>
      </View>

      {/* Floating Pitch Hero Card */}
      <TouchableOpacity
        style={styles.pitchHero}
        onPress={() => setPitchModalVisible(true)}
        activeOpacity={0.85}
      >
        <View style={styles.pitchHeroIcon}>
          <Text style={{ fontSize: 24 }}>💡</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pitchHeroTitle}>+ Pitch New Video Topic</Text>
          <Text style={styles.pitchHeroSubtitle}>Propose content for peer review & autonomous generation</Text>
        </View>
        <Text style={styles.pitchHeroArrow}>➔</Text>
      </TouchableOpacity>

      {/* Ideas Feed */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#00f2fe" size="large" />
          <Text style={styles.loadingText}>Syncing Idea Pool with Postgres...</Text>
        </View>
      ) : (
        <FlatList
          data={ideas}
          keyExtractor={(item) => item.id}
          renderItem={renderIdeaCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchIdeas(); }}
              tintColor="#00f2fe"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>💡</Text>
              <Text style={styles.emptyTitle}>The Idea Pool is Empty</Text>
              <Text style={styles.emptySubtitle}>
                Tap the "+ Pitch New Video Topic" banner above to propose content.
              </Text>
            </View>
          }
        />
      )}

      {/* Pitch Modal */}
      <Modal visible={pitchModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalGrabber} />
            <Text style={styles.modalTitle}>Pitch Content to Pool</Text>
            <Text style={styles.modalSubtitle}>Requires 1 peer member approval before generation begins</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>VIDEO TOPIC OR PROMPT</Text>
              <TextInput
                style={styles.topicInput}
                multiline
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Why B-Trees Power PostgreSQL & SQLite Indexes"
                placeholderTextColor="#64748b"
              />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>QUICK TOPIC SUGGESTIONS</Text>
              <View style={styles.suggestionsRow}>
                {PRESET_TOPICS.map((pt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionPill}
                    onPress={() => setTopic(pt)}
                  >
                    <Text style={styles.suggestionText} numberOfLines={1}>{pt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>DURATION (CONTENT + 3S BITTRIX OUTRO)</Text>
              <View style={styles.durationGrid}>
                {['15', '20', '30', '45', '60'].map((sec) => {
                  const isSel = durationSec === sec;
                  return (
                    <TouchableOpacity
                      key={sec}
                      style={[styles.durationCard, isSel && styles.durationCardActive]}
                      onPress={() => setDurationSec(sec)}
                    >
                      <Text style={[styles.durationVal, isSel && styles.durationValActive]}>{sec}s</Text>
                      <Text style={styles.durationFormula}>+{3}s = {Number(sec) + 3}s</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>VISUAL DESIGN THEME</Text>
              <View style={styles.themeGrid}>
                {[
                  { id: 'tech-minimal', name: 'Tech Minimal', color: '#00f2fe' },
                  { id: 'cyber-grid', name: 'Cyber Grid', color: '#a855f7' },
                  { id: 'blueprint-cyan', name: 'Blueprint Cyan', color: '#3b82f6' },
                  { id: 'matrix-code', name: 'Matrix Code', color: '#10b981' },
                ].map((th) => {
                  const isSel = themeId === th.id;
                  return (
                    <TouchableOpacity
                      key={th.id}
                      style={[styles.themeCard, isSel && { borderColor: th.color, backgroundColor: th.color + '15' }]}
                      onPress={() => setThemeId(th.id)}
                    >
                      <View style={[styles.themeDot, { backgroundColor: th.color }]} />
                      <Text style={[styles.themeName, isSel && { color: th.color, fontWeight: '800' }]}>
                        {th.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setPitchModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmit, submitting && { opacity: 0.6 }]}
                  onPress={handlePitchSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.modalSubmitText}>
                    {submitting ? 'Storing...' : 'Store in Pool ➔'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 45,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTag: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandTagText: {
    color: '#00f2fe',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  memberStatus: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  telemetryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c101a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    gap: 8,
    justifyContent: 'space-between',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenPulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  liveTagText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '800',
  },
  telemetryDivider: {
    color: '#334155',
    fontSize: 11,
  },
  tokenText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  fpsText: {
    color: '#a855f7',
    fontSize: 10,
    fontWeight: '700',
  },
  pitchHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#00f2fe',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 14,
    padding: 14,
    gap: 12,
    ...SHADOWS.glowCyan,
  },
  pitchHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchHeroTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  pitchHeroSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  pitchHeroArrow: {
    color: '#00f2fe',
    fontSize: 18,
    fontWeight: '800',
  },
  centerBox: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 242, 254, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00f2fe',
  },
  avatarMiniText: {
    color: '#00f2fe',
    fontSize: 12,
    fontWeight: '800',
  },
  pitcherName: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  pitcherRole: {
    color: '#64748b',
    fontSize: 10,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPending: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  statusAccepted: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  statusGenerating: { backgroundColor: 'rgba(168, 85, 247, 0.2)' },
  statusPreviewReady: { backgroundColor: 'rgba(0, 242, 254, 0.2)' },
  statusCompleted: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  statusPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 10,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  specChip: {
    backgroundColor: '#161f33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  specChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  peerBox: {
    marginBottom: 14,
  },
  peerBoxPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  peerBoxAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  peerIcon: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: '800',
  },
  peerTitlePending: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
  },
  peerSubPending: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  peerTitleAccepted: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
  },
  peerSubAccepted: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  cardActions: {
    marginTop: 2,
  },
  primaryActionBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  btnAccept: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  btnGenerate: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
  },
  btnRadar: {
    backgroundColor: '#a855f7',
    shadowColor: '#a855f7',
  },
  btnPreview: {
    backgroundColor: '#00f2fe',
    shadowColor: '#00f2fe',
  },
  btnCompleted: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
  },
  btnDisabled: {
    backgroundColor: '#1e293b',
  },
  btnWaitingAuthor: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: '#7928ca',
    paddingHorizontal: 8,
  },
  waitingAuthorText: {
    color: '#c084fc',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  primaryActionText: {
    color: '#070a12',
    fontWeight: '800',
    fontSize: 13,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0f1523',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    maxHeight: '85%',
  },
  modalGrabber: {
    width: 40,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 8,
  },
  topicInput: {
    backgroundColor: '#070a12',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    color: '#ffffff',
    padding: 14,
    fontSize: 14,
    minHeight: 70,
  },
  suggestionsRow: {
    gap: 6,
  },
  suggestionPill: {
    backgroundColor: '#161f33',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  suggestionText: {
    color: '#38bdf8',
    fontSize: 11,
  },
  durationGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  durationCard: {
    flex: 1,
    backgroundColor: '#161f33',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  durationCardActive: {
    borderColor: '#00f2fe',
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  durationVal: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 14,
  },
  durationValActive: {
    color: '#00f2fe',
    fontWeight: '800',
  },
  durationFormula: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161f33',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  themeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeName: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalSubmit: {
    backgroundColor: '#00f2fe',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  modalSubmitText: {
    color: '#070a12',
    fontWeight: '800',
    fontSize: 14,
  },
});
