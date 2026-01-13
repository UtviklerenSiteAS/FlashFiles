import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password || !name) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Registration Failed', error.message);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Supabase might require email confirmation depending on settings
                if (data.session) {
                    router.replace('/(tabs)');
                } else {
                    Alert.alert('Success', 'Check your email for the confirmation link!');
                    router.replace('/(auth)/login');
                }
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

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <ThemedText style={styles.title} type="title">Create Account</ThemedText>
                        <ThemedText style={styles.subtitle}>Join FlashFiles and start sharing</ThemedText>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor="#999999"
                                value={name}
                                onChangeText={setName}
                                editable={!loading}
                            />
                        </View>

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

                        <TouchableOpacity
                            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <ThemedText style={styles.registerButtonText}>Create Account</ThemedText>
                            )}
                        </TouchableOpacity>

                        <ThemedText style={styles.termsText}>
                            By signing up, you agree to our <ThemedText style={styles.linkText}>Terms of Service</ThemedText> and <ThemedText style={styles.linkText}>Privacy Policy</ThemedText>.
                        </ThemedText>
                    </View>

                    <View style={styles.footer}>
                        <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={loading}>
                            <ThemedText style={styles.linkText}>Sign In</ThemedText>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
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
    registerButton: {
        backgroundColor: '#000000',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    registerButtonDisabled: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    termsText: {
        textAlign: 'left',
        fontSize: 12,
        color: '#999999',
        lineHeight: 18,
        marginTop: 12,
    },
    footer: {
        flexDirection: 'row',
        marginTop: 40,
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
