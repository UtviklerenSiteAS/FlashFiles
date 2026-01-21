import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Image, ScrollView, Dimensions, Modal, Animated, PanResponder, Switch, TextInput, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.3:3000';
const { width } = Dimensions.get('window');

type UploadItem = {
  id: string;
  name: string;
  size: number;
  progress: number; // 0 to 1
  status: 'uploading' | 'completed' | 'error';
  type: 'image' | 'file';
};

export default function HomeScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [daysLeft, setDaysLeft] = useState(14);
  const [pendingFile, setPendingFile] = useState<any>(null);
  const pendingFileRef = useRef(pendingFile);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayTitle, setOverlayTitle] = useState('');
  const [overlayDesc, setOverlayDesc] = useState('');
  const overlayRef = useRef({ showOverlay, overlayTitle, overlayDesc });
  const pan = useState(new Animated.ValueXY())[0];
  const hintAnim = useState(new Animated.Value(0))[0];

  const panResponder = useState(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        const currentFile = pendingFileRef.current;
        if (gesture.dy < -150 || gesture.vy < -0.5) {
          // Flicked up!
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const { showOverlay, overlayTitle, overlayDesc } = overlayRef.current;

          Animated.timing(pan, {
            toValue: { x: 0, y: -1000 },
            duration: 400,
            useNativeDriver: false,
          }).start(() => {
            if (currentFile) {
              performUpload(
                currentFile.uri,
                currentFile.name,
                currentFile.mimeType,
                currentFile.size,
                showOverlay ? overlayTitle : undefined,
                showOverlay ? overlayDesc : undefined
              );
            }
            setPendingFile(null);
            pan.setValue({ x: 0, y: 0 });
          });
        } else if (gesture.dy > 100) {
          // Swipe down to close
          setPendingFile(null);
          pan.setValue({ x: 0, y: 0 });
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  )[0];

  useEffect(() => {
    pendingFileRef.current = pendingFile;
    if (pendingFile) {
      // Reset position
      pan.setValue({ x: 0, y: 0 });
      // Bounce hint animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(hintAnim, {
            toValue: -20,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(hintAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          })
        ]),
        { iterations: 2 }
      ).start();
    }
  }, [pendingFile]);

  useEffect(() => {
    overlayRef.current = { showOverlay, overlayTitle, overlayDesc };
  }, [showOverlay, overlayTitle, overlayDesc]);

  useEffect(() => {
    const checkTrial = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.created_at) {
        const createdDate = new Date(user.created_at);
        const now = new Date();
        const trialEnd = new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        const diffTime = trialEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setDaysLeft(Math.max(0, diffDays));
        setPaywallVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    };
    checkTrial();
  }, []);

  const performUpload = async (uri: string, name: string, mimeType: string, size: number, title?: string, desc?: string) => {
    const uploadId = Math.random().toString(36).substring(7);
    const isImage = mimeType?.startsWith('image/') || false;

    // Add to uploads list
    const newItem: UploadItem = {
      id: uploadId,
      name: name,
      size: size || 0,
      progress: 0,
      status: 'uploading',
      type: isImage ? 'image' : 'file',
    };

    setUploads(prev => [newItem, ...prev]);

    try {
      // 1. Get user session for token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      console.log(`[Upload] Bruker ID: ${session.user.id}`);

      // 2. Prepare Upload Task for Real Progress
      const uploadUrl = `${BACKEND_URL}/api/upload`;

      const task = FileSystem.createUploadTask(
        uploadUrl,
        uri,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Accept': 'application/json',
          },
          httpMethod: 'POST',
          fieldName: 'file',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          parameters: {
            title: title || '',
            description: desc || ''
          },
        },
        (data) => {
          const progress = data.totalBytesSent / data.totalBytesExpectedToSend;
          setUploads(prev => prev.map(item =>
            item.id === uploadId
              ? { ...item, progress: progress }
              : item
          ));
        }
      );

      console.log(`[Upload] Starter opplasting til: ${uploadUrl}`);
      const response = await task.uploadAsync();

      console.log(`[Upload] Respons status: ${response ? response.status : 'Ukjent'}`);

      if (!response || response.status !== 201) {
        let errorMessage = 'Upload failed';
        try {
          if (response && response.body) {
            const responseData = JSON.parse(response.body);
            errorMessage = responseData.error || errorMessage;
          }
        } catch (e) {
          console.warn('Could not parse error response', e);
        }
        console.error('[Upload] Feilmelding fra server:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log(`[Upload] Fullført suksessfullt! 🚀 ID: ${uploadId}`);

      // Mark as completed
      setUploads(prev => {
        console.log(`[State] Oppdaterer status til completed for ${uploadId}`);
        return prev.map(item =>
          item.id === uploadId ? { ...item, progress: 1, status: 'completed' } : item
        );
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Alert.alert('Sendt!', 'Filen er nå tilgjengelig på PC-en din. 🚀');

      // Vis success-overlay
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);

    } catch (error: any) {
      console.error('Upload error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setUploads(prev => {
        console.log(`[State] Oppdaterer status til error for ${uploadId}`);
        return prev.map(item =>
          item.id === uploadId ? { ...item, status: 'error' } : item
        );
      });

      Alert.alert('Error', error.message || 'Failed to upload file');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        setIsLoading(true);
        const asset = result.assets[0];

        // Check if the picked document is an image and convert to JPEG
        if (asset.mimeType?.startsWith('image/')) {
          try {
            const manipulated = await ImageManipulator.manipulateAsync(
              asset.uri,
              [],
              { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            setPendingFile({
              uri: manipulated.uri,
              name: asset.name?.replace(/\.[^/.]+$/, "") + ".jpg" || "image.jpg",
              mimeType: 'image/jpeg',
              size: asset.size || 0,
              type: 'image'
            });
          } catch (e) {
            console.error("Image conversion failed", e);
            // Fallback to original if conversion fails
            setPendingFile({
              uri: asset.uri,
              name: asset.name || 'image.jpg',
              mimeType: asset.mimeType || 'image/jpeg',
              size: asset.size || 0,
              type: 'image'
            });
          }
        } else {
          // For non-image files, use original data
          setPendingFile({
            uri: asset.uri,
            name: asset.name,
            mimeType: asset.mimeType,
            size: asset.size,
            type: 'file'
          });
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to upload them.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 1,
        exif: false,
      });

      if (!result.canceled) {
        setIsLoading(true);
        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop() || 'upload.jpg';

        // Use FileSystem to get actual file size
        let fileSize = 0;
        try {
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          if (fileInfo.exists && fileInfo.size) {
            fileSize = fileInfo.size;
          } else {
            console.warn('[Media] File size not available, estimating...');
            // Fallback estimate for videos/images
            if (asset.width && asset.height && asset.duration) {
              // Video estimate: ~2MB per second at medium quality
              fileSize = Math.floor((asset.duration / 1000) * 2 * 1024 * 1024);
            } else if (asset.width && asset.height) {
              // Image estimate
              fileSize = asset.width * asset.height * 3;
            }
          }
        } catch (e) {
          console.error('[Media] Could not get file info:', e);
        }

        setPendingFile({
          uri: asset.uri,
          name: fileName,
          mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
          size: fileSize,
          type: asset.type === 'video' ? 'file' : 'image'
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err: any) {
      console.error('[Media] Error picking media:', err);
      if (err.message && err.message.includes('3164')) {
        Alert.alert(
          'Cannot Access Video',
          'This video cannot be accessed. Try:\n\n1. Taking a new video with the camera\n2. Or using "File / Document" option instead'
        );
      } else {
        Alert.alert('Error', err.message || 'Could not access the media.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      t.upload.chooseType,
      '',
      [
        { text: t.upload.photoVideo, onPress: handlePickMedia },
        { text: t.upload.fileDocument, onPress: handlePickDocument },
        { text: t.upload.cancel, style: 'cancel' },
      ]
    );
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const renderUploadItem = ({ item }: { item: UploadItem }) => (
    <View style={styles.uploadItem}>
      <View style={[
        styles.uploadIconContainer,
        item.status === 'completed' && { backgroundColor: '#E8F5E9' }
      ]}>
        <IconSymbol
          name={item.status === 'completed' ? "checkmark.circle.fill" : (item.type === 'image' ? "photo.fill" : "doc.fill")}
          size={24}
          color={item.status === 'error' ? '#FF3B30' : (item.status === 'completed' ? '#34C759' : '#FF5B6F')}
        />
      </View>
      <View style={styles.uploadInfo}>
        <ThemedText style={styles.uploadName} numberOfLines={1}>{item.name}</ThemedText>
        <View style={styles.uploadMetaRow}>
          <ThemedText style={styles.uploadSize}>
            {item.size ? formatSize(item.size) : 'Unknown size'}
            {item.status === 'uploading' && ` • ${t.home.sending} `}
            {item.status === 'uploading' && <ActivityIndicator size="small" color="#8E8E93" />}
            {item.status === 'completed' && ` • ${t.home.sent}`}
            {item.status === 'error' && ` • ${t.home.failed}`}
          </ThemedText>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[
            styles.progressBarFill,
            { width: `${item.progress * 100}%` },
            item.status === 'error' && { backgroundColor: '#FF3B30' },
            item.status === 'completed' && { backgroundColor: '#34C759' }
          ]} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Logo */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../assets/images/logo-only-icon.png')}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
              <Image
                source={require('../../assets/images/logo-only-text.png')}
                style={{ width: 140, height: 40, marginLeft: -4 }}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSettingsVisible(true);
              }}
              activeOpacity={0.7}
              style={styles.settingsButton}
            >
              <IconSymbol name="gearshape.fill" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashed Upload Area */}
        <TouchableOpacity
          style={styles.dashedArea}
          onPress={handleUploadPress}
          activeOpacity={0.7}
          disabled={showSuccess}
        >
          {showSuccess ? (
            <View style={styles.successContainer}>
              <View style={styles.greenCircle}>
                <IconSymbol name="checkmark" size={60} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.successText}>Sendt</ThemedText>
            </View>
          ) : (
            <>
              <View style={styles.uploadIconWrapper}>
                <Image
                  source={require('../../assets/images/upload.jpg')}
                  style={{ width: 160, height: 160 }}
                  resizeMode="contain"
                />
              </View>
              <ThemedText style={styles.uploadTitle}>{t.home.uploadTitle}</ThemedText>
              <ThemedText style={styles.uploadSubtitle}>{t.home.uploadSubtitle}</ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Uploads List Header */}
        <View style={styles.uploadsHeader}>
          <ThemedText style={styles.sectionTitle}>{t.home.uploadsSection}</ThemedText>
        </View>

        {/* Uploads List */}
        <View style={styles.uploadsList}>
          {uploads.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>{t.home.noUploads}</ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>{t.home.noUploadsHint}</ThemedText>
            </View>
          ) : (
            uploads.map(item => (
              <View key={item.id} style={{ marginBottom: 16 }}>
                {renderUploadItem({ item })}
              </View>
            ))
          )}

        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>{t.settings.title}</ThemedText>
            <ThemedText style={styles.modalSubtitle}>{t.settings.subtitle}</ThemedText>

            <View style={styles.settingsSection}>
              <ThemedText style={styles.sectionLabel}>{t.settings.account}</ThemedText>
              <View style={styles.accountCard}>
                <View style={styles.avatarPlaceholder}>
                  <ThemedText style={styles.avatarText}>U</ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.accountEmail}>{t.settings.userAccount}</ThemedText>
                  <ThemedText style={styles.accountStatus}>{t.settings.proMember}</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <ThemedText style={styles.sectionLabel}>{t.settings.application}</ThemedText>

              {/* Language Selector with Flags */}
              <View style={styles.settingsRow}>
                <ThemedText style={styles.settingsRowText}>{t.settings.language}</ThemedText>
                <View style={styles.flagContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLanguage('no');
                    }}
                    style={[
                      styles.flagButton,
                      language === 'no' && styles.flagButtonActive
                    ]}
                  >
                    <Text style={styles.flagEmoji}>🇳🇴</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLanguage('en');
                    }}
                    style={[
                      styles.flagButton,
                      language === 'en' && styles.flagButtonActive
                    ]}
                  >
                    <Text style={styles.flagEmoji}>🇺🇸</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.settingsRow}>
                <ThemedText style={styles.settingsRowText}>{t.settings.notifications}</ThemedText>
                <IconSymbol name="chevron.right" size={16} color="#C7C7CC" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsRow}>
                <ThemedText style={styles.settingsRowText}>{t.settings.privacyPolicy}</ThemedText>
                <IconSymbol name="chevron.right" size={16} color="#C7C7CC" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => {
                await supabase.auth.signOut();
                setSettingsVisible(false);
              }}
            >
              <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.versionText}>FlashFiles v1.0.0</ThemedText>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Upload Preview Modal */}
      <Modal
        visible={!!pendingFile}
        animationType="fade"
        transparent={false}
      >
        <SafeAreaView style={styles.uploadModalContainer}>
          <View style={styles.uploadModalHeader}>
            <TouchableOpacity
              onPress={() => {
                setPendingFile(null);
                pan.setValue({ x: 0, y: 0 });
              }}
              style={styles.closeButton}
            >
              <IconSymbol name="xmark" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.uploadModalContent}>
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.previewCard,
                { transform: [{ translateY: Animated.add(pan.y, hintAnim) }] }
              ]}
            >
              {pendingFile && pendingFile.type === 'image' ? (
                <>
                  <Image
                    source={{ uri: pendingFile.uri }}
                    style={styles.previewImageFull}
                    resizeMode="cover"
                  />
                  {showOverlay && (
                    <View style={styles.textOverlayContainer}>
                      <View style={styles.textOverlayRow}>
                        <ThemedText style={styles.textOverlayTitle}>{overlayTitle || t.upload.title}</ThemedText>
                        <ThemedText style={styles.textOverlayDate}>
                          {new Date().toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', { month: 'short', day: 'numeric' })}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.textOverlayDesc}>{overlayDesc || t.upload.description}</ThemedText>
                    </View>
                  )}
                </>
              ) : pendingFile ? (
                <View style={styles.filePreviewContainerFull}>
                  <IconSymbol name="doc.fill" size={80} color="#007AFF" />
                  <ThemedText style={styles.previewFileNameFull}>{pendingFile.name}</ThemedText>
                </View>
              ) : null}

              <View style={styles.swipeHintOverlay}>
                <IconSymbol name="chevron.up" size={32} color="#FFFFFF" />
                <ThemedText style={styles.swipeTextOverlay}>{t.upload.swipeToSend}</ThemedText>
              </View>
            </Animated.View>

            {/* Text Overlay Controls */}
            <View style={styles.overlayControls}>
              <View style={styles.switchRow}>
                <ThemedText style={styles.switchLabel}>{t.upload.addTextOverlay}</ThemedText>
                <Switch
                  value={showOverlay}
                  onValueChange={(val) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowOverlay(val);
                  }}
                  trackColor={{ false: '#767577', true: '#34C759' }}
                  thumbColor={'#FFFFFF'}
                />
              </View>

              {showOverlay && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.overlayInput}
                    placeholder={t.upload.title}
                    placeholderTextColor="#999"
                    value={overlayTitle}
                    onChangeText={setOverlayTitle}
                  />
                  <TextInput
                    style={styles.overlayInput}
                    placeholder={t.upload.description}
                    placeholderTextColor="#999"
                    value={overlayDesc}
                    onChangeText={setOverlayDesc}
                  />
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Trial Paywall Modal */}
      <Modal
        visible={paywallVisible}
        animationType="fade"
        transparent={false}
      >
        <SafeAreaView style={styles.paywallContainer}>
          <View style={styles.paywallContent}>
            <ThemedText style={styles.paywallTag}>{t.paywall.exclusiveAccess}</ThemedText>
            <ThemedText style={styles.paywallTitle}>{t.paywall.trialPeriod}</ThemedText>

            <View style={styles.countdownContainer}>
              <ThemedText style={styles.countdownNumber}>{daysLeft}</ThemedText>
              <ThemedText style={styles.countdownLabel}>{t.paywall.daysLeft}</ThemedText>
            </View>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <IconSymbol name="paperplane.fill" size={20} color="#000000" />
                </View>
                <View>
                  <ThemedText style={styles.featureTitle}>{t.paywall.instantTransfers}</ThemedText>
                  <ThemedText style={styles.featureDesc}>{t.paywall.instantTransfersDesc}</ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#000000" />
                </View>
                <View>
                  <ThemedText style={styles.featureTitle}>{t.paywall.secureEncryption}</ThemedText>
                  <ThemedText style={styles.featureDesc}>{t.paywall.secureEncryptionDesc}</ThemedText>
                </View>
              </View>


            </View>
          </View>

          <View style={styles.paywallFooter}>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => Alert.alert('Upgrade coming soon!', 'Thank you for your interest in FlashFiles Pro.')}
            >
              <ThemedText style={styles.upgradeButtonText}>{t.paywall.unlockFull}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setPaywallVisible(false);
              }}
            >
              <ThemedText style={styles.skipButtonText}>{t.paywall.continueToApp}</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Global Loading Overlay */}
      {
        isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <ThemedText style={styles.loadingText}>{t.home.preparing}</ThemedText>
            </View>
          </View>
        )
      }
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    marginBottom: 30,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 22,
  },
  dashedArea: {
    marginHorizontal: 24,
    height: 480, // Large height as shown in screenshot
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Transparent or white
    marginBottom: 40,
  },
  uploadIconWrapper: {
    marginBottom: 20,
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueArrowBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  uploadsHeader: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  uploadsList: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    backgroundColor: '#F9F9FB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyStateIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
    width: '100%',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
  },
  modalContent: {
    paddingHorizontal: 30,
    paddingTop: 60,
    flex: 1,
  },
  modalTitle: {
    fontSize: 54,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'left',
    marginBottom: 8,
    lineHeight: 60,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'left',
    marginBottom: 48,
  },
  settingsSection: {
    marginBottom: 32,
    width: '100%',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  accountStatus: {
    fontSize: 14,
    color: '#666666',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingsRowText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
  },
  flagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  flagButton: {
    width: 44,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  flagButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  flagEmoji: {
    fontSize: 20,
  },
  modalFooter: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoutButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#000000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    fontSize: 13,
    color: '#999999',
  },
  // Paywall Styles
  paywallContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  paywallContent: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  paywallTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 2,
    marginBottom: 16,
  },
  paywallTitle: {
    fontSize: 54,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'left',
    lineHeight: 60,
    marginBottom: 40,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 60,
    gap: 12,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 80,
  },
  countdownLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#999999',
    letterSpacing: 1,
  },
  featureList: {
    gap: 32,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    maxWidth: '85%',
  },
  paywallFooter: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  upgradeButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#000000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    color: '#999999',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  uploadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA', // Light border as seen in screenshot
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  uploadIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFEBEE', // Light red bg
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileIconPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  uploadMetaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  uploadSize: {
    fontSize: 13,
    color: '#8E8E93',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4E55FF', // Blue-ish purple from logo/screenshot
    borderRadius: 2,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  greenCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  filePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  previewFileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  swipeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  cancelPreview: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  // Upload Modal Styles
  uploadModalContainer: {
    flex: 1,
    backgroundColor: '#000000', // Dark background for focus
  },
  uploadModalContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  previewCard: {
    width: width - 40,
    height: width * 1.3, // 4:5 aspect ratioish
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  previewImageFull: {
    width: '100%',
    height: '100%',
  },
  filePreviewContainerFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  previewFileNameFull: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  swipeHintOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  swipeTextOverlay: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  uploadModalHeader: {
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: 40,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayControls: {
    width: width - 40,
    marginTop: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    marginTop: 16,
    gap: 12,
  },
  overlayInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
  },
  textOverlayContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 12,
    maxWidth: '80%',
    alignItems: 'flex-end',
  },
  textOverlayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  textOverlayTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textOverlayDate: {
    color: '#D1D1D6',
    fontSize: 12,
    fontWeight: '500',
  },
  textOverlayDesc: {
    color: '#E5E5EA',
    fontSize: 14,
    textAlign: 'right',
  },
});
