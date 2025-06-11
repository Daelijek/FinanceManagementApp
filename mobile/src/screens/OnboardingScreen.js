// src/screens/OnboardingScreen.js - УЛУЧШЕННАЯ ВЕРСИЯ

import React, { useContext, useState, useRef, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    Animated,
    StatusBar,
    Modal,
    FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const OnboardingScreen = ({ navigation }) => {
    const { t, i18n } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [shouldShowOnboarding, setShouldShowOnboarding] = useState(null);
    const [languageModalVisible, setLanguageModalVisible] = useState(false);
    const scrollViewRef = useRef(null);

    // Анимации
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const floatingAnim = useRef(new Animated.Value(0)).current;
    const particleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    // Доступные языки
    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
        { code: 'kz', name: 'Қазақша', flag: '🇰🇿', nativeName: 'Қазақша' },
    ];

    // ДЛЯ РАЗРАБОТКИ: ВСЕГДА ПОКАЗЫВАЕМ ONBOARDING
    useEffect(() => {
        console.log("🚀 OnboardingScreen - DEVELOPMENT MODE: Always showing onboarding");
        setShouldShowOnboarding(true);
    }, []);

    // Данные слайдов
    const slides = [
        {
            id: 1,
            title: t('onboarding.slide1.title') || "Smart Financial Management",
            subtitle: t('onboarding.slide1.subtitle') || "Take control of your finances with intelligent budgeting and expense tracking",
            icon: "analytics-outline",
            gradient: ["#667eea", "#764ba2"],
            illustration: "📊",
            particles: ["💰", "📈", "💳"],
        },
        {
            id: 2,
            title: t('onboarding.slide2.title') || "AI-Powered Insights",
            subtitle: t('onboarding.slide2.subtitle') || "Get personalized financial advice and smart recommendations from our AI assistant",
            icon: "bulb-outline",
            gradient: ["#f093fb", "#f5576c"],
            illustration: "🤖",
            particles: ["🧠", "⚡", "🎯"],
        },
        {
            id: 3,
            title: t('onboarding.slide3.title'),
            subtitle: t('onboarding.slide3.subtitle'),
            icon: "checkmark",
            gradient: ["#4facfe", "#00f2fe"],
            illustration: "🎯",
            particles: ["🏆", "📊", "💪"],
        },
        {
            id: 4,
            title: t('onboarding.slide4.title') || "Secure & Private",
            subtitle: t('onboarding.slide4.subtitle') || "Your financial data is protected with bank-level security and encryption",
            icon: "shield-checkmark-outline",
            gradient: ["#43e97b", "#38f9d7"],
            illustration: "🔒",
            particles: ["🛡️", "🔐", "✨"],
        },
    ];

    // Запуск входных анимаций
    useEffect(() => {
        if (shouldShowOnboarding) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            // Плавающая анимация
            const floatingAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(floatingAnim, {
                        toValue: 1,
                        duration: 4000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(floatingAnim, {
                        toValue: 0,
                        duration: 4000,
                        useNativeDriver: true,
                    }),
                ])
            );

            // Анимация частиц
            const particleAnimation = Animated.loop(
                Animated.timing(particleAnim, {
                    toValue: 1,
                    duration: 8000,
                    useNativeDriver: true,
                })
            );

            // Эффект свечения
            const glowAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            );

            floatingAnimation.start();
            particleAnimation.start();
            glowAnimation.start();

            return () => {
                floatingAnimation.stop();
                particleAnimation.stop();
                glowAnimation.stop();
            };
        }
    }, [shouldShowOnboarding]);

    // Обновление прогресса
    useEffect(() => {
        if (shouldShowOnboarding) {
            Animated.timing(progressAnim, {
                toValue: currentIndex,
                duration: 500,
                useNativeDriver: false,
            }).start();
        }
    }, [currentIndex, shouldShowOnboarding]);

    // Обработка скроллинга
    const handleScroll = (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(contentOffsetX / screenWidth);

        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < slides.length) {
            setCurrentIndex(newIndex);
        }
    };

    // Переход к следующему слайду
    const nextSlide = () => {
        if (currentIndex < slides.length - 1) {
            const nextIndex = currentIndex + 1;
            scrollViewRef.current?.scrollTo({
                x: nextIndex * screenWidth,
                animated: true,
            });
            setCurrentIndex(nextIndex);
        } else {
            handleGetStarted();
        }
    };

    // Переход к предыдущему слайду
    const prevSlide = () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            scrollViewRef.current?.scrollTo({
                x: prevIndex * screenWidth,
                animated: true,
            });
            setCurrentIndex(prevIndex);
        }
    };

    // Завершение онбординга
    const handleGetStarted = async () => {
        try {
            console.log("🔧 DEVELOPMENT MODE: Onboarding completed, navigating to Login (not saving status)");
            navigation.replace("Login");
        } catch (error) {
            console.error("❌ Error during onboarding completion:", error);
            navigation.replace("Login");
        }
    };

    // Пропуск онбординга
    const handleSkip = () => {
        Animated.timing(buttonScaleAnim, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
        }).start(() => {
            Animated.timing(buttonScaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }).start();
            handleGetStarted();
        });
    };

    // Смена языка
    const changeLanguage = async (languageCode) => {
        try {
            await i18n.changeLanguage(languageCode);
            await AsyncStorage.setItem('userLanguage', languageCode);
            setLanguageModalVisible(false);
            console.log('🌐 Language changed to:', languageCode);
        } catch (error) {
            console.error('❌ Error changing language:', error);
        }
    };

    // Анимация кнопки
    const animateButton = () => {
        Animated.sequence([
            Animated.timing(buttonScaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // Рендер частиц
    const renderParticles = (particles) => {
        return particles.map((particle, index) => (
            <Animated.Text
                key={index}
                style={[
                    styles.particle,
                    {
                        left: `${20 + (index * 25)}%`,
                        top: `${30 + (index * 15)}%`,
                        transform: [
                            {
                                translateY: particleAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -30 - (index * 10)],
                                }),
                            },
                            {
                                rotate: particleAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', `${360 + (index * 45)}deg`],
                                }),
                            },
                        ],
                        opacity: particleAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.3, 1, 0.3],
                        }),
                    },
                ]}
            >
                {particle}
            </Animated.Text>
        ));
    };

    // Рендер слайда
    const renderSlide = (slide, index) => {
        const isActive = index === currentIndex;

        return (
            <View key={slide.id} style={styles.slide}>
                <LinearGradient
                    colors={slide.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.slideGradient}
                >
                    {/* Декоративные элементы */}
                    <View style={styles.decorativeElements}>
                        {/* Плавающие частицы */}
                        {renderParticles(slide.particles)}

                        {/* Светящиеся круги */}
                        <Animated.View
                            style={[
                                styles.glowCircle,
                                styles.glowCircle1,
                                {
                                    opacity: glowAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.1, 0.3],
                                    }),
                                    transform: [
                                        {
                                            scale: glowAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.8, 1.2],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.glowCircle,
                                styles.glowCircle2,
                                {
                                    opacity: glowAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.2, 0.4],
                                    }),
                                    transform: [
                                        {
                                            scale: glowAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1.2, 0.8],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />

                        {/* Плавающие элементы */}
                        <Animated.View
                            style={[
                                styles.floatingElement,
                                styles.floatingElement1,
                                {
                                    transform: [
                                        {
                                            translateY: floatingAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, -25],
                                            }),
                                        },
                                        {
                                            rotate: floatingAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '360deg'],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.floatingElement,
                                styles.floatingElement2,
                                {
                                    transform: [
                                        {
                                            translateY: floatingAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, 20],
                                            }),
                                        },
                                        {
                                            rotate: floatingAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['360deg', '0deg'],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                    </View>

                    {/* Контент */}
                    <Animated.View
                        style={[
                            styles.slideContent,
                            {
                                opacity: isActive ? fadeAnim : 0.7,
                                transform: [
                                    {
                                        translateY: isActive ? slideAnim : 30,
                                    },
                                    {
                                        scale: isActive ? 1 : 0.9,
                                    },
                                ],
                            },
                        ]}
                    >
                        {/* Иллюстрация */}
                        <Animated.View
                            style={[
                                styles.illustrationContainer,
                                {
                                    transform: [
                                        {
                                            scale: glowAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 1.05],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Text style={styles.illustration}>{slide.illustration}</Text>
                            <Animated.View
                                style={[
                                    styles.iconContainer,
                                    {
                                        shadowOpacity: glowAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.3, 0.6],
                                        }),
                                    },
                                ]}
                            >
                                <Ionicons name={slide.icon} size={40} color="#FFFFFF" />
                            </Animated.View>
                        </Animated.View>

                        {/* Текст */}
                        <View style={styles.textContainer}>
                            <Animated.Text
                                style={[
                                    styles.slideTitle,
                                    {
                                        opacity: fadeAnim,
                                        transform: [
                                            {
                                                translateY: slideAnim.interpolate({
                                                    inputRange: [0, 50],
                                                    outputRange: [0, 20],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                {slide.title}
                            </Animated.Text>
                            <Animated.Text
                                style={[
                                    styles.slideSubtitle,
                                    {
                                        opacity: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, 0.9],
                                        }),
                                        transform: [
                                            {
                                                translateY: slideAnim.interpolate({
                                                    inputRange: [0, 50],
                                                    outputRange: [0, 30],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                {slide.subtitle}
                            </Animated.Text>
                        </View>
                    </Animated.View>
                </LinearGradient>
            </View>
        );
    };

    // Рендер элемента языка
    const renderLanguageItem = ({ item }) => {
        const isSelected = i18n.language === item.code;
        return (
            <TouchableOpacity
                style={[styles.languageItem, isSelected && styles.languageItemSelected]}
                onPress={() => changeLanguage(item.code)}
            >
                <Text style={styles.languageFlag}>{item.flag}</Text>
                <View style={styles.languageInfo}>
                    <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                        {item.nativeName}
                    </Text>
                    <Text style={[styles.languageCode, isSelected && styles.languageCodeSelected]}>
                        {item.name}
                    </Text>
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#4facfe" />
                )}
            </TouchableOpacity>
        );
    };

    // ПОКАЗЫВАЕМ ЗАГРУЗКУ ПОКА ОПРЕДЕЛЯЕМ ЧТО ДЕЛАТЬ
    if (shouldShowOnboarding === null) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // ЕСЛИ НЕ НУЖНО ПОКАЗЫВАТЬ ONBOARDING - ВОЗВРАЩАЕМ NULL
    if (!shouldShowOnboarding) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent
            />

            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <View style={styles.headerLeft}>
                    <Text style={styles.logo}>💰</Text>
                    <Text style={styles.appName}>FinanceApp</Text>
                </View>

                <View style={styles.headerRight}>
                    {/* Кнопка смены языка */}
                    <TouchableOpacity
                        style={styles.languageButton}
                        onPress={() => setLanguageModalVisible(true)}
                    >
                        <Ionicons name="language" size={20} color="#FFFFFF" />
                        <Text style={styles.languageButtonText}>
                            {languages.find(lang => lang.code === i18n.language)?.flag || '🌐'}
                        </Text>
                    </TouchableOpacity>

                    {/* Кнопка Skip */}
                    <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkip}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.skipText}>{t('onboarding.skip') || "Skip"}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Animated.View>

            {/* Слайды */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.slidesContainer}
            >
                {slides.map((slide, index) => renderSlide(slide, index))}
            </ScrollView>

            {/* Footer */}
            <Animated.View
                style={[
                    styles.footer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                {/* Индикаторы прогресса */}
                <View style={styles.progressContainer}>
                    {/* Современный прогресс бар */}
                    <View style={styles.modernProgressBar}>
                        <Animated.View
                            style={[
                                styles.modernProgressFill,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, slides.length - 1],
                                        outputRange: ["25%", "100%"],
                                    }),
                                    backgroundColor: slides[currentIndex]?.gradient[1] || "#4facfe",
                                },
                            ]}
                        />
                    </View>

                    {/* Индикатор страницы */}
                    <Text style={styles.pageIndicator}>
                        {currentIndex + 1} / {slides.length}
                    </Text>
                </View>

                {/* Навигационные кнопки */}
                <View style={styles.navigationContainer}>
                    {/* Кнопка "Назад" */}
                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            styles.backButton,
                            currentIndex === 0 && styles.navButtonDisabled,
                        ]}
                        onPress={prevSlide}
                        disabled={currentIndex === 0}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={24}
                            color={currentIndex === 0 ? "#9CA3AF" : "#FFFFFF"}
                        />
                    </TouchableOpacity>

                    {/* Кнопка "Далее" / "Начать" */}
                    <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                        <TouchableOpacity
                            style={styles.nextButton}
                            onPress={() => {
                                animateButton();
                                nextSlide();
                            }}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={slides[currentIndex]?.gradient || ["#4facfe", "#00f2fe"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.nextButtonGradient}
                            >
                                {currentIndex === slides.length - 1 ? (
                                    <>
                                        <Text style={styles.nextButtonText}>
                                            {t('onboarding.get_started') || "Get Started"}
                                        </Text>
                                        <Ionicons name="rocket" size={20} color="#FFFFFF" />
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.nextButtonText}>
                                            {t('onboarding.next') || "Next"}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Animated.View>

            {/* Модальное окно выбора языка */}
            <Modal
                visible={languageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLanguageModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {t('language_screen.current_language') || 'Select Language'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setLanguageModalVisible(false)}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={languages}
                            renderItem={renderLanguageItem}
                            keyExtractor={(item) => item.code}
                            style={styles.languageList}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const getThemedStyles = (isDark) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "#000000",
        },
        loadingContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#000000",
        },
        loadingText: {
            color: "#FFFFFF",
            fontSize: 18,
            fontWeight: "500",
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 10,
            zIndex: 10,
        },
        headerLeft: {
            flexDirection: "row",
            alignItems: "center",
        },
        headerRight: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        logo: {
            fontSize: 28,
            marginRight: 8,
        },
        appName: {
            fontSize: 20,
            fontWeight: "700",
            color: "#FFFFFF",
        },
        languageButton: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            gap: 6,
        },
        languageButtonText: {
            fontSize: 16,
        },
        skipButton: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
        },
        skipText: {
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "500",
        },
        slidesContainer: {
            flex: 1,
        },
        slide: {
            width: screenWidth,
            flex: 1,
        },
        slideGradient: {
            flex: 1,
            position: "relative",
        },
        decorativeElements: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
        particle: {
            position: "absolute",
            fontSize: 20,
            zIndex: 1,
        },
        glowCircle: {
            position: "absolute",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 1000,
        },
        glowCircle1: {
            width: 200,
            height: 200,
            top: "10%",
            right: "-5%",
        },
        glowCircle2: {
            width: 150,
            height: 150,
            bottom: "20%",
            left: "-10%",
        },
        floatingElement: {
            position: "absolute",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            borderRadius: 50,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.1)",
        },
        floatingElement1: {
            width: 60,
            height: 60,
            top: "20%",
            right: "15%",
        },
        floatingElement2: {
            width: 40,
            height: 40,
            top: "35%",
            left: "10%",
        },
        slideContent: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
            zIndex: 2,
        },
        illustrationContainer: {
            alignItems: "center",
            marginBottom: 60,
        },
        illustration: {
            fontSize: 100,
            marginBottom: 20,
            textShadowColor: "rgba(0, 0, 0, 0.3)",
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 8,
        },
        iconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(255, 255, 255, 0.25)",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.3)",
        },
        textContainer: {
            alignItems: "center",
        },
        slideTitle: {
            fontSize: 32,
            fontWeight: "800",
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: 16,
            lineHeight: 40,
            textShadowColor: "rgba(0, 0, 0, 0.3)",
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
        },
        slideSubtitle: {
            fontSize: 18,
            color: "rgba(255, 255, 255, 0.95)",
            textAlign: "center",
            lineHeight: 28,
            fontWeight: "400",
            textShadowColor: "rgba(0, 0, 0, 0.2)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
        },
        footer: {
            paddingHorizontal: 20,
            paddingBottom: 40,
            paddingTop: 20,
        },
        progressContainer: {
            marginBottom: 30,
            alignItems: "center",
        },
        modernProgressBar: {
            width: "60%",
            height: 6,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: 3,
            overflow: "hidden",
            marginBottom: 12,
        },
        modernProgressFill: {
            height: "100%",
            borderRadius: 3,
            shadowColor: "#4facfe",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 4,
        },
        pageIndicator: {
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: 14,
            fontWeight: "600",
            letterSpacing: 1,
        },
        navigationContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        navButton: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.2)",
        },
        navButtonDisabled: {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderColor: "rgba(255, 255, 255, 0.1)",
        },
        backButton: {},
        nextButton: {
            borderRadius: 28,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 12,
        },
        nextButtonGradient: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            paddingVertical: 18,
            gap: 8,
            minWidth: 140,
        },
        nextButtonText: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "700",
            letterSpacing: 0.5,
        },
        // Модальное окно языков
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
        },
        modalContainer: {
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            width: "100%",
            maxWidth: 400,
            maxHeight: "70%",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 20,
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#F0F0F0",
            backgroundColor: "#FAFAFA",
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: "700",
            color: "#333",
        },
        modalCloseButton: {
            padding: 4,
        },
        languageList: {
            maxHeight: 300,
        },
        languageItem: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#F5F5F5",
        },
        languageItemSelected: {
            backgroundColor: "#F0F8FF",
            borderBottomColor: "#E6F3FF",
        },
        languageFlag: {
            fontSize: 24,
            marginRight: 16,
        },
        languageInfo: {
            flex: 1,
        },
        languageName: {
            fontSize: 16,
            fontWeight: "600",
            color: "#333",
            marginBottom: 2,
        },
        languageNameSelected: {
            color: "#4facfe",
        },
        languageCode: {
            fontSize: 14,
            color: "#666",
        },
        languageCodeSelected: {
            color: "#4facfe",
        },
    });

export default OnboardingScreen;