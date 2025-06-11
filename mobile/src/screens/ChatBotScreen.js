// src/screens/ChatBotScreen.js

import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Easing,
    Alert,
    RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";

const screenWidth = Dimensions.get("window").width;

const ChatBotScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    // Chat state
    const [currentSession, setCurrentSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Animation references
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const inputScaleAnim = useRef(new Animated.Value(1)).current;
    const typingAnimRef = useRef(new Animated.Value(0)).current;
    const suggestionsAnim = useRef(new Animated.Value(1)).current;

    // Refs
    const scrollViewRef = useRef(null);
    const inputRef = useRef(null);
    const messageAnimations = useRef([]).current;

    // Initialize message animations
    const initializeMessageAnimation = (index) => {
        if (!messageAnimations[index]) {
            messageAnimations[index] = new Animated.Value(0);
        }
        return messageAnimations[index];
    };

    // Animate message appearance
    const animateNewMessage = useCallback((index) => {
        const anim = initializeMessageAnimation(index);

        Animated.sequence([
            Animated.timing(anim, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
            }),
            Animated.spring(anim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Typing indicator animation
    const startTypingAnimation = useCallback(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(typingAnimRef, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(typingAnimRef, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const stopTypingAnimation = useCallback(() => {
        typingAnimRef.stopAnimation();
        typingAnimRef.setValue(0);
    }, []);

    // Input animation
    const animateInput = useCallback((scale = 0.95) => {
        Animated.sequence([
            Animated.timing(inputScaleAnim, {
                toValue: scale,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(inputScaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Create or get active session
    const initializeSession = useCallback(async () => {
        setLoading(true);
        try {
            // Сначала пытаемся получить все сессии
            const sessionsResponse = await apiFetch("/api/v1/chat/sessions");

            if (sessionsResponse.ok) {
                const sessions = await sessionsResponse.json();
                console.log("📋 Available sessions:", sessions);

                // Ищем активную сессию
                const activeSession = sessions.find(session => session.is_active);

                if (activeSession) {
                    console.log("✅ Found active session:", activeSession.id);
                    await loadSession(activeSession.id);
                } else {
                    console.log("🆕 No active session found, creating new one");
                    await createNewSession();
                }
            } else {
                console.log("❌ Failed to get sessions, creating new one");
                await createNewSession();
            }
        } catch (error) {
            console.error("❌ Error initializing session:", error);
            await createNewSession();
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new session
    const createNewSession = useCallback(async () => {
        try {
            const response = await apiFetch("/api/v1/chat/sessions", {
                method: "POST",
                body: JSON.stringify({
                    title: "New Chat"
                }),
            });

            if (response.ok) {
                const session = await response.json();
                console.log("✅ Created new session:", session);
                setCurrentSession(session);
                setMessages([]);

                // Загружаем предложения для новой сессии
                await loadSuggestions(session.id);
                setShowSuggestions(true);
            } else {
                throw new Error("Failed to create session");
            }
        } catch (error) {
            console.error("❌ Error creating session:", error);
            Alert.alert(t('common.error'), t('chatbot.failed_to_create_session') || "Failed to create chat session");
        }
    }, [t]);

    // Load existing session
    const loadSession = useCallback(async (sessionId) => {
        try {
            const response = await apiFetch(`/api/v1/chat/sessions/${sessionId}`);

            if (response.ok) {
                const sessionData = await response.json();
                console.log("✅ Loaded session:", sessionData);

                setCurrentSession(sessionData);
                setMessages(sessionData.messages || []);

                // Если есть сообщения, скрываем предложения
                if (sessionData.messages && sessionData.messages.length > 0) {
                    setShowSuggestions(false);
                } else {
                    await loadSuggestions(sessionId);
                    setShowSuggestions(true);
                }
            } else {
                throw new Error("Failed to load session");
            }
        } catch (error) {
            console.error("❌ Error loading session:", error);
            await createNewSession();
        }
    }, [createNewSession]);

    // Load suggestions
    const loadSuggestions = useCallback(async (sessionId) => {
        if (!sessionId) return;

        setLoadingSuggestions(true);
        try {
            const response = await apiFetch(`/api/v1/chat/sessions/${sessionId}/suggestions`);

            if (response.ok) {
                const suggestionsData = await response.json();
                console.log("💡 Loaded suggestions:", suggestionsData);
                setSuggestions(suggestionsData || []);
            } else {
                console.warn("⚠️ Failed to load suggestions");
                setSuggestions([]);
            }
        } catch (error) {
            console.error("❌ Error loading suggestions:", error);
            setSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    }, []);

    // Send message
    const sendMessage = useCallback(async (text = inputText, isSuggestion = false) => {
        if (!text.trim() || !currentSession || sending) return;

        const messageContent = text.trim();
        console.log("📤 Sending message:", messageContent);

        // Добавляем пользовательское сообщение локально для UI
        const userMessage = {
            id: Date.now(),
            role: "user",
            content: messageContent,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText("");
        setSending(true);

        if (isSuggestion) {
            setShowSuggestions(false);
            Animated.timing(suggestionsAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }

        // Animate input
        animateInput();

        // Show typing indicator
        setIsTyping(true);
        startTypingAnimation();

        try {
            const response = await apiFetch(`/api/v1/chat/sessions/${currentSession.id}/messages`, {
                method: "POST",
                body: JSON.stringify({
                    content: messageContent
                }),
            });

            if (response.ok) {
                const botMessage = await response.json();
                console.log("✅ Received bot response:", botMessage);

                // Добавляем ответ бота
                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error("Failed to send message");
            }
        } catch (error) {
            console.error("❌ Error sending message:", error);

            // Добавляем сообщение об ошибке
            const errorMessage = {
                id: Date.now() + 1,
                role: "assistant",
                content: t('chatbot.error_message') || "Sorry, I'm having trouble responding right now. Please try again.",
                created_at: new Date().toISOString(),
            };

            setMessages(prev => [...prev, errorMessage]);

            Alert.alert(t('common.error'), t('chatbot.failed_to_send') || "Failed to send message. Please try again.");
        } finally {
            setIsTyping(false);
            stopTypingAnimation();
            setSending(false);
        }
    }, [inputText, currentSession, sending, animateInput, startTypingAnimation, stopTypingAnimation, t]);

    // Handle suggestion tap
    const handleSuggestionTap = useCallback((suggestion) => {
        sendMessage(suggestion, true);
    }, [sendMessage]);

    // Clear chat (create new session)
    const clearChat = useCallback(() => {
        Alert.alert(
            t('chatbot.new_chat') || "New Chat",
            t('chatbot.new_chat_confirm') || "Start a new chat session? Current conversation will be saved.",
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('chatbot.new_chat') || "New Chat",
                    onPress: async () => {
                        await createNewSession();
                        setShowSuggestions(true);
                        Animated.timing(suggestionsAnim, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: true,
                        }).start();
                    }
                }
            ]
        );
    }, [t, createNewSession]);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, []);

    // Refresh chat
    const onRefresh = useCallback(async () => {
        if (!currentSession) return;

        setRefreshing(true);
        await loadSession(currentSession.id);
        setRefreshing(false);
    }, [currentSession, loadSession]);

    // Initialize on mount
    useEffect(() => {
        // Welcome animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.back(1.1)),
                useNativeDriver: true,
            }),
        ]).start();

        // Initialize session
        initializeSession();
    }, [initializeSession]);

    // Auto scroll when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
            // Animate last message
            animateNewMessage(messages.length - 1);
        }
    }, [messages, scrollToBottom, animateNewMessage]);

    // Message bubble component
    const MessageBubble = ({ message, index }) => {
        const anim = initializeMessageAnimation(index);
        const isBot = message.role === "assistant";

        return (
            <Animated.View
                style={[
                    styles.messageContainer,
                    isBot ? styles.botMessageContainer : styles.userMessageContainer,
                    {
                        transform: [
                            {
                                scale: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1],
                                }),
                            },
                            {
                                translateY: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0],
                                }),
                            },
                        ],
                        opacity: anim,
                    },
                ]}
            >
                {isBot && (
                    <View style={styles.botAvatar}>
                        <LinearGradient
                            colors={["#2563EB", "#3B82F6"]}
                            style={styles.avatarGradient}
                        >
                            <MaterialCommunityIcons name="robot" size={16} color="#FFFFFF" />
                        </LinearGradient>
                    </View>
                )}

                <View style={[
                    styles.messageBubble,
                    isBot ? styles.botBubble : styles.userBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isBot ? styles.botMessageText : styles.userMessageText
                    ]}>
                        {message.content}
                    </Text>

                    <Text style={[
                        styles.timestamp,
                        isBot ? styles.botTimestamp : styles.userTimestamp
                    ]}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </Animated.View>
        );
    };

    // Typing indicator component
    const TypingIndicator = () => (
        <Animated.View style={[
            styles.messageContainer,
            styles.botMessageContainer,
            { opacity: isTyping ? 1 : 0 }
        ]}>
            <View style={styles.botAvatar}>
                <LinearGradient
                    colors={["#2563EB", "#3B82F6"]}
                    style={styles.avatarGradient}
                >
                    <MaterialCommunityIcons name="robot" size={16} color="#FFFFFF" />
                </LinearGradient>
            </View>

            <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                <View style={styles.typingIndicator}>
                    {[0, 1, 2].map((index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.typingDot,
                                {
                                    opacity: typingAnimRef.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.3, 1],
                                    }),
                                    transform: [
                                        {
                                            scale: typingAnimRef.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.8, 1.2],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                    ))}
                </View>
            </View>
        </Animated.View>
    );

    // Suggestions component
    const SuggestionsComponent = () => (
        <Animated.View
            style={[
                styles.suggestionsContainer,
                {
                    opacity: suggestionsAnim,
                    transform: [
                        {
                            translateY: suggestionsAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                            }),
                        },
                    ],
                },
            ]}
        >
            <Text style={styles.suggestionsTitle}>
                {t('chatbot.suggested_questions') || "Here are some things you can ask me:"}
            </Text>

            {loadingSuggestions ? (
                <View style={styles.suggestionsLoading}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={styles.suggestionsLoadingText}>
                        {t('chatbot.loading_suggestions') || "Loading suggestions..."}
                    </Text>
                </View>
            ) : (
                <View style={styles.suggestionsGrid}>
                    {suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.suggestionButton}
                            onPress={() => handleSuggestionTap(suggestion)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </Animated.View>
    );

    // Loading screen
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>
                        {t('chatbot.initializing') || "Initializing chat..."}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
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
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={isDark ? "#F9FAFB" : "#111827"} />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <View style={styles.headerBot}>
                            <LinearGradient
                                colors={["#2563EB", "#3B82F6"]}
                                style={styles.headerBotAvatar}
                            >
                                <MaterialCommunityIcons name="robot" size={20} color="#FFFFFF" />
                            </LinearGradient>
                            <View style={styles.onlineIndicator} />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>
                                {t('chatbot.financial_assistant') || "Financial Assistant"}
                            </Text>
                            <Text style={styles.headerSubtitle}>
                                {isTyping ? (t('chatbot.typing') || "Typing...") : (t('chatbot.online') || "Online")}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearChat}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add-outline" size={20} color={isDark ? "#F9FAFB" : "#111827"} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Messages */}
                <Animated.View style={[styles.messagesContainer, { opacity: fadeAnim }]}>
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesScrollView}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={isDark ? "#FFFFFF" : "#000000"}
                            />
                        }
                    >
                        {/* Welcome Message */}
                        {messages.length === 0 && !loading && (
                            <View style={styles.welcomeContainer}>
                                <LinearGradient
                                    colors={["#2563EB", "#3B82F6"]}
                                    style={styles.welcomeIcon}
                                >
                                    <MaterialCommunityIcons name="robot" size={32} color="#FFFFFF" />
                                </LinearGradient>
                                <Text style={styles.welcomeTitle}>
                                    {t('chatbot.welcome_title') || "Welcome to your Financial Assistant!"}
                                </Text>
                                <Text style={styles.welcomeSubtitle}>
                                    {t('chatbot.welcome_subtitle') || "I can help you with budgets, expenses, financial advice, and more. How can I assist you today?"}
                                </Text>
                            </View>
                        )}

                        {/* Messages */}
                        {messages.map((message, index) => (
                            <MessageBubble key={message.id} message={message} index={index} />
                        ))}

                        <TypingIndicator />

                        {/* Suggestions */}
                        {showSuggestions && suggestions.length > 0 && messages.length === 0 && (
                            <SuggestionsComponent />
                        )}

                        <View style={styles.messagesBottom} />
                    </ScrollView>
                </Animated.View>

                {/* Input */}
                <Animated.View
                    style={[
                        styles.inputContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { scale: inputScaleAnim },
                                {
                                    translateY: slideAnim.interpolate({
                                        inputRange: [0, 30],
                                        outputRange: [0, 30],
                                    })
                                }
                            ],
                        },
                    ]}
                >
                    <View style={styles.inputWrapper}>
                        <TextInput
                            ref={inputRef}
                            style={styles.textInput}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder={t('chatbot.type_message') || "Ask me about your finances..."}
                            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                            multiline
                            maxLength={1000}
                            onSubmitEditing={() => sendMessage()}
                            returnKeyType="send"
                            editable={!sending}
                        />

                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
                            ]}
                            onPress={() => sendMessage()}
                            activeOpacity={0.7}
                            disabled={!inputText.trim() || sending || isTyping}
                        >
                            <LinearGradient
                                colors={inputText.trim() && !sending ? ["#2563EB", "#3B82F6"] : [isDark ? "#374151" : "#E5E7EB", isDark ? "#374151" : "#E5E7EB"]}
                                style={styles.sendButtonGradient}
                            >
                                {sending ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Ionicons
                                        name="send"
                                        size={18}
                                        color={inputText.trim() ? "#FFFFFF" : (isDark ? "#6B7280" : "#9CA3AF")}
                                    />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputHint}>
                        {t('chatbot.input_hint') || "Ask about budgets, expenses, savings, or get financial advice"}
                    </Text>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const getThemedStyles = (isDark) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
        },
        loadingContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
        },
        loadingText: {
            marginTop: 16,
            fontSize: 16,
            color: isDark ? "#F9FAFB" : "#111827",
            textAlign: "center",
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#374151" : "#E5E7EB",
        },
        backButton: {
            padding: 8,
            marginRight: 12,
        },
        headerCenter: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
        },
        headerBot: {
            position: "relative",
            marginRight: 12,
        },
        headerBotAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
        },
        onlineIndicator: {
            position: "absolute",
            bottom: 2,
            right: 2,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#22C55E",
            borderWidth: 2,
            borderColor: isDark ? "#1F2937" : "#FFFFFF",
        },
        headerTitle: {
            fontSize: 16,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
            marginBottom: 2,
        },
        headerSubtitle: {
            fontSize: 12,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        clearButton: {
            padding: 8,
            marginLeft: 12,
        },
        messagesContainer: {
            flex: 1,
        },
        messagesScrollView: {
            flex: 1,
        },
        messagesContent: {
            paddingHorizontal: 20,
            paddingTop: 16,
        },
        messagesBottom: {
            height: 20,
        },
        welcomeContainer: {
            alignItems: "center",
            paddingVertical: 40,
            paddingHorizontal: 20,
        },
        welcomeIcon: {
            width: 64,
            height: 64,
            borderRadius: 32,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
        },
        welcomeTitle: {
            fontSize: 20,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
            textAlign: "center",
            marginBottom: 8,
        },
        welcomeSubtitle: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
            textAlign: "center",
            lineHeight: 20,
        },
        messageContainer: {
            flexDirection: "row",
            marginBottom: 16,
            alignItems: "flex-end",
        },
        botMessageContainer: {
            justifyContent: "flex-start",
        },
        userMessageContainer: {
            justifyContent: "flex-end",
        },
        botAvatar: {
            marginRight: 8,
            marginBottom: 4,
        },
        avatarGradient: {
            width: 32,
            height: 32,
            borderRadius: 16,
            justifyContent: "center",
            alignItems: "center",
        },
        messageBubble: {
            maxWidth: screenWidth * 0.75,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 20,
        },
        botBubble: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderBottomLeftRadius: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        userBubble: {
            backgroundColor: "#2563EB",
            borderBottomRightRadius: 8,
            marginLeft: 'auto',
        },
        typingBubble: {
            paddingVertical: 16,
        },
        messageText: {
            fontSize: 15,
            lineHeight: 20,
        },
        botMessageText: {
            color: isDark ? "#F9FAFB" : "#111827",
        },
        userMessageText: {
            color: "#FFFFFF",
        },
        timestamp: {
            fontSize: 11,
            marginTop: 4,
        },
        botTimestamp: {
            color: isDark ? "#6B7280" : "#9CA3AF",
        },
        userTimestamp: {
            color: "rgba(255, 255, 255, 0.7)",
        },
        typingIndicator: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
        },
        typingDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isDark ? "#9CA3AF" : "#6B7280",
        },
        suggestionsContainer: {
            marginTop: 20,
            marginBottom: 10,
        },
        suggestionsTitle: {
            fontSize: 14,
            fontWeight: "500",
            color: isDark ? "#9CA3AF" : "#6B7280",
            marginBottom: 12,
            textAlign: "center",
        },
        suggestionsLoading: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 20,
            gap: 8,
        },
        suggestionsLoadingText: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        suggestionsGrid: {
            gap: 8,
        },
        suggestionButton: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? "#374151" : "#E5E7EB",
            marginBottom: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        suggestionText: {
            fontSize: 14,
            color: isDark ? "#F9FAFB" : "#111827",
            fontWeight: "500",
            textAlign: "center",
        },
        inputContainer: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: isDark ? "#374151" : "#E5E7EB",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
        },
        inputWrapper: {
            flexDirection: "row",
            alignItems: "flex-end",
            backgroundColor: isDark ? "#374151" : "#F3F4F6",
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginBottom: 8,
        },
        textInput: {
            flex: 1,
            fontSize: 16,
            color: isDark ? "#F9FAFB" : "#111827",
            maxHeight: 100,
            paddingVertical: 8,
            paddingRight: 12,
        },
        sendButton: {
            marginLeft: 8,
        },
        sendButtonActive: {
            transform: [{ scale: 1 }],
        },
        sendButtonInactive: {
            transform: [{ scale: 0.9 }],
        },
        sendButtonGradient: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: "center",
            alignItems: "center",
        },
        inputHint: {
            fontSize: 12,
            color: isDark ? "#6B7280" : "#9CA3AF",
            textAlign: "center",
            paddingHorizontal: 20,
        },
    });

export default ChatBotScreen;