import React, { useContext } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";

const PrivacyPolicy = () => {

    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    return (
        <SafeAreaView style={styles.content}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                bounces={false} // Отключает эффект перетягивания вверх/вниз на iOS
                overScrollMode="never" // Отключает overscroll на Android
                showsVerticalScrollIndicator={false} // Скрывает полосу прокрутки
            >
                <View style={styles.screen}>
                    <View style={styles.screenInner}>

                        <View style={styles.firstBlock}>
                            <Ionicons
                                name="shield-checkmark"
                                size={35}
                                color={"#2563EB"}
                                style={styles.firstIcon}
                            />
                            <Text style={styles.firstText}>Last Updated: May 16, 2025</Text>
                        </View>

                        <View style={styles.secondBlock}>
                            <Text style={styles.secondText}>
                                We at FinanceApp are committed to protecting
                                your privacy. This Privacy Policy explains how
                                we collect, use, and safeguard your personal
                                information when you use our financial
                                management application.
                            </Text>
                        </View>

                        <View style={styles.thirdBlock}>
                            <View style={styles.thirdHead}>
                                <Ionicons
                                    name="information-circle"
                                    size={21}
                                    color={"#2563EB"}
                                    style={styles.thirdIcon}
                                />
                                <Text style={styles.thirdTitle}>Information We Collect</Text>
                            </View>
                            <View style={styles.thirdBody}>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>Personal identification information (name, email address, phone number)</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>Financial information (transaction history, account balances)</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>Device information and usage data</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.thirdBlock}>
                            <View style={styles.thirdHead}>
                                <Ionicons
                                    name="key"
                                    size={21}
                                    color={"#2563EB"}
                                    style={styles.thirdIcon}
                                />
                                <Text style={styles.thirdTitle}>How We Use Your Information</Text>
                            </View>
                            <View style={styles.thirdBody}>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>To provide and maintain our service </Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>To notify you about changes to our service</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>To provide customer support</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>To detect, prevent and address technical issues</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.fourthBlock}>
                            <View style={styles.fourthHead}>
                                <Ionicons
                                    name="lock-closed"
                                    size={21}
                                    color={"#2563EB"}
                                    style={styles.fourthIcon}
                                />
                                <Text style={styles.fourthTitle}>Data Security</Text>
                            </View>
                            <Text style={styles.fourthText}>
                                The security of your data is important to us. We
                                implement appropriate security measures to
                                protect your personal information, including:
                            </Text>
                            <View style={styles.fourthBody}>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>Encryption of sensitive data</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>Regular security assessments</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>Secure data storage systems</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.fifthBlock}>
                            <View style={styles.fifthHead}>
                                <Ionicons
                                    name="person"
                                    size={21}
                                    color={"#2563EB"}
                                    style={styles.fourthIcon}
                                />
                                <Text style={styles.fifthTitle}>Your Rights</Text>
                            </View>
                            <Text style={styles.fifthText}>You have the right to:</Text>
                            <View style={styles.fourthBody}>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>Access your personal data</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>Correct your personal data</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>Request deletion of your personal data</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>Withdraw your consent at any time</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.sixthBlock}>
                            <View style={styles.sixthHead}>
                                <Ionicons
                                    name="mail"
                                    size={21}
                                    color={"#2563EB"}
                                    style={styles.sixthIcon}
                                />
                                <Text style={styles.sixthTitle}>Contact Us</Text>
                            </View>
                            <Text style={styles.sixthText}>If you have any questions about this
                                Privacy Policy, please contact us:</Text>
                            <Text style={styles.sixthText}>Email: privacy@financeapp.com</Text>
                            <Text style={styles.sixthText}>Phone: +7 (708) 835-0549</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const getThemedStyles = (isDark) =>
    StyleSheet.create({
        content: {
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
        },

        screen: {
            flexGrow: 1,
        },

        screenInner: {
            paddingHorizontal: 25,
            paddingVertical: 25,
            paddingBottom: 100,
            display: "flex",
            flexDirection: "column",
            gap: 32,
        },

        firstBlock: {
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: 15,
        },

        firstIcon: {
            padding: 20,
            backgroundColor: isDark ? "#1E3A8A" : "#EFF6FF",
            borderRadius: 16,
        },

        firstText: {
            color: isDark ? "#9CA3AF" : "#6B7280",
            fontSize: 16,
        },

        secondText: {
            color: isDark ? "#D1D5DB" : "#4B5563",
            fontSize: 16,
        },

        thirdBlock: {
            display: "flex",
            flexDirection: "column",
            gap: 20,
        },

        thirdHead: {
            display: "flex",
            flexDirection: "row",
        },

        thirdTitle: {
            fontWeight: "600",
            fontSize: 16,
            width: "auto",
            marginLeft: 13,
            color: isDark ? "#F3F4F6" : "#000000",
        },

        listItem: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            marginBottom: 10,
        },

        bullet: {
            color: "#2563EB",
            fontSize: 30,
            marginRight: 10,
        },

        bulletText: {
            color: isDark ? "#E5E7EB" : "#4B5563",
            fontSize: 16,
            lineHeight: 24,
        },

        fourthBlock: {
            display: "flex",
            flexDirection: "column",
            gap: 20,
        },

        fourthHead: {
            display: "flex",
            flexDirection: "row",
        },

        fourthTitle: {
            fontWeight: "600",
            fontSize: 16,
            width: "auto",
            marginLeft: 13,
            color: isDark ? "#F3F4F6" : "#000000",
        },

        fourthText: {
            fontSize: 16,
            color: isDark ? "#D1D5DB" : "#4B5563",
        },

        fifthBlock: {
            display: "flex",
            flexDirection: "column",
            gap: 20,
        },

        fifthHead: {
            display: "flex",
            flexDirection: "row",
        },

        fifthTitle: {
            fontWeight: "600",
            fontSize: 16,
            width: "auto",
            marginLeft: 13,
            color: isDark ? "#F3F4F6" : "#000000",
        },

        fifthText: {
            fontSize: 16,
            color: isDark ? "#D1D5DB" : "#4B5563",
        },

        sixthBlock: {
            display: "flex",
            flexDirection: "column",
            gap: 20,
            padding: 25,
            backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
            borderRadius: 12,
        },

        sixthHead: {
            display: "flex",
            flexDirection: "row",
        },

        sixthTitle: {
            fontWeight: "600",
            fontSize: 16,
            width: "auto",
            marginLeft: 13,
            color: isDark ? "#F3F4F6" : "#000000",
        },

        sixthText: {
            fontSize: 16,
            color: isDark ? "#D1D5DB" : "#4B5563",
        },

        scrollContainer: {
            paddingBottom: 90,
        },
    });

export default PrivacyPolicy;