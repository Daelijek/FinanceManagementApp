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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";

const screenWidth = Dimensions.get("window").width;

const ChatBotScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    // Chat state
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);

    // Animation references
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const inputScaleAnim = useRef(new Animated.Value(1)).current;
    const typingAnimRef = useRef(new Animated.Value(0)).current;
    const quickRepliesAnim = useRef(new Animated.Value(1)).current;

    // Refs
    const scrollViewRef = useRef(null);
    const inputRef = useRef(null);
    const messageAnimations = useRef([]).current;

    // Welcome message and quick replies
    const welcomeMessage = {
        id: 'welcome',
        text: t('chatbot.welcome') || "Hi! I'm your financial assistant. How can I help you today?",
        isBot: true,
        timestamp: new Date(),
        type: 'text'
    };

    const quickReplies = [
        {
            id: 'budget',
            text: t('chatbot.check_budget') || "Check my budget",
            icon: "wallet-outline"
        },
        {
            id: 'expenses',
            text: t('chatbot.analyze_expenses') || "Analyze my expenses",
            icon: "analytics-outline"
        },
        {
            id: 'savings',
            text: t('chatbot.savings_tips') || "Savings tips",
            icon: "trending-up-outline"
        },
        {
            id: 'help',
            text: t('chatbot.help') || "Help & Support",
            icon: "help-circle-outline"
        }
    ];

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

    // Mock bot responses
    const getBotResponse = (userMessage) => {
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('budget')) {
            return {
                text: "Your current monthly budget is $2,500. You've used 68% of it this month. Would you like me to show you a detailed breakdown?",
                type: 'budget_info',
                data: { used: 68, remaining: 32, amount: 2500 }
            };
        } else if (lowerMessage.includes('expense')) {
            return {
                text: "I've analyzed your expenses. Your top spending categories are: Food (32%), Transportation (18%), and Entertainment (15%). Should I create a detailed report?",
                type: 'expense_analysis'
            };
        } else if (lowerMessage.includes('saving')) {
            return {
                text: "Here are some personalized savings tips:\n• Try the 50/30/20 rule\n• Reduce dining out by 2 times per week\n• Consider switching to a high-yield savings account\n\nWould you like more details on any of these?",
                type: 'savings_tips'
            };
        } else if (lowerMessage.includes('help')) {
            return {
                text: "I can help you with:\n• Budget tracking and analysis\n• Expense categorization\n• Financial goal planning\n• Savings recommendations\n• Transaction insights\n\nWhat would you like to explore?",
                type: 'help_menu'
            };
        } else {
            return {
                text: "I understand you're asking about your finances. Could you be more specific? For example, you can ask about your budget, expenses, savings, or get general help.",
                type: 'clarification'
            };
        }
    };

    // Send message
    const sendMessage = useCallback(async (text = inputText, isQuickReply = false) => {
        if (!text.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            text: text.trim(),
            isBot: false,
            timestamp: new Date(),
            type: 'text'
        };

        // Add user message
        setMessages(prev => [...prev, userMessage]);
        setInputText("");

        if (isQuickReply) {
            setShowQuickReplies(false);
            Animated.timing(quickRepliesAnim, {
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

        // Simulate bot thinking time
        setTimeout(() => {
            const botResponse = getBotResponse(text);
            const botMessage = {
                id: (Date.now() + 1).toString(),
                text: botResponse.text,
                isBot: true,
                timestamp: new Date(),
                type: botResponse.type,
                data: botResponse.data
            };

            setIsTyping(false);
            stopTypingAnimation();
            setMessages(prev => [...prev, botMessage]);
        }, 1500 + Math.random() * 1000); // Random delay for realism

    }, [inputText, animateInput, startTypingAnimation, stopTypingAnimation]);

    // Handle quick reply
    const handleQuickReply = useCallback((reply) => {
        sendMessage(reply.text, true);
    }, [sendMessage]);

    // Clear chat
    const clearChat = useCallback(() => {
        Alert.alert(
            t('chatbot.clear_chat') || "Clear Chat",
            t('chatbot.clear_chat_confirm') || "Are you sure you want to clear the chat history?",
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => {
                        setMessages([]);
                        setShowQuickReplies(true);
                        Animated.timing(quickRepliesAnim, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: true,
                        }).start();
                    }
                }
            ]
        );
    }, [t]);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, []);

    // Initialize
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

        // Add welcome message
        setTimeout(() => {
            setMessages([welcomeMessage]);
        }, 800);
    }, []);

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

        return (
            <Animated.View
                style={[
                    styles.messageContainer,
                    message.isBot ? styles.botMessageContainer : styles.userMessageContainer,
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
                {message.isBot && (
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
                    message.isBot ? styles.botBubble : styles.userBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        message.isBot ? styles.botMessageText : styles.userMessageText
                    ]}>
                        {message.text}
                    </Text>

                    {message.type === 'budget_info' && message.data && (
                        <View style={styles.budgetInfoCard}>
                            <View style={styles.budgetProgressContainer}>
                                <View style={styles.budgetProgressBg}>
                                    <View
                                        style={[
                                            styles.budgetProgressFill,
                                            { width: `${message.data.used}%` }
                                        ]}
                                    />
                                </View>
                            </View>
                            <Text style={styles.budgetInfoText}>
                                ${(message.data.amount * message.data.used / 100).toFixed(0)} used of ${message.data.amount}
                            </Text>
                        </View>
                    )}

                    <Text style={[
                        styles.timestamp,
                        message.isBot ? styles.botTimestamp : styles.userTimestamp
                    ]}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

    // Quick replies component
    const QuickReplies = () => (
        <Animated.View
            style={[
                styles.quickRepliesContainer,
                {
                    opacity: quickRepliesAnim,
                    transform: [
                        {
                            translateY: quickRepliesAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                            }),
                        },
                    ],
                },
            ]}
        >
            <Text style={styles.quickRepliesTitle}>
                {t('chatbot.quick_questions') || "Quick questions:"}
            </Text>
            <View style={styles.quickRepliesGrid}>
                {quickReplies.map((reply, index) => (
                    <TouchableOpacity
                        key={reply.id}
                        style={styles.quickReplyButton}
                        onPress={() => handleQuickReply(reply)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name={reply.icon} size={18} color="#2563EB" />
                        <Text style={styles.quickReplyText}>{reply.text}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );

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
                        <Ionicons name="trash-outline" size={20} color={isDark ? "#F9FAFB" : "#111827"} />
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
                    >
                        {messages.map((message, index) => (
                            <MessageBubble key={message.id} message={message} index={index} />
                        ))}

                        <TypingIndicator />

                        {showQuickReplies && messages.length === 1 && <QuickReplies />}

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
                            placeholder={t('chatbot.type_message') || "Type your message..."}
                            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                            multiline
                            maxLength={500}
                            onSubmitEditing={() => sendMessage()}
                            returnKeyType="send"
                        />

                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
                            ]}
                            onPress={() => sendMessage()}
                            activeOpacity={0.7}
                            disabled={!inputText.trim() || isTyping}
                        >
                            <LinearGradient
                                colors={inputText.trim() ? ["#2563EB", "#3B82F6"] : [isDark ? "#374151" : "#E5E7EB", isDark ? "#374151" : "#E5E7EB"]}
                                style={styles.sendButtonGradient}
                            >
                                {isLoading ? (
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
                        {t('chatbot.input_hint') || "Ask about budgets, expenses, savings, or get help"}
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
        budgetInfoCard: {
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: isDark ? "#374151" : "#E5E7EB",
        },
        budgetProgressContainer: {
            marginBottom: 8,
        },
        budgetProgressBg: {
            height: 6,
            backgroundColor: isDark ? "#374151" : "#E5E7EB",
            borderRadius: 3,
            overflow: "hidden",
        },
        budgetProgressFill: {
            height: "100%",
            backgroundColor: "#2563EB",
            borderRadius: 3,
        },
        budgetInfoText: {
            fontSize: 12,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        quickRepliesContainer: {
            marginTop: 20,
            marginBottom: 10,
        },
        quickRepliesTitle: {
            fontSize: 14,
            fontWeight: "500",
            color: isDark ? "#9CA3AF" : "#6B7280",
            marginBottom: 12,
        },
        quickRepliesGrid: {
            gap: 8,
        },
        quickReplyButton: {
            flexDirection: "row",
            alignItems: "center",
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
        quickReplyText: {
            fontSize: 14,
            color: isDark ? "#F9FAFB" : "#111827",
            marginLeft: 10,
            fontWeight: "500",
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