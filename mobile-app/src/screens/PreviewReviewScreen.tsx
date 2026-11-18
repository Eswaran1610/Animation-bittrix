import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { api } from '../services/api';
import { PreviewDetails, MobileMember } from '../types';
import { COLORS, SHADOWS } from '../theme';

interface Props {
  projectId: string;
  member: MobileMember;
  onBack: () => void;
  onFinalRenderComplete: () => void;
}

export const PreviewReviewScreen: React.FC<Props> = ({
  projectId,
  member,
  onBack,
  onFinalRenderComplete,
}) => {
  const [preview, setPreview] = useState<PreviewDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [revisionModalVisible, setRevisionModalVisible] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [revising, setRevising] = useState(false);
  const [activeSceneTab, setActiveSceneTab] = useState(0);
  const videoRef = useRef<Video>(null);

  const fetchPreview = async () => {
    try {
      const data = await api.getPreview(projectId);
      setPreview(data);
    } catch (err: any) {
      console.warn('Failed to fetch preview details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [projectId]);

  const handleApprove = async () => {
    Alert.alert(
      'Approve Stage 1 Preview?',
      'This locks the scene visuals and audio, and triggers the Stage 2 Final 1080p Master Render on the office laptop.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Render Final',
          style: 'default',
          onPress: async () => {
            setApproving(true);
            try {
              await api.approvePreview(projectId, `Approved by ${member.displayName}`);
              Alert.alert(
                'Final Render Started',
                'Stage 2 Final 1080p render is now running on the office laptop. Master MP4 will be delivered to the vault.'
              );
              onFinalRenderComplete();
            } catch (err: any) {
              Alert.alert('Approval Error', err.message);
            } finally {
              setApproving(false);
            }
          },
        },
      ]
    );
  };

  const handleRevisionSubmit = async () => {
    if (!feedbackNotes.trim()) {
      Alert.alert('Required', 'Please enter your revision feedback notes.');
      return;
    }
    setRevising(true);
    try {
      await api.revisePreview(projectId, feedbackNotes.trim());
      setRevisionModalVisible(false);
      setFeedbackNotes('');
      Alert.alert('Revision Submitted', 'The AGY agent on the office laptop is updating the visuals and generating a new preview.');
      fetchPreview();
    } catch (err: any) {
      Alert.alert('Revision Error', err.message);
    } finally {
      setRevising(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#00f2fe" />
        <Text style={styles.loadingText}>Loading Stage 1 Preview from Office Laptop...</Text>
      </View>
    );
  }

  const mediaUrl = api.getMediaUrl(preview?.previewUrl);
  const scenes = preview?.scenes || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>◀ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>STAGE 1 REVIEW</Text>
          </View>
          <Text style={styles.title}>Before MP4 Player</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPreview}>
          <Text style={styles.refreshBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* 9:16 Vertical Video Player Container */}
      <View style={styles.videoCard}>
        {/* HUD Overlay Top */}
        <View style={styles.videoHudTop}>
          <View style={styles.hudBadge}>
            <View style={styles.hudDotLive} />
            <Text style={styles.hudBadgeText}>PREVIEW 540×960</Text>
          </View>
          <View style={styles.hudBadgeRight}>
            <Text style={styles.hudBadgeRightText}>BITTRIX OUTRO +3S ✓</Text>
          </View>
        </View>

        {mediaUrl ? (
          <Video
            ref={videoRef}
            style={styles.videoPlayer}
            source={{ uri: mediaUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
        ) : (
          <View style={styles.renderingContainer}>
            <ActivityIndicator color="#00f2fe" size="large" />
            <Text style={styles.renderingTitle}>Preview MP4 Rendering...</Text>
            <Text style={styles.renderingSub}>
              Office laptop AGY agent is synthesizing the 60 FPS Remotion composition.
            </Text>
          </View>
        )}

        {/* Live Audio / Kinetic Caption Pill */}
        <View style={styles.captionOverlay}>
          <Text style={styles.captionLabel}>NARRATION STREAM</Text>
          <Text style={styles.captionText} numberOfLines={2}>
            {preview?.narration || 'Follow Bittrix Technologies for more interesting concepts.'}
          </Text>
        </View>
      </View>

      {/* Scene Breakdown Chapter Pills */}
      {scenes.length > 0 && (
        <View style={styles.chaptersCard}>
          <Text style={styles.sectionHeader}>SCENE TIMELINE & OBJECT CHOREOGRAPHY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chaptersScroll}>
            {scenes.map((s, idx) => {
              const isSelected = activeSceneTab === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.chapterPill, isSelected && styles.chapterPillActive]}
                  onPress={() => setActiveSceneTab(idx)}
                >
                  <Text style={[styles.chapterNum, isSelected && styles.chapterNumActive]}>
                    Scene {s.scene_number || idx + 1}
                  </Text>
                  <Text style={styles.chapterDuration}>{s.duration_sec || 5}s</Text>
                </TouchableOpacity>
              );
            })}
            <View style={styles.chapterOutroPill}>
              <Text style={styles.chapterOutroText}>Outro (3.0s SFX)</Text>
            </View>
          </ScrollView>

          {scenes[activeSceneTab] && (
            <View style={styles.sceneDetailBox}>
              <Text style={styles.sceneVisualDirection}>
                👁️ Visual: <Text style={{ color: '#ffffff' }}>{scenes[activeSceneTab].visual_direction || 'Procedural vector animations'}</Text>
              </Text>
              <Text style={styles.sceneSpeech}>
                🎙️ Voice: <Text style={{ color: '#94a3b8' }}>"{scenes[activeSceneTab].narration || ''}"</Text>
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Technical Quality Telemetry */}
      <View style={styles.telemetryCard}>
        <View style={styles.telemetryRow}>
          <View style={styles.telemetryCol}>
            <Text style={styles.telemetryLabel}>RESOLUTION</Text>
            <Text style={styles.telemetryVal}>540×960 Preview</Text>
          </View>
          <View style={styles.telemetryCol}>
            <Text style={styles.telemetryLabel}>FPS ENGINE</Text>
            <Text style={styles.telemetryVal}>60 FPS Remotion</Text>
          </View>
          <View style={styles.telemetryCol}>
            <Text style={styles.telemetryLabel}>OUTRO SFX</Text>
            <Text style={[styles.telemetryVal, { color: '#10b981' }]}>Chain-Roll ✓</Text>
          </View>
        </View>
      </View>

      {/* Floating Action Dock */}
      <View style={styles.dock}>
        <TouchableOpacity
          style={[styles.approveBtn, approving && { opacity: 0.6 }]}
          onPress={handleApprove}
          disabled={approving}
          activeOpacity={0.8}
        >
          {approving ? (
            <ActivityIndicator color="#070a12" />
          ) : (
            <Text style={styles.approveBtnText}>✓ Approve & Render Final 1080p</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reviseBtn}
          onPress={() => setRevisionModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.reviseBtnText}>✎ Request Visual Revision</Text>
        </TouchableOpacity>
      </View>

      {/* Revision Modal */}
      <Modal visible={revisionModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Visual Revision</Text>
            <Text style={styles.modalSubtitle}>
              Provide feedback for the AGY agent. Audio narration will be preserved.
            </Text>

            <TextInput
              style={styles.revisionInput}
              multiline
              value={feedbackNotes}
              onChangeText={setFeedbackNotes}
              placeholder="e.g. Make node glow brighter in Scene 2, slow down camera zoom on the B-Tree root"
              placeholderTextColor="#64748b"
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setRevisionModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, revising && { opacity: 0.6 }]}
                onPress={handleRevisionSubmit}
                disabled={revising}
              >
                <Text style={styles.modalSubmitText}>
                  {revising ? 'Submitting...' : 'Send to Agent ➔'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flexGrow: 1,
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  headerBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 2,
  },
  headerBadgeText: {
    color: '#00f2fe',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  refreshBtn: {
    backgroundColor: '#161f33',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  refreshBtnText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '800',
  },
  videoCard: {
    width: '100%',
    height: 420,
    backgroundColor: '#000000',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#00f2fe',
    marginBottom: 14,
    position: 'relative',
    ...SHADOWS.glowCyan,
  },
  videoHudTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: '#00f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  hudDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00f2fe',
  },
  hudBadgeText: {
    color: '#00f2fe',
    fontSize: 10,
    fontWeight: '800',
  },
  hudBadgeRight: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hudBadgeRightText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  renderingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  renderingTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  renderingSub: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 10,
    zIndex: 10,
  },
  captionLabel: {
    color: '#00f2fe',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  captionText: {
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  chaptersCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  sectionHeader: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  chaptersScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chapterPill: {
    backgroundColor: '#161f33',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  chapterPillActive: {
    borderColor: '#00f2fe',
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  chapterNum: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  chapterNumActive: {
    color: '#00f2fe',
    fontWeight: '800',
  },
  chapterDuration: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 1,
  },
  chapterOutroPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  chapterOutroText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  sceneDetailBox: {
    backgroundColor: '#0c101a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 4,
  },
  sceneVisualDirection: {
    color: '#38bdf8',
    fontSize: 11,
    lineHeight: 16,
  },
  sceneSpeech: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  telemetryCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  telemetryCol: {
    alignItems: 'center',
  },
  telemetryLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  telemetryVal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  dock: {
    gap: 10,
  },
  approveBtn: {
    backgroundColor: '#00f2fe',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.glowCyan,
  },
  approveBtnText: {
    color: '#070a12',
    fontWeight: '800',
    fontSize: 15,
  },
  reviseBtn: {
    backgroundColor: '#161f33',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviseBtnText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#0f1523',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 14,
  },
  revisionInput: {
    backgroundColor: '#070a12',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    color: '#ffffff',
    padding: 12,
    fontSize: 13,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalSubmit: {
    backgroundColor: '#a855f7',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
