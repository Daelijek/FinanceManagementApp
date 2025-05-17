import React from "react";
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

const LoginScreen = ({ navigation }) => {
  const pressedButton = () => navigation.navigate("Profile");
  const handleForgotPass = () => console.log("Forgot password pressed");
  const handleSignUp = () => navigation.navigate("Registration");
  const handleGoogleLogin = () => console.log("Google login pressed");
  const handleAppleLogin = () => console.log("Apple login pressed");

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
              <TouchableOpacity onPress={handleForgotPass}>
                <Text style={styles.label} nativeID="labelPassword">
                  Forgot password?
                </Text>
              </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-around",
  },
  icon: {
    backgroundColor: "#EFF6FF",
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
    fontWeight: 600,
    fontSize: 24,
    marginBottom: 8,
  },
  titleLable: {
    fontWeight: 500,
    fontSize: 16,
    textAlign: "center",
    color: "#4B5563",
    marginBottom: 32,
  },
  formArea: {
    width: "100%",
    alignItems: "center", // Center the input
    marginBottom: 16,
  },
  inputContainer: {
    width: "80%", // Sets width for the input container
  },
  label: {
    textAlign: "right",
    marginTop: 16,
    fontSize: 14,
    fontWeight: "500", // Fix fontWeight issue
    color: "#2563EB",
  },
  input: {
    backgroundColor: "#f9fafb", // Keeps custom background color
    width: "100%",
    height: 50,
    fontSize: 16,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    width: "80%",
  },
  buttonTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  shadow: {
    width: "100%",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 10 }, // Смещение тени
    shadowOpacity: 0.3, // Прозрачность тени
    shadowRadius: 15, // Размытие тени
    elevation: 6, // Тень для Android
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
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },
  contentGroup: {
    flexDirection: "row",
    margin: "auto",
    alignItems: "center",
  },
  socialText: {
    fontWeight: 500,
    fontSize: 16,
    marginLeft: 8,
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
    fontWeight: 500,
    fontSize: 16,
    textAlign: "center",
    color: "#4B5563",
  },
  signUpButton: {
    color: "#2563EB",
    fontWeight: 500,
    fontSize: 16,
  },
});

export default LoginScreen;
