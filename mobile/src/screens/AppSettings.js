import React, { useContext, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Modal,
    Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";

const AppSettings = () => {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [modalVisible, setModalVisible] = useState(false);

    const handleSelectTheme = (newTheme) => {
        toggleTheme(newTheme);
        setModalVisible(false);
    };

    const isDark = theme === "dark";

    return (
        <SafeAreaView style={[styles.container, isDark && { backgroundColor: "#111827" }]}>
            <ScrollView>
                <View style={styles.screen}>
                    <Text style={[styles.label, isDark && { color: "#9CA3AF" }]}>
                        {t('settings.display_appearance')}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <View style={[styles.item, { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" }]}>
                            <Ionicons name="moon" size={20} color={"#2563EB"} />
                            <View>
                                <Text style={[styles.itemText, isDark && { color: "#FFFFFF" }]}>
                                    {t('settings.theme_mode')}
                                </Text>
                                <Text style={[styles.subText, isDark && { color: "#9CA3AF" }]}>
                                    {theme === "dark" ? t('settings.dark') : t('settings.light')}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal transparent visible={modalVisible} animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContainer}>
                        <Pressable onPress={() => handleSelectTheme("light")} style={styles.modalOption}>
                            <Text style={styles.modalText}>{t('settings.light')}</Text>
                        </Pressable>
                        <Pressable onPress={() => handleSelectTheme("dark")} style={styles.modalOption}>
                            <Text style={styles.modalText}>{t('settings.dark')}</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    screen: {
        padding: 25,
    },
    label: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 10,
    },
    item: {
        padding: 20,
        borderRadius: 12,
        flexDirection: "row",
        gap: 15,
        alignItems: "center",
    },
    itemText: {
        fontSize: 16,
        color: "#111827",
    },
    subText: {
        fontSize: 14,
        color: "#6B7280",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 20,
        width: "80%",
    },
    modalOption: {
        paddingVertical: 12,
    },
    modalText: {
        fontSize: 16,
        color: "#2563EB",
        textAlign: "center",
    },
});

export default AppSettings;