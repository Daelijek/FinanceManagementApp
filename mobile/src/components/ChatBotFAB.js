// src/components/ChatBotFAB.js

import React, { useContext, useRef, useEffect } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    View,
    Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";

const ChatBotFAB = ({ navigation, style }) => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    // Animation references
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const tooltipAnim = useRef(new Animated.Value(0)).current;

    // Pulse animation effect
    useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1800,
                    easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
                    useNativeDriver: true,
                }),
            ])
        );

        pulseAnimation.start();

        return () => pulseAnimation.stop();
    }, []);

    // Press animations
    const handlePressIn = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 300,
                friction: 4,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePress = () => {
        console.log('ChatBot FAB pressed!'); // Для отладки
        navigation.navigate('Chat Bot');
    };

    const handleLongPress = () => {
        // Показываем tooltip при долгом нажатии
        Animated.sequence([
            Animated.timing(tooltipAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(tooltipAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '12deg'],
    });

    return (
        <View style={[styles.container, style]}>
            {/* Pulse ring effect */}
            <Animated.View
                style={[
                    styles.pulseRing,
                    {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseAnim.interpolate({
                            inputRange: [1, 1.15],
                            outputRange: [0.4, 0],
                        }),
                    },
                ]}
            />

            {/* Main FAB */}
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                onLongPress={handleLongPress}
                delayLongPress={500}
            >
                <Animated.View
                    style={[
                        styles.fab,
                        {
                            transform: [
                                { scale: scaleAnim },
                                { rotate: rotation },
                            ],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={["#2563EB", "#3B82F6", "#1D4ED8"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.fabGradient}
                    >
                        <MaterialCommunityIcons
                            name="robot"
                            size={28}
                            color="#FFFFFF"
                        />
                    </LinearGradient>
                </Animated.View>
            </TouchableOpacity>

            {/* Optional tooltip */}
            <Animated.View style={[
                styles.tooltip,
                {
                    opacity: tooltipAnim,
                    transform: [
                        {
                            scale: tooltipAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.8, 1],
                            }),
                        },
                    ],
                }
            ]}>
                <Text style={styles.tooltipText}>
                    {t('chatbot.ask_assistant') || "Ask Assistant"}
                </Text>
            </Animated.View>
        </View>
    );
};

const getThemedStyles = (isDark) =>
    StyleSheet.create({
        container: {
            position: 'absolute',
            bottom: 90, // Above bottom tab bar
            right: 20,
            alignItems: 'center',
            justifyContent: 'center',
            width: 80, // Контейнер размером с пульсирующее кольцо
            height: 80,
            zIndex: 1000,
        },
        pulseRing: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#2563EB',
        },
        fab: {
            width: 60,
            height: 60,
            borderRadius: 30,
            elevation: 8,
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            zIndex: 1, // FAB поверх пульсирующего кольца
        },
        fabGradient: {
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
        },
        tooltip: {
            position: 'absolute',
            bottom: -25, // Относительно контейнера
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            opacity: 0, // Hidden by default, показывается при долгом нажатии
        },
        tooltipText: {
            fontSize: 12,
            fontWeight: '500',
            color: isDark ? '#F9FAFB' : '#111827',
        },
    });

export default ChatBotFAB;