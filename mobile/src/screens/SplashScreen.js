// src/screens/SplashScreen.js

import React, { useEffect, useRef } from "react";
import {
    StyleSheet,
    View,
    Animated,
    StatusBar,
    Dimensions,
    Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const SplashScreen = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Анимация появления
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Анимация вращения
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ).start();

        // Анимация прогресс бара
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
        }).start();
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2563EB" translucent />
            
            <LinearGradient
                colors={["#2563EB", "#3B82F6", "#1D4ED8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Декоративные элементы */}
                <View style={styles.decorativeElements}>
                    <Animated.View
                        style={[
                            styles.floatingCircle,
                            styles.circle1,
                            { transform: [{ rotate: spin }] },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.floatingCircle,
                            styles.circle2,
                            { 
                                transform: [
                                    { 
                                        rotate: rotateAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['360deg', '0deg'],
                                        })
                                    }
                                ] 
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.floatingCircle,
                            styles.circle3,
                            { 
                                transform: [
                                    { 
                                        rotate: rotateAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['180deg', '540deg'],
                                        })
                                    }
                                ] 
                            },
                        ]}
                    />
                </View>

                {/* Логотип */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.logoBackground}>
                        <Animated.Text 
                            style={[
                                styles.logo,
                                { 
                                    transform: [
                                        { 
                                            rotate: rotateAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '15deg'],
                                            })
                                        }
                                    ] 
                                }
                            ]}
                        >
                            💰
                        </Animated.Text>
                    </View>
                    
                    <Animated.Text
                        style={[
                            styles.appName,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    {
                                        translateY: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        FinanceApp
                    </Animated.Text>
                    
                    <Animated.Text
                        style={[
                            styles.tagline,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    {
                                        translateY: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [30, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        Smart Financial Management
                    </Animated.Text>
                </Animated.View>

                {/* Индикатор загрузки */}
                <Animated.View
                    style={[
                        styles.loadingContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                {
                                    translateY: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <Text style={styles.loadingText}>Loading...</Text>
                    <View style={styles.loadingBar}>
                        <Animated.View
                            style={[
                                styles.loadingFill,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                },
                            ]}
                        />
                    </View>
                    <View style={styles.loadingDots}>
                        {[0, 1, 2].map((index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.loadingDot,
                                    {
                                        opacity: rotateAnim.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange: index === 0 ? [1, 0.3, 0.3, 1] :
                                                      index === 1 ? [0.3, 1, 0.3, 0.3] :
                                                                   [0.3, 0.3, 1, 0.3],
                                        }),
                                        transform: [
                                            {
                                                scale: rotateAnim.interpolate({
                                                    inputRange: [0, 0.33, 0.66, 1],
                                                    outputRange: index === 0 ? [1.2, 0.8, 0.8, 1.2] :
                                                              index === 1 ? [0.8, 1.2, 0.8, 0.8] :
                                                                           [0.8, 0.8, 1.2, 0.8],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </Animated.View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    decorativeElements: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    floatingCircle: {
        position: "absolute",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 100,
    },
    circle1: {
        width: 200,
        height: 200,
        top: "10%",
        right: "-10%",
    },
    circle2: {
        width: 150,
        height: 150,
        bottom: "15%",
        left: "-15%",
    },
    circle3: {
        width: 80,
        height: 80,
        top: "30%",
        left: "20%",
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 100,
    },
    logoBackground: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    logo: {
        fontSize: 60,
    },
    appName: {
        fontSize: 32,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 8,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.9)",
        fontWeight: "400",
    },
    loadingContainer: {
        position: "absolute",
        bottom: 120,
        width: "70%",
        alignItems: "center",
    },
    loadingText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 20,
        opacity: 0.9,
    },
    loadingBar: {
        height: 4,
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 20,
    },
    loadingFill: {
        height: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 2,
    },
    loadingDots: {
        flexDirection: "row",
        gap: 12,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FFFFFF",
    },
});

export default SplashScreen;