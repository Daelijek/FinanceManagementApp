import React, { useContext, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TextInput } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { ThemeContext } from "../context/ThemeContext";

const API_URL = "https://555e-85-159-27-203.ngrok-free.app";

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    const handleSendReset = async () => {
        if (!email) {
            return Alert.alert("Ошибка", "Пожалуйста, введите ваш email.");
        }
        try {
            const response = await fetch(
                `${API_URL}/api/v1/auth/password-reset/request`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                }
            );
            const raw = await response.text();
            let data = null;
            try { data = JSON.parse(raw); } catch { }
            if (response.ok) {
                Alert.alert(
                    "Успех",
                    "Если этот email зарегистрирован, на него придёт письмо со ссылкой."
                );
                return navigation.navigate("PasswordResetConfirm", { email });
            }
            const detail = data?.detail;
            let msg = "";
            if (Array.isArray(detail)) {
                msg = detail.map(e => e.msg).join("\n");
            } else if (typeof detail === "string") {
                msg = detail;
            } else {
                msg = raw || "Неизвестная ошибка.";
            }
            Alert.alert("Ошибка", msg);
        } catch (e) {
            console.error(e);
            Alert.alert("Ошибка сети", "Не удалось подключиться к серверу.");
        }
    };

    // Общие пропсы для всех TextInput
    const commonInputProps = {
        mode: "outlined",
        outlineColor: isDark ? "#374151" : "#E5E7EB",
        activeOutlineColor: "#2563EB",
        textColor: isDark ? "#F9FAFB" : "#000000",
        placeholderTextColor: "#9CA3AF",
        style: styles.input,
        theme: { roundness: 12 },
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Password Recovery</Text>
                <Text style={styles.titleLable}>
                    Enter your email to receive a link or a reset code.
                </Text>
                <View style={styles.formArea}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            {...commonInputProps}
                            placeholder="Your e-mail"
                            value={email}
                            onChangeText={setEmail}
                            left={<TextInput.Icon icon="email-outline" color="gray" />}
                        />
                    </View>
                </View>
                <TouchableOpacity onPress={handleSendReset} style={styles.shadow}>
                    <LinearGradient
                        colors={["#2563EB", "#2563EB"]}
                        style={styles.button}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.buttonTitle}>Send code</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            <View style={styles.footer}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.signUpButton}>← Back to Login</Text>
                </TouchableOpacity>
            </View>
            <StatusBar style="auto" />
        </SafeAreaView>
    );
};

const getThemedStyles = isDark =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            justifyContent: "space-between",
            paddingVertical: 40,
            paddingHorizontal: 20,
        },
        content: { flex: 1, justifyContent: "center" },
        title: {
            textAlign: "center",
            fontWeight: "600",
            fontSize: 24,
            marginBottom: 8,
            color: isDark ? "#FFFFFF" : "#000000",
        },
        titleLable: {
            fontWeight: "500",
            fontSize: 16,
            textAlign: "center",
            color: isDark ? "#9CA3AF" : "#4B5563",
            marginBottom: 32,
        },
        formArea: { width: "100%", alignItems: "center", marginBottom: 16 },
        inputContainer: { width: "80%" },
        input: {
            backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
            width: "100%",
            height: 50,
            fontSize: 16,
            paddingHorizontal: 10,
            borderRadius: 8,
        },
        button: {
            paddingVertical: 15,
            borderRadius: 12,
            height: 50,
            alignItems: "center",
            width: "80%",
        },
        buttonTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
        shadow: {
            width: "100%",
            alignItems: "center",
            shadowColor: "#3B82F6",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 6,
            marginTop: 20,
        },
        footer: { alignItems: "center" },
        signUpButton: { color: "#2563EB", fontWeight: "500", fontSize: 16 },
    });

export default ForgotPasswordScreen;