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

const API_URL = "https://ba2f-85-159-27-203.ngrok-free.app";

const PasswordResetConfirmScreen = ({ navigation, route }) => {
    const { email } = route.params || {};
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    const handleConfirmReset = async () => {
        if (!token || !newPassword || !confirmPassword) {
            return Alert.alert("Ошибка", "Пожалуйста, заполните все поля.");
        }
        try {
            const response = await fetch(
                `${API_URL}/api/v1/auth/password-reset/confirm`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        token,
                        new_password: newPassword,
                        confirm_password: confirmPassword,
                    }),
                }
            );
            const raw = await response.text();
            let data = null;
            try { data = JSON.parse(raw); } catch { }
            if (response.ok) {
                Alert.alert("Успех", "Пароль успешно сброшен.");
                return navigation.navigate("Login");
            }
            // Ошибка валидации
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

    const commonInputProps = {
        mode: "outlined",
        outlineColor: isDark ? "#374151" : "#E5E7EB",
        activeOutlineColor: isDark ? "#2563EB" : "#2563EB",
        textColor: isDark ? "#F9FAFB" : "#000000",
        placeholderTextColor: isDark ? "#9CA3AF" : "#6B7280",
        theme: { roundness: 12 },
        style: styles.input,
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>New password</Text>
                <Text style={styles.titleLable}>
                    Enter the code and a new password for {email}
                </Text>

                <View style={styles.formArea}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            {...commonInputProps}
                            placeholder="The code from the email"
                            value={token}
                            onChangeText={setToken}
                            left={<TextInput.Icon icon="email-outline" color="gray" />}
                        />
                    </View>
                </View>

                <View style={styles.formArea}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            {...commonInputProps}
                            secureTextEntry
                            placeholder="New password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            left={<TextInput.Icon icon="lock-outline" color="gray" />}
                        />
                    </View>
                </View>

                <View style={styles.formArea}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            {...commonInputProps}
                            secureTextEntry
                            placeholder="Password Replay"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            left={<TextInput.Icon icon="lock-check-outline" color="gray" />}
                        />
                    </View>
                </View>

                <TouchableOpacity onPress={handleConfirmReset} style={styles.shadow}>
                    <LinearGradient
                        colors={["#2563EB", "#2563EB"]}
                        style={styles.button}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.buttonTitle}>Confirm</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            <View style={styles.footer}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.signUpButton}>← Back to Password Recovery</Text>
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
            color: isDark ? "#F9FAFB" : "#000000",
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

export default PasswordResetConfirmScreen;