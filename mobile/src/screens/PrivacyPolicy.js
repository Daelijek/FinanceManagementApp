import React, { useContext } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";

const PrivacyPolicy = () => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    return (
        <SafeAreaView style={styles.content}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                bounces={false}
                overScrollMode="never"
                showsVerticalScrollIndicator={false}
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
                            <Text style={styles.firstText}>{t('privacy_policy.last_updated')}</Text>
                        </View>

                        <View style={styles.secondBlock}>
                            <Text style={styles.secondText}>
                                {t('privacy_policy.intro')}
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
                                <Text style={styles.thirdTitle}>{t('privacy_policy.info_collect')}</Text>
                            </View>
                            <View style={styles.thirdBody}>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.personal_info')}</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.financial_info')}</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.device_info')}</Text>
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
                                <Text style={styles.thirdTitle}>{t('privacy_policy.how_use')}</Text>
                            </View>
                            <View style={styles.thirdBody}>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.provide_service')}</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.notify_changes')}</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.customer_support')}</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.detect_issues')}</Text>
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
                                <Text style={styles.fourthTitle}>{t('privacy_policy.data_security')}</Text>
                            </View>
                            <Text style={styles.fourthText}>
                                {t('privacy_policy.security_intro')}
                            </Text>
                            <View style={styles.fourthBody}>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.encryption')}</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.security_assessments')}</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.secure_storage')}</Text>
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
                                <Text style={styles.fifthTitle}>{t('privacy_policy.your_rights')}</Text>
                            </View>
                            <Text style={styles.fifthText}>{t('privacy_policy.rights_intro')}</Text>
                            <View style={styles.fourthBody}>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.access_data')}</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.correct_data')}</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.delete_data')}</Text>
                                </View>
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.bulletText}>{t('privacy_policy.withdraw_consent')}</Text>
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
                                <Text style={styles.sixthTitle}>{t('privacy_policy.contact_us')}</Text>
                            </View>
                            <Text style={styles.sixthText}>{t('privacy_policy.contact_intro')}</Text>
                            <Text style={styles.sixthText}>{t('privacy_policy.contact_email')}</Text>
                            <Text style={styles.sixthText}>{t('privacy_policy.contact_phone')}</Text>
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