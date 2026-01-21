import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('--- Login Error Debug ---');
                console.error('Error Code:', error.code);
                console.error('Error Status:', error.status);
                console.error('Error Message:', error.message);
                console.error('Full Error:', JSON.stringify(error, null, 2));
                console.error('--------------------------');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Login Failed', error.message);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace('/(tabs)');
            }
        } catch (err: any) {
            Alert.alert('Unexpected Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.inner}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <IconSymbol name="chevron.left" size={24} color="#000000" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <ThemedText style={styles.title} type="title">Welcome Back</ThemedText>
                    <ThemedText style={styles.subtitle}>Sign in to access your files</ThemedText>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            placeholderTextColor="#999999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#999999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity style={styles.forgotPassword} disabled={loading}>
                        <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <ThemedText style={styles.loginButtonText}>Sign In</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <ThemedText style={styles.footerText}>Don't have an account? </ThemedText>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={loading}>
                        <ThemedText style={styles.linkText}>Create Account</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    inner: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        marginBottom: 40,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        color: '#000000',
        marginBottom: 8,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        color: '#000000',
        fontSize: 16,
    },
    forgotPassword: {
        alignSelf: 'flex-start',
    },
    forgotPasswordText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#000000',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        marginTop: 'auto',
        marginBottom: 40,
    },
    footerText: {
        color: '#666666',
    },
    linkText: {
        color: '#000000',
        fontWeight: 'bold',
    },
});
