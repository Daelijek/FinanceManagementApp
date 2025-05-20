import React, { useContext, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TextInput } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { ThemeContext } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from '../config';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Ошибка", "Пожалуйста, заполните все поля.");
    }

    try {
      const response = await fetch(
        `${API_URL}/api/v1/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const rawBody = await response.text();
      console.log("HTTP", response.status, "raw body:", rawBody);

      let data = null;
      try {
        data = JSON.parse(rawBody);
      } catch {
        // Если не JSON — оставляем data = null
      }

      if (response.ok) {
        // Успешный вход
        console.log("Login successful:", data);

        if (data && data.access_token) {
          await AsyncStorage.setItem("token", data.access_token);
          const savedToken = await AsyncStorage.getItem("token");
          console.log("Проверка сохранённого токена:", savedToken);
          // При необходимости можно сохранить и refresh_token:
          // await AsyncStorage.setItem("refresh_token", data.refresh_token);
        } else {
          console.warn("Токен доступа не найден в ответе");
        }

        return navigation.navigate("MainPage");
      }

      let message = "";

      if (data && data.detail) {
        if (Array.isArray(data.detail)) {
          message = data.detail.map((e) => e.msg).join("\n");
        } else {
          message = data.detail;
        }
      } else {
        message = rawBody || "Неизвестная ошибка при входе.";
      }

      Alert.alert("Ошибка входа", message);
    } catch (networkError) {
      console.error("Network error during login:", networkError);
      Alert.alert("Ошибка сети", "Не удалось подключиться к серверу.");
    }
  };

  const pressedButton = () => navigation.navigate("Profile");
  const handleForgotPass = () => navigation.navigate("ForgotPassword");
  const handleSignUp = () => navigation.navigate("Registration");
  const handleGoogleLogin = () => console.log("Google login pressed");
  const handleAppleLogin = () => console.log("Apple login pressed");

  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

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
        <View style={styles.icon}>
          <Image
            source={require("../../assets/loginIcon.png")}
            style={{ width: 40, height: 40 }}
          />
        </View>
        <View style={styles.block}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.titleLable}>
            Manage your finances with confidence
          </Text>

          {/* Email Address */}
          <View style={styles.formArea}>
            <View style={styles.inputContainer}>
              <TextInput
                {...commonInputProps}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                aria-labelledby="labelEmail"
                left={<TextInput.Icon icon="email-outline" color="gray" />}
                theme={{
                  roundness: 12,
                  colors: {
                    primary: "#E5E7EB",
                    outline: "#E5E7EB",
                  },
                }}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.formArea}>
            <View style={styles.inputContainer}>
              <TextInput
                {...commonInputProps}
                secureTextEntry={true}
                placeholder="Create password"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                aria-labelledby="labelPassword"
                left={<TextInput.Icon icon="lock-outline" color="gray" />}
                theme={{
                  roundness: 12,
                  colors: {
                    primary: "#E5E7EB",
                    outline: "#E5E7EB",
                  },
                }}
              />
              <TouchableOpacity onPress={handleForgotPass}>
                <Text style={styles.label} nativeID="labelPassword">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/*Create Account Button*/}
          <TouchableOpacity onPress={handleLogin} style={styles.shadow}>
            <LinearGradient
              colors={["#2563EB", "#2563EB"]}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonTitle}>Sign in</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/*Second content */}
      <View style={styles.secondContent}>
        <View style={styles.secondContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
            <View>
              <Text
                style={{
                  marginHorizontal: 8,
                  textAlign: "center",
                  color: "#6B7280",
                }}
              >
                or continue with
              </Text>
            </View>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
          </View>
          <View style={styles.socialGroup}>
            <TouchableOpacity onPress={handleGoogleLogin} style={styles.social}>
              <View style={styles.contentGroup}>
                <Image
                  style={styles.socialImg}
                  source={require("../../assets/google.png")}
                />
                <Text style={styles.socialText}>Google</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAppleLogin} style={styles.social}>
              <View style={styles.contentGroup}>
                <Image
                  style={styles.socialImg}
                  source={require("../../assets/apple.png")}
                />
                <Text style={styles.socialText}>Apple</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.signUp}>
            <View style={styles.signUpGroup}>
              <Text style={styles.signUpText}>Don't have an account?</Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpButton}> Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.thirdContainer}></View>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

const getThemedStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
      justifyContent: "space-around",
    },
    icon: {
      backgroundColor: isDark ? "#1E3A8A" : "#EFF6FF",
      width: 64,
      height: 64,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      margin: "auto",
    },
    content: {
      paddingTop: 70,
      flex: 1,
      justifyContent: "space-around",
    },
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
    formArea: {
      width: "100%",
      alignItems: "center",
      marginBottom: 16,
    },
    inputContainer: {
      width: "80%",
    },
    label: {
      textAlign: "right",
      marginTop: 16,
      fontSize: 14,
      fontWeight: "500",
      color: "#2563EB", // оставим цвет брендовым
    },
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
      backgroundColor: "#2563EB",
    },
    buttonTitle: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
    shadow: {
      width: "100%",
      alignItems: "center",
      shadowColor: "#3B82F6",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 6,
    },
    secondContent: {
      height: "40%",
    },
    secondContainer: {
      width: "80%",
      margin: "auto",
      flex: 1,
      justifyContent: "space-around",
    },
    thirdContainer: {
      flex: 1,
    },
    socialGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    social: {
      width: 150,
      height: 50,
      borderWidth: 1,
      borderColor: isDark ? "#334155" : "#E5E7EB",
      borderRadius: 12,
      backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    contentGroup: {
      flexDirection: "row",
      margin: "auto",
      alignItems: "center",
    },
    socialText: {
      fontWeight: "500",
      fontSize: 16,
      marginLeft: 8,
      color: isDark ? "#F9FAFB" : "#000000",
    },
    socialImg: {
      width: 20,
      height: 20,
    },
    signUp: {},
    signUpGroup: {
      alignItems: "center",
      margin: "auto",
      flexDirection: "row",
    },
    signUpText: {
      fontWeight: "500",
      fontSize: 16,
      textAlign: "center",
      color: isDark ? "#9CA3AF" : "#4B5563",
    },
    signUpButton: {
      color: "#2563EB",
      fontWeight: "500",
      fontSize: 16,
    },
  });

export default LoginScreen;
