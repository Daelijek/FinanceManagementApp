import React, { useContext, version } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TextInput } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { ThemeContext } from "../context/ThemeContext";

const Registration = ({ navigation }) => {
  const pressedButton = () => navigation.navigate("Login");
  const handleGoogleLogin = () => console.log("Google login pressed");
  const handleAppleLogin = () => console.log("Apple login pressed");
  const handlePrivacyPolicy = () => navigation.navigate("PrivacyPolicy");

  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Start Your Financial Journey</Text>
        <Text style={styles.titleLable}>
          Join millions managing their money smarter
        </Text>

        {/* Full Name */}
        <View style={styles.formArea}>
          <View style={styles.inputContainer}>
            <Text style={styles.label} nativeID="labelFullName">
              Full Name
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              aria-labelledby="labelFullName"
              left={<TextInput.Icon icon="account-outline" color="gray" />}
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

        {/* Email Address */}
        <View style={styles.formArea}>
          <View style={styles.inputContainer}>
            <Text style={styles.label} nativeID="labelEmail">
              Email Address
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
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
            <Text style={styles.label} nativeID="labelPassword">
              Password
            </Text>
            <TextInput
              mode="outlined"
              secureTextEntry={true}
              placeholder="Create password"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
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
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.formArea}>
          <View style={styles.inputContainer}>
            <Text style={styles.label} nativeID="labelConfirmPassword">
              Confirm Password
            </Text>
            <TextInput
              mode="outlined"
              secureTextEntry={true}
              placeholder="Confirm password"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              aria-labelledby="labelConfirmPassword"
              left={<TextInput.Icon icon="lock-check-outline" color="gray" />}
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

        {/*Create Account Button*/}
        <TouchableOpacity onPress={pressedButton} style={styles.shadow}>
          <LinearGradient
            colors={["#2563EB", "#2563EB"]}
            style={styles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonTitle}>Create Account</Text>
          </LinearGradient>
        </TouchableOpacity>
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
          <View style={styles.security}>
            <View style={styles.securityGroup}>
              <Image
                style={styles.securityImg}
                source={require("../../assets/security.png")}
              />
              <Text style={styles.securityText}>
                Your data is secure with 256-bit encryption
              </Text>
            </View>
          </View>
          <View style={styles.signIn}>
            <View style={styles.signInGroup}>
              <Text style={styles.signInText}>Already have an account?</Text>
              <TouchableOpacity onPress={pressedButton}>
                <Text style={styles.signInButton}> Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.policy}>
            <View style={styles.policyGroup}>
              <Text style={styles.policyText}>
                By signing up, you agree to our Terms of Service and{" "}
              </Text>
              <TouchableOpacity onPress={handlePrivacyPolicy}>
                <Text style={styles.policyButton}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
      justifyContent: "space-between",
    },
    content: {
      paddingTop: 70,
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
      textAlign: "left",
      marginBottom: 8,
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#E5E7EB" : "#374151",
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
      paddingHorizontal: 20,
      borderRadius: 12,
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
      height: "30%",
    },
    secondContainer: {
      width: "80%",
      margin: "auto",
      flex: 1,
      justifyContent: "space-between",
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
    security: {
      width: "100%",
      backgroundColor: isDark ? "#1E40AF" : "#EFF6FF",
      borderRadius: 12,
      height: 50,
      alignItems: "center",
      justifyContent: "center",
    },
    securityGroup: {
      alignItems: "center",
      flexDirection: "row",
      margin: "auto",
    },
    securityImg: {
      width: 20,
      height: 20,
    },
    securityText: {
      color: isDark ? "#D1D5DB" : "#4B5563",
      fontWeight: "500",
      fontSize: 14,
      textAlign: "center",
      marginLeft: 5,
    },
    signIn: {},
    signInGroup: {
      alignItems: "center",
      margin: "auto",
      flexDirection: "row",
    },
    signInText: {
      fontWeight: "500",
      fontSize: 16,
      textAlign: "center",
      color: isDark ? "#9CA3AF" : "#4B5563",
    },
    signInButton: {
      color: "#2563EB",
      fontWeight: "500",
      fontSize: 16,
    },
    policy: {},
    policyGroup: {
      alignItems: "center",
    },
    policyText: {
      color: isDark ? "#6B7280" : "#6B7280",
      fontSize: 12,
      fontWeight: "500",
    },
    policyButton: {
      color: "#2563EB",
      fontSize: 12,
      fontWeight: "500",
    },
  });

export default Registration;