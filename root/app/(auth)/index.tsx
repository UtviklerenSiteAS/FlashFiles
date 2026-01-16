import React from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Animated, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

export default function LandingPage() {
    const router = useRouter();
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(20)).current;
    const scrollAnim = React.useRef(new Animated.Value(0)).current;

    const features = [
        { icon: 'bolt', text: 'Transfers in a flash' },
        { icon: 'lock.shield', text: 'End-to-end encryption' },
        { icon: 'cloud', text: 'Access from anywhere' },
    ];

    // Triplicate features for a smooth loop
    const scrollItems = [...features, ...features, ...features];

    React.useEffect(() => {
        // Initial animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Constant horizontal scroll
        const startScroll = () => {
            scrollAnim.setValue(0);
            Animated.loop(
                Animated.timing(scrollAnim, {
                    toValue: -1,
                    duration: 15000,
                    useNativeDriver: true,
                    easing: (t) => t, // Linear
                })
            ).start();
        };

        startScroll();
    }, []);

    const handlePress = (target: 'login' | 'register') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/(auth)/${target}`);
    };

    const translateX = scrollAnim.interpolate({
        inputRange: [-1, 0],
        outputRange: [-720, 0], // (220 width + 20 gap) * 3 features
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.content,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}
            >
                {/* Swipe Visualization Top - Takes remaining space to push rest down */}
                <View style={styles.animationSection}>
                    <SwipeAnimation />
                </View>

                {/* Bottom Group: Title + Features + Buttons */}
                <View style={styles.bottomGroup}>
                    <View style={styles.topSection}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/images/logo-only-icon.png')}
                                style={{ width: 50, height: 50, marginBottom: 16 }}
                                resizeMode="contain"
                            />
                            <Image
                                source={require('../../assets/images/logo-only-text.png')}
                                style={{ width: 200, height: 50, marginBottom: 4, marginLeft: -6 }}
                                resizeMode="contain"
                            />
                            <ThemedText style={styles.subtitle}>Instant. Secure. Global.</ThemedText>
                        </View>

                        <View style={styles.scrollWrapper}>
                            <Animated.View style={[styles.featuresRow, { transform: [{ translateX }] }]}>
                                {scrollItems.map((item, index) => (
                                    <FeatureItem key={index} icon={item.icon} text={item.text} />
                                ))}
                            </Animated.View>

                            {/* Edge Gradients */}
                            <LinearGradient
                                colors={['#FFFFFF', 'rgba(255,255,255,0)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.leftGradient}
                            />
                            <LinearGradient
                                colors={['rgba(255,255,255,0)', '#FFFFFF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.rightGradient}
                            />
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <View style={styles.authButtonsRow}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => handlePress('register')}
                            >
                                <ThemedText style={styles.primaryButtonText}>Sign Up</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => handlePress('login')}
                            >
                                <ThemedText style={styles.secondaryButtonText}>Sign In</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

function SwipeAnimation() {
    const moveAnim = React.useRef(new Animated.Value(0)).current;
    const snapAnim = React.useRef(new Animated.Value(0)).current; // Dedicated for the flick speed
    const opacityAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const startAnimation = () => {
            moveAnim.setValue(0);
            snapAnim.setValue(0);
            opacityAnim.setValue(0);

            Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        // File motion - slow start, fast end
                        Animated.timing(moveAnim, {
                            toValue: 1,
                            duration: 1600,
                            easing: Easing.bezier(0.8, 0, 1, 1),
                            useNativeDriver: true
                        }),
                        // Touch motion - slightly slower, more deliberate snap
                        Animated.timing(snapAnim, {
                            toValue: 1,
                            duration: 1200,
                            easing: Easing.out(Easing.quad),
                            useNativeDriver: true
                        }),
                        // General opacity
                        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                    ]),
                    // Fade out everything at the end
                    Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.delay(600),
                ])
            ).start();
        };

        startAnimation();
    }, []);

    const cardY = moveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [100, -700], // Start lower, fly higher
    });

    const cardScale = moveAnim.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [1, 1, 0.4],
    });

    const cardRotate = moveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '15deg'],
    });

    const fingerY = snapAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [140, 100], // Fast 40px travel
    });

    const fingerOpacity = snapAnim.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [1, 1, 0], // Fades at the end of snap
    });

    return (
        <View style={styles.phoneFrame}>
            {/* Dynamic File Card - Always Visible */}
            <Animated.View
                style={[
                    styles.fileCard,
                    {
                        opacity: 1, // Explicitly visible
                        zIndex: 10,
                        transform: [
                            { translateY: cardY },
                            { scale: cardScale },
                            { rotate: cardRotate }
                        ]
                    }
                ]}
            >
                <IconSymbol name="doc.fill" size={24} color="#007AFF" />
            </Animated.View>

            {/* Finger/Touch Indicator - NOW ON TOP & FAST */}
            <Animated.View
                style={[
                    styles.fingerIndicator,
                    {
                        opacity: Animated.multiply(opacityAnim, fingerOpacity),
                        transform: [{ translateY: fingerY }],
                        zIndex: 20
                    }
                ]}
            />

            {/* Phone Notch/Home bar decor */}
            <View style={styles.phoneHomeBar} />
        </View>
    );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.featureItem}>
            <IconSymbol name={icon as any} size={20} color="#007AFF" />
            <ThemedText style={styles.featureText}>{text}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 30,
        paddingTop: 10, // Pull everything up
        paddingBottom: 60, // Avoid home bar overlap
    },
    content: {
        flex: 1,
        width: '100%',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    topSection: {
        width: '100%',
    },
    logoContainer: {
        alignItems: 'flex-start',
        width: '100%',
    },
    title: {
        fontSize: 32,
        color: '#000000',
        marginTop: 20,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 18,
        color: '#666666',
        marginTop: 8,
    },
    scrollWrapper: {
        marginHorizontal: -30, // Offset container padding
        overflow: 'hidden',
        marginTop: 20,
        height: 40,
    },
    featuresRow: {
        flexDirection: 'row',
        gap: 20,
        paddingLeft: 30, // Start scrolling from the same alignment as the title
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: 220, // Fixed width for smooth scrolling calculation
    },
    featureText: {
        fontSize: 15,
        color: '#666666',
        fontWeight: '500',
    },
    animationSection: {
        flex: 1, // Take up available space to push content down
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    bottomGroup: {
        width: '100%',
        gap: 30, // Distance between features and buttons
        marginBottom: 20,
    },
    phoneFrame: {
        width: 180,
        height: 360,
        borderWidth: 5,
        borderColor: '#EEEEEE',
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileCard: {
        width: 90,
        height: 120,
        backgroundColor: '#F5F5F7',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    fingerIndicator: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 122, 255, 0.4)',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    leftGradient: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 60,
        zIndex: 2,
    },
    rightGradient: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 60,
        zIndex: 2,
    },
    phoneHomeBar: {
        position: 'absolute',
        bottom: 8,
        width: 40,
        height: 4,
        backgroundColor: '#EEEEEE',
        borderRadius: 2,
    },
    buttonContainer: {
        width: '100%',
    },
    authButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#000000',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    secondaryButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
});
