import React, { useContext, version } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";

const ProfileScreen = ({ navigation }) => {
  const onPrivacyPolicy = () => navigation.navigate("Privacy Policy")
  const onAppSettings = () => navigation.navigate("App Settings")
  const onPersonalInformation = () => navigation.navigate("Personal Information")

  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false} // Отключает эффект перетягивания вверх/вниз на iOS
        overScrollMode="never" // Отключает overscroll на Android
        showsVerticalScrollIndicator={false} // Скрывает полосу прокрутки
      >
        <LinearGradient
          colors={["#3B82F6", "#3B82F6"]} // Градиентный фон
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.containerInner}>
            <Image
              source={require("../../assets/walter.png")}
              style={styles.headerImg}
            />
            <Text style={styles.headerText}>Walter White</Text>
            <Text style={styles.headerLabel}>walter.white@gmail.com</Text>
            <Text style={styles.headerRole}>Premium Member</Text>
          </View>
        </LinearGradient>
        <View style={styles.cardsBkg}>
          <View style={styles.card}>
            <View style={styles.cardGroup}>
              <Image
                style={styles.cardImg}
                source={require("../../assets/ProfileBalance.png")}
              />
              <Text style={styles.cardText}>Balance</Text>
            </View>
            <Text style={styles.cardInfo}>$12,580</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardGroup}>
              <Image
                style={styles.cardImg}
                source={require("../../assets/ProfileSavings.png")}
              />
              <Text style={styles.cardText}>Savings</Text>
            </View>
            <Text style={styles.cardInfo}>$2,840</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardGroup}>
              <Image
                style={styles.cardImg}
                source={require("../../assets/ProfileCredit.png")}
              />
              <Text style={styles.cardText}>Credit Score</Text>
            </View>
            <Text style={styles.cardInfo}>785</Text>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.accountSettings}>
          <Text style={styles.accountSettingsTitle}>Account Settings</Text>
          <View style={styles.accountSettingsGroup}>
            <TouchableOpacity onPress={onPersonalInformation} style={styles.settingItem}>
              <View style={styles.itemGroup}>
                <Ionicons name="person-outline" size={24} color="#3B82F6" />
                <Text style={styles.settingText}>Personal Information</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                color="#94A3B8"
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.itemGroup}>
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color="#3B82F6"
                />
                <Text style={styles.settingText}>Security & Privacy</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                color="#94A3B8"
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.itemGroup}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#3B82F6"
                />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                color="#94A3B8"
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingBorderlessItem}>
              <View style={styles.itemGroup}>
                <Ionicons name="card-outline" size={24} color="#3B82F6" />
                <Text style={styles.settingText}>Connected Accounts</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                color="#94A3B8"
                style={styles.chevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/*Preferences */}
        <View style={styles.preferences}>
          <Text style={styles.preferencesTitle}>Preferences</Text>
          <View style={styles.preferencesGroup}>
            <TouchableOpacity style={styles.preferencesItem}>
              <View style={styles.itemGroup}>
                <Ionicons name="cash-outline" size={24} color="#3B82F6" />
                <Text style={styles.settingText}>Currency</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                color="#94A3B8"
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.preferencesItem}>
              <View style={styles.itemGroup}>
                <Ionicons name="language" size={24} color="#3B82F6" />
                <Text style={styles.settingText}>Language</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                color="#94A3B8"
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.preferencesItem} onPress={onAppSettings}>
              <View style={styles.itemGroup}>
                <Ionicons name="settings-outline" size={24} color="#3B82F6" />
                <Text style={styles.settingText}>App Settings</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                color="#94A3B8"
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingBorderlessItem}>
              <View style={styles.itemGroup}>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color="#3B82F6"
                />
                <Text style={styles.settingText}>Budget Categories</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                color="#94A3B8"
                style={styles.chevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/*Support & Help */}
        <View style={styles.preferences}>
          <Text style={styles.preferencesTitle}>Support & Help</Text>
          <View style={styles.preferencesGroup}>
            <TouchableOpacity style={styles.preferencesItem}>
              <View style={styles.itemGroup}>
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color="#3B82F6"
                />
                <Text style={styles.settingText}>Help Center</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                color="#94A3B8"
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.preferencesItem} onPress={onPrivacyPolicy}>
              <View style={styles.itemGroup}>
                <Ionicons name="shield-outline" size={24} color="#3B82F6" />
                <Text style={styles.settingText}>Privacy Policy</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                color="#94A3B8"
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingBorderlessItem}>
              <View style={styles.itemGroup}>
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color="#3B82F6"
                />
                <Text style={styles.settingText}>About App</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                color="#94A3B8"
                style={styles.chevron}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.version}>
            <Text style={styles.versionTitle}>Versoin 2.4.1</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
    },
    scrollContainer: {
      flexGrow: 1,
    },
    header: {
      height: 270,
      justifyContent: "center",
      alignItems: "center",
    },
    headerImg: {
      margin: "auto",
      width: 120,
      height: 120,
      borderRadius: "50%",
      borderWidth: 4,
      borderColor: "#FFFFFF",
      marginBottom: 16,
    },
    headerText: {
      margin: "auto",
      fontWeight: 700,
      fontSize: 20,
      color: "#fff",
      marginBottom: 4,
    },
    headerLabel: {
      margin: "auto",
      fontWeight: 500,
      fontSize: 16,
      color: "#DBEAFE",
      marginBottom: 8,
    },
    headerRole: {
      margin: "auto",
      fontWeight: 500,
      fontSize: 14,
      color: "#fff",
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: "#60A5FA4D",
      borderRadius: 100,
    },
    cardsBkg: {
      backgroundColor: isDark ? "#1E293B" : "#F9FAFB",
      height: 180,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingHorizontal: 5,
    },
    card: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      width: "28%",
      height: "80%",
      borderRadius: 12,
      padding: 16,
      justifyContent: "space-around",
    },
    cardImg: {
      width: 30,
      height: 24,
    },
    cardText: {
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#E5E7EB" : "#4B5563",
      marginTop: 10,
    },
    cardInfo: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    accountSettings: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 20,
    },
    accountSettingsTitle: {
      color: isDark ? "#F3F4F6" : "#000000",
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 17,
    },
    accountSettingsGroup: {
      alignItems: "center",
    },
    settingItem: {
      width: "95%",
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      height: 57,
      borderBottomWidth: 1,
      borderColor: isDark ? "#374151" : "#F3F4F6",
      justifyContent: "space-between",
    },
    settingBorderlessItem: {
      width: "95%",
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      height: 57,
      justifyContent: "space-between",
    },
    itemGroup: {
      flexDirection: "row",
      alignItems: "center",
    },
    settingText: {
      marginLeft: 12,
      color: isDark ? "#F9FAFB" : "#000000",
    },
    preferences: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 20,
    },
    preferencesTitle: {
      color: isDark ? "#F3F4F6" : "#000000",
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 17,
    },
    preferencesGroup: {
      alignItems: "center",
    },
    preferencesItem: {
      width: "95%",
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      height: 57,
      borderBottomWidth: 1,
      borderColor: isDark ? "#374151" : "#F3F4F6",
      justifyContent: "space-between",
    },
    version: {
      marginTop: 50,
      alignSelf: "center",
    },
    versionTitle: {
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
  });

export default ProfileScreen;
