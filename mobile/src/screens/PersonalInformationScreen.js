// PersonalInformationScreen.js

import React, { useContext, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";

export default function PersonalInformationScreen() {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    // состояния полей
    const [fullName, setFullName] = useState("Walter White");
    const [email, setEmail] = useState("walter.white@breakingbad.com");
    const [phone, setPhone] = useState("+1 (505) 555-0199");
    const [dob, setDob] = useState(new Date(1958, 8, 7)); // 7 Sep 1958
    const [tempDob, setTempDob] = useState(dob);
    const [showDobPicker, setShowDobPicker] = useState(false);
    const [address, setAddress] = useState(
        "308 Negra Arroyo Lane, Albuquerque, NM 87104"
    );
    const [taxResidence, setTaxResidence] = useState("United States");

    // логика выбора даты рождения
    const onChangeDob = (event, selected) => {
        if (Platform.OS === "android") {
            setShowDobPicker(false);
            if (selected) setDob(selected);
        } else {
            setTempDob(selected || dob);
        }
    };
    const confirmDob = () => {
        setShowDobPicker(false);
        setDob(tempDob);
    };
    const cancelDob = () => {
        setShowDobPicker(false);
        setTempDob(dob);
    };
    const formatDate = (d) =>
        d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    const onChangePhoto = () => { };
    const onSave = () => { };
    const onSelectTaxResidence = () => { };

    return (
        <SafeAreaView
            style={[
                styles.container,
                isDark ? styles.containerDark : styles.containerLight,
            ]}
        >
            <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Аватар */}
                <View style={styles.avatarWrapper}>
                    <Image
                        source={require("../../assets/walter.png")}
                        style={styles.avatar}
                    />
                    <TouchableOpacity
                        style={[
                            styles.cameraButton,
                            isDark
                                ? styles.cameraButtonDark
                                : styles.cameraButtonLight,
                        ]}
                        onPress={onChangePhoto}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="camera" size={18} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onChangePhoto} activeOpacity={0.7}>
                        <Text
                            style={[
                                styles.changePhotoText,
                                isDark
                                    ? styles.changePhotoTextDark
                                    : styles.changePhotoTextLight,
                            ]}
                        >
                            Change Photo
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Full Name */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            isDark ? styles.labelDark : styles.labelLight,
                        ]}
                    >
                        Full Name
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            isDark ? styles.inputDark : styles.inputLight,
                        ]}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Full Name"
                        placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    />
                </View>

                {/* Email Address */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            isDark ? styles.labelDark : styles.labelLight,
                        ]}
                    >
                        Email Address
                    </Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[
                                styles.input,
                                styles.inputWithIcon,
                                isDark ? styles.inputDark : styles.inputLight,
                            ]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email Address"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                        />
                        <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#10B981"
                            style={styles.statusIcon}
                        />
                    </View>
                </View>

                {/* Phone Number */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            isDark ? styles.labelDark : styles.labelLight,
                        ]}
                    >
                        Phone Number
                    </Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[
                                styles.input,
                                styles.inputWithIcon,
                                isDark ? styles.inputDark : styles.inputLight,
                            ]}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
                            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                        />
                        <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#10B981"
                            style={styles.statusIcon}
                        />
                    </View>
                </View>

                {/* Date of Birth */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            isDark ? styles.labelDark : styles.labelLight,
                        ]}
                    >
                        Date of Birth
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.dateInput,
                            isDark
                                ? styles.dateInputDark
                                : styles.dateInputLight,
                        ]}
                        onPress={() => setShowDobPicker(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="calendar-outline"
                            size={20}
                            color={isDark ? "#9CA3AF" : "#6B7280"}
                        />
                        <Text
                            style={[
                                styles.dateText,
                                isDark ? styles.dateTextDark : styles.dateTextLight,
                            ]}
                        >
                            {formatDate(dob)}
                        </Text>
                    </TouchableOpacity>

                    {showDobPicker &&
                        (Platform.OS === "ios" ? (
                            <View
                                style={[
                                    styles.iosPickerContainer,
                                    isDark
                                        ? styles.iosPickerContainerDark
                                        : styles.iosPickerContainerLight,
                                ]}
                            >
                                <View style={styles.iosPickerHeader}>
                                    <TouchableOpacity onPress={cancelDob}>
                                        <Text style={styles.cancelButton}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={confirmDob}>
                                        <Text style={styles.confirmButton}>Confirm</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={tempDob}
                                    mode="date"
                                    display="inline"
                                    onChange={onChangeDob}
                                    style={styles.iosPicker}
                                />
                            </View>
                        ) : (
                            <DateTimePicker
                                value={dob}
                                mode="date"
                                display="default"
                                onChange={onChangeDob}
                            />
                        ))}
                </View>

                {/* Address */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            isDark ? styles.labelDark : styles.labelLight,
                        ]}
                    >
                        Address
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            styles.textArea,
                            isDark ? styles.inputDark : styles.inputLight,
                        ]}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Address"
                        multiline
                        placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    />
                </View>

                {/* Tax Residence */}
                <View style={styles.field}>
                    <Text
                        style={[
                            styles.label,
                            isDark ? styles.labelDark : styles.labelLight,
                        ]}
                    >
                        Tax Residence
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.input,
                            styles.row,
                            styles.withArrow,
                            isDark ? styles.inputDark : styles.inputLight,
                        ]}
                        activeOpacity={0.7}
                        onPress={onSelectTaxResidence}
                    >
                        <Text
                            style={[
                                styles.inputText,
                                isDark
                                    ? styles.inputTextDark
                                    : styles.inputTextLight,
                            ]}
                        >
                            {taxResidence}
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={isDark ? "#6B7280" : "#9CA3AF"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Save Changes */}
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        isDark
                            ? styles.saveButtonDark
                            : styles.saveButtonLight,
                    ]}
                    onPress={onSave}
                    activeOpacity={0.8}
                >
                    <Text style={styles.saveButtonText}>
                        Save Changes
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    containerLight: { backgroundColor: "#FFF" },
    containerDark: { backgroundColor: "#111827" },

    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
        alignItems: "center",
    },

    avatarWrapper: {
        alignItems: "center",
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    cameraButton: {
        position: "absolute",
        bottom: 30,
        right: (40) / 2 - 18,
        borderRadius: 18,
        padding: 6,
        borderWidth: 1,
    },
    cameraButtonLight: {
        backgroundColor: "#FFFFFF",
        borderColor: "#E5E7EB",
    },
    cameraButtonDark: {
        backgroundColor: "#1F2937",
        borderColor: "#374151",
    },
    changePhotoText: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: "500",
    },
    changePhotoTextLight: { color: "#2563EB" },
    changePhotoTextDark: { color: "#FFFFFF" },

    field: {
        width: "100%",
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
        fontWeight: "500",
    },
    labelLight: { color: "#374151" },
    labelDark: { color: "#9CA3AF" },

    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    inputLight: {
        backgroundColor: "#FFFFFF",
        borderColor: "#D1D5DB",
        color: "#111827",
    },
    inputDark: {
        backgroundColor: "#1F2937",
        borderColor: "#374151",
        color: "#FFFFFF",
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    inputWithIcon: {
        flex: 1,
        paddingRight: 36,
    },
    statusIcon: {
        position: "absolute",
        right: 12,
    },

    dateInput: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    dateInputLight: {
        backgroundColor: "#FFFFFF",
        borderColor: "#D1D5DB",
    },
    dateInputDark: {
        backgroundColor: "#1F2937",
        borderColor: "#374151",
    },
    dateText: {
        marginLeft: 12,
        fontSize: 16,
    },
    dateTextLight: { color: "#111827" },
    dateTextDark: { color: "#FFFFFF" },

    iosPickerContainer: {
        marginTop: 8,
        borderRadius: 8,
        overflow: "hidden",
    },
    iosPickerContainerLight: { backgroundColor: "#FFFFFF" },
    iosPickerContainerDark: { backgroundColor: "#1F2937" },
    iosPickerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 12,
    },
    cancelButton: { fontSize: 16, color: "#EF4444" },
    confirmButton: { fontSize: 16, color: "#2563EB" },
    iosPicker: { height: 200 },

    textArea: {
        minHeight: 60,
        textAlignVertical: "top",
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    withArrow: {
        paddingRight: 12,
    },
    inputText: {
        fontSize: 16,
    },
    inputTextLight: {
        color: "#111827",
    },
    inputTextDark: {
        color: "#FFFFFF",
    },

    saveButton: {
        width: "100%",
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 16,
    },
    saveButtonLight: { backgroundColor: "#2563EB" },
    saveButtonDark: { backgroundColor: "#2563EB" },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});