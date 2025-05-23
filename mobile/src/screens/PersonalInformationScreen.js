// src/screens/PersonalInformationScreen.js

import React, { useContext, useState, useEffect, useRef } from "react";
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
    Alert,
    ActivityIndicator,
    Modal,
    Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";

const COUNTRIES = [
    { label: "United States", code: "US" },
    { label: "Kazakhstan", code: "KZ" },
    { label: "Bangladesh", code: "BD" },
];

export default function PersonalInformationScreen() {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [dob, setDob] = useState(new Date());
    const [tempDob, setTempDob] = useState(new Date());
    const [showDobPicker, setShowDobPicker] = useState(false);
    const [address, setAddress] = useState("");
    const [taxResidence, setTaxResidence] = useState("");
    const [photoUrl, setPhotoUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);

    const selectedCountry = COUNTRIES.find(c => c.code === taxResidence);

    const noteRef = useRef(null);

    const formatDate = (d) =>
        d
            ? d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            : "";

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await apiFetch("/api/v1/users/me/personal");
                if (!res.ok) throw new Error(`Status ${res.status}`);
                const data = await res.json();

                setFullName(data.full_name || "");
                setEmail(data.email || "");
                setPhone(data.phone_number || "");
                setAddress(data.address || "");
                setTaxResidence(data.tax_residence || "");
                if (data.date_of_birth) {
                    const d = new Date(data.date_of_birth);
                    setDob(d);
                    setTempDob(d);
                }
                if (data.photo_url) {
                    setPhotoUrl(data.photo_url);
                }
            } catch (err) {
                console.error("Load profile error:", err);
                Alert.alert("Ошибка", "Не удалось загрузить данные профиля");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const onSave = async () => {
        setSaving(true);
        const body = {
            full_name: fullName,
            phone_number: phone,
            date_of_birth: dob ? dob.toISOString().split("T")[0] : null,
            address,
            tax_residence: selectedCountry
                ? `${selectedCountry.label} (${selectedCountry.code})`
                : taxResidence,
        };
        try {
            const res = await apiFetch("/api/v1/users/me/personal", {
                method: "PUT",
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const updated = await res.json();

            setFullName(updated.full_name || "");
            setPhone(updated.phone_number || "");
            setAddress(updated.address || "");
            setTaxResidence(updated.tax_residence || "");
            if (updated.date_of_birth) {
                const d = new Date(updated.date_of_birth);
                setDob(d);
                setTempDob(d);
            }
            Alert.alert("Успешно", "Данные сохранены");
        } catch (err) {
            console.error("Save profile error:", err);
            Alert.alert("Ошибка", "Не удалось сохранить данные");
        } finally {
            setSaving(false);
        }
    };

    const onChangePhoto = async () => {
        try {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
                return Alert.alert("Внимание", "Нужен доступ к фотогалерее");
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.7,
            });
            if (result.cancelled) return;

            const uri = result.uri;
            const name = uri.split("/").pop();
            const match = /\.(\w+)$/.exec(name);
            const type = match ? `image/${match[1]}` : "image";

            const formData = new FormData();
            formData.append("file", { uri, name, type });

            const res = await apiFetch("/api/v1/users/me/photo", {
                method: "POST",
                headers: { "Content-Type": "multipart/form-data" },
                body: formData,
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const newUrl = await res.text();
            setPhotoUrl(newUrl);
            Alert.alert("Успешно", "Фото обновлено");
        } catch (err) {
            console.error("Upload photo error:", err);
            Alert.alert("Ошибка", "Не удалось загрузить фото");
        }
    };

    const onChangeDob = (e, selected) => {
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

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

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
                <View style={styles.avatarWrapper}>
                    <Image
                        source={
                            photoUrl
                                ? { uri: photoUrl }
                                : require("../../assets/walter.png")
                        }
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
                            editable={false}
                        />
                        <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#10B981"
                            style={styles.statusIcon}
                        />
                    </View>
                </View>

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
                            keyboardType="phone-pad"
                            placeholder="Phone Number"
                            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                        />
                    </View>
                </View>

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
                        multiline
                        placeholder="Address"
                        placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    />
                </View>

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
                        onPress={() => setModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.inputText,
                                isDark ? styles.inputTextDark : styles.inputTextLight,
                            ]}
                        >
                            {selectedCountry
                                ? `${selectedCountry.label} (${selectedCountry.code})`
                                : "Select Country"}
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={isDark ? "#6B7280" : "#9CA3AF"}
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        isDark ? styles.saveButtonDark : styles.saveButtonLight,
                    ]}
                    onPress={onSave}
                    activeOpacity={0.8}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>

                <Modal transparent visible={modalVisible} animationType="fade">
                    <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                        <View style={styles.modalContainer}>
                            {COUNTRIES.map(({ label, code }) => (
                                <Pressable
                                    key={code}
                                    onPress={() => {
                                        setTaxResidence(code);
                                        setModalVisible(false);
                                    }}
                                    style={styles.modalOption}
                                >
                                    <Text style={styles.modalText}>
                                        {label} ({code})
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </Pressable>
                </Modal>
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