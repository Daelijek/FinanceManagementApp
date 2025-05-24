// src/screens/SetBudgetScreen.js

import React, { useState, useEffect, useRef, useContext } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    Alert,
    ActivityIndicator,
    Modal,
    Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";

// Добавляем CreateBudgetModal прямо в этот файл
const CreateBudgetModal = ({ visible, onClose, onSave, existingCategories = [] }) => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [budgetAmount, setBudgetAmount] = useState("");
    const [saving, setSaving] = useState(false);

    const IconCmp = (iconName) =>
        iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

    // Available categories (mock data)
    const [availableCategories] = useState([
        {
            id: 1,
            name: "Housing",
            icon: "home",
            color: "#8B5CF6",
            iconBg: "#F3E8FF"
        },
        {
            id: 2,
            name: "Food & Dining",
            icon: "restaurant",
            color: "#10B981",
            iconBg: "#D1FAE5"
        },
        {
            id: 3,
            name: "Transportation",
            icon: "car",
            color: "#F59E0B",
            iconBg: "#FEF3C7"
        },
        {
            id: 4,
            name: "Shopping",
            icon: "bag",
            color: "#EC4899",
            iconBg: "#FCE7F3"
        },
        {
            id: 5,
            name: "Entertainment",
            icon: "game-controller",
            color: "#06B6D4",
            iconBg: "#CFFAFE"
        },
        {
            id: 6,
            name: "Health & Fitness",
            icon: "fitness",
            color: "#EF4444",
            iconBg: "#FEE2E2"
        }
    ]);

    // Filter out categories that already have budgets
    const filteredCategories = availableCategories.filter(
        cat => !existingCategories.some(existing => existing.id === cat.id)
    );

    useEffect(() => {
        if (!visible) {
            setSelectedCategory(null);
            setBudgetAmount("");
            setSaving(false);
        }
    }, [visible]);

    const handleSave = async () => {
        if (!selectedCategory) {
            Alert.alert(t('common.error'), "Please select a category");
            return;
        }

        const amount = parseFloat(budgetAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert(t('common.error'), "Please enter a valid amount");
            return;
        }

        setSaving(true);
        try {
            const newBudget = {
                id: Date.now(),
                name: selectedCategory.name,
                icon: selectedCategory.icon,
                color: selectedCategory.color,
                budget: amount,
                spent: 0,
                iconBg: selectedCategory.iconBg
            };

            await onSave(newBudget);
            onClose();
        } catch (error) {
            Alert.alert(t('common.error'), "Failed to save budget");
        } finally {
            setSaving(false);
        }
    };

    const modalStyles = StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
        },
        modalContainer: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 16,
            padding: 24,
            width: "90%",
            maxHeight: "80%",
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        closeButton: {
            padding: 4,
        },
        amountSection: {
            marginBottom: 24,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
            marginBottom: 12,
        },
        amountContainer: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "#374151" : "#F3F4F6",
            borderRadius: 12,
            padding: 16,
        },
        currencySymbol: {
            fontSize: 24,
            fontWeight: "600",
            color: isDark ? "#9CA3AF" : "#6B7280",
            marginRight: 8,
        },
        amountInput: {
            flex: 1,
            fontSize: 24,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
            padding: 0,
        },
        categoriesGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
        },
        categoryCard: {
            width: "48%",
            backgroundColor: isDark ? "#374151" : "#F9FAFB",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            borderWidth: 2,
            borderColor: "transparent",
        },
        categoryCardSelected: {
            borderColor: "#2563EB",
            backgroundColor: isDark ? "#1E3A8A" : "#EFF6FF",
        },
        categoryIcon: {
            width: 40,
            height: 40,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 8,
        },
        categoryName: {
            fontSize: 14,
            fontWeight: "500",
            color: isDark ? "#F9FAFB" : "#111827",
            textAlign: "center",
        },
        modalButtons: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 24,
            gap: 12,
        },
        modalButton: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: "center",
        },
        cancelButton: {
            backgroundColor: isDark ? "#374151" : "#E5E7EB",
        },
        saveButton: {
            backgroundColor: "#2563EB",
        },
        saveButtonDisabled: {
            backgroundColor: isDark ? "#374151" : "#E5E7EB",
        },
        cancelButtonText: {
            color: isDark ? "#9CA3AF" : "#6B7280",
            fontWeight: "500",
        },
        saveButtonText: {
            color: "#FFFFFF",
            fontWeight: "600",
        },
        saveButtonTextDisabled: {
            color: isDark ? "#6B7280" : "#9CA3AF",
        },
    });

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <Pressable style={modalStyles.modalOverlay} onPress={onClose}>
                <Pressable style={modalStyles.modalContainer} onPress={(e) => e.stopPropagation()}>
                    <View style={modalStyles.modalHeader}>
                        <Text style={modalStyles.modalTitle}>Create Budget</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Ionicons name="close" size={24} color={isDark ? "#F9FAFB" : "#111827"} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Budget Amount */}
                        <View style={modalStyles.amountSection}>
                            <Text style={modalStyles.sectionTitle}>Budget Amount</Text>
                            <View style={modalStyles.amountContainer}>
                                <Text style={modalStyles.currencySymbol}>$</Text>
                                <TextInput
                                    style={modalStyles.amountInput}
                                    value={budgetAmount}
                                    onChangeText={setBudgetAmount}
                                    placeholder="0"
                                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Categories */}
                        <View>
                            <Text style={modalStyles.sectionTitle}>Select Category</Text>
                            <View style={modalStyles.categoriesGrid}>
                                {filteredCategories.map((category) => {
                                    const Icon = IconCmp(category.icon);
                                    const isSelected = selectedCategory?.id === category.id;

                                    return (
                                        <TouchableOpacity
                                            key={category.id}
                                            style={[
                                                modalStyles.categoryCard,
                                                isSelected && modalStyles.categoryCardSelected
                                            ]}
                                            onPress={() => setSelectedCategory(category)}
                                        >
                                            <View style={[modalStyles.categoryIcon, { backgroundColor: category.iconBg }]}>
                                                <Icon
                                                    name={category.icon}
                                                    size={20}
                                                    color={category.color}
                                                />
                                            </View>
                                            <Text style={modalStyles.categoryName}>{category.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={modalStyles.modalButtons}>
                        <TouchableOpacity
                            style={[modalStyles.modalButton, modalStyles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={modalStyles.cancelButtonText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                modalStyles.modalButton,
                                modalStyles.saveButton,
                                (!selectedCategory || !budgetAmount) && modalStyles.saveButtonDisabled
                            ]}
                            onPress={handleSave}
                            disabled={saving || !selectedCategory || !budgetAmount}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={[
                                    modalStyles.saveButtonText,
                                    (!selectedCategory || !budgetAmount) && modalStyles.saveButtonTextDisabled
                                ]}>
                                    {t('common.save')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const IconCmp = (iconName) =>
    iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

const SetBudgetScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    const [totalBudget, setTotalBudget] = useState(3000);
    const [spent, setSpent] = useState(2450);
    const [remaining, setRemaining] = useState(550);
    const [percentage, setPercentage] = useState(82);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [categories, setCategories] = useState([
        {
            id: 1,
            name: "Housing",
            icon: "home",
            color: "#8B5CF6",
            budget: 1500,
            spent: 1200,
            iconBg: "#F3E8FF"
        },
        {
            id: 2,
            name: "Transportation",
            icon: "car",
            color: "#06B6D4",
            budget: 500,
            spent: 400,
            iconBg: "#CFFAFE"
        },
        {
            id: 3,
            name: "Food & Dining",
            icon: "restaurant",
            color: "#F59E0B",
            budget: 400,
            spent: 350,
            iconBg: "#FEF3C7"
        },
        {
            id: 4,
            name: "Shopping",
            icon: "bag",
            color: "#10B981",
            budget: 400,
            spent: 300,
            iconBg: "#D1FAE5"
        },
        {
            id: 5,
            name: "Entertainment",
            icon: "game-controller",
            color: "#EF4444",
            budget: 200,
            spent: 200,
            iconBg: "#FEE2E2"
        }
    ]);

    useEffect(() => {
        // Calculate totals when categories change
        const totalCategoryBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
        const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
        const remaining = totalCategoryBudget - totalSpent;
        const percentage = totalCategoryBudget > 0 ? Math.round((totalSpent / totalCategoryBudget) * 100) : 0;

        setTotalBudget(totalCategoryBudget);
        setSpent(totalSpent);
        setRemaining(remaining);
        setPercentage(percentage);
    }, [categories]);

    const updateCategoryBudget = (categoryId, newBudget) => {
        const budget = parseFloat(newBudget) || 0;
        setCategories(prev => prev.map(cat =>
            cat.id === categoryId ? { ...cat, budget } : cat
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            Alert.alert(
                t('common.success'),
                "Budget saved successfully!",
                [
                    {
                        text: t('common.confirm'),
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            Alert.alert(t('common.error'), "Failed to save budget");
        } finally {
            setSaving(false);
        }
    };

    const addNewCategory = () => {
        setShowCreateModal(true);
    };

    const handleCreateBudget = async (newBudget) => {
        try {
            setCategories(prev => [...prev, newBudget]);
            Alert.alert(t('common.success'), "Budget created successfully!");
        } catch (error) {
            throw error;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? "#F9FAFB" : "#111827"} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('set_budget.title')}</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                        <Text style={styles.saveButton}>{t('common.save')}</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Monthly Budget Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.percentageContainer}>
                            <Progress.Circle
                                size={60}
                                progress={percentage / 100}
                                showsText={true}
                                formatText={() => `${percentage}%`}
                                color="#2563EB"
                                unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                                borderWidth={0}
                                thickness={6}
                                textStyle={[styles.percentageText, isDark && { color: "#F9FAFB" }]}
                            />
                        </View>
                        <View style={styles.summaryInfo}>
                            <Text style={styles.summaryLabel}>{t('set_budget.monthly_budget')}</Text>
                            <Text style={styles.summaryAmount}>
                                ${spent.toLocaleString()} / ${totalBudget.toLocaleString()}
                            </Text>
                            <Text style={styles.summaryUsed}>{percentage}% {t('set_budget.used')}</Text>
                        </View>
                    </View>
                </View>

                {/* Budget Categories */}
                <View style={styles.categoriesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('set_budget.budget_categories')}</Text>
                        <TouchableOpacity onPress={addNewCategory}>
                            <Ionicons name="add" size={24} color="#2563EB" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.categoriesList}>
                        {categories.map((category) => {
                            const progress = category.budget > 0 ? category.spent / category.budget : 0;
                            const isOverBudget = category.spent > category.budget;
                            const Icon = IconCmp(category.icon);

                            return (
                                <View key={category.id} style={styles.categoryItem}>
                                    <View style={styles.categoryHeader}>
                                        <View style={styles.categoryLeft}>
                                            <View style={[styles.categoryIcon, { backgroundColor: category.iconBg }]}>
                                                <Icon
                                                    name={category.icon}
                                                    size={24}
                                                    color={category.color}
                                                />
                                            </View>
                                            <Text style={styles.categoryName}>{category.name}</Text>
                                        </View>

                                        <View style={styles.categoryBudgetContainer}>
                                            <Text style={styles.categorySpent}>$ {category.spent}</Text>
                                            <Text style={styles.categorySlash}> / </Text>
                                            <Text style={styles.categoryBudgetLabel}>$ </Text>
                                            <TextInput
                                                style={styles.categoryBudgetInput}
                                                value={category.budget.toString()}
                                                onChangeText={(text) => updateCategoryBudget(category.id, text)}
                                                keyboardType="numeric"
                                                selectTextOnFocus={true}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.categoryProgress}>
                                        <Progress.Bar
                                            progress={Math.min(progress, 1)}
                                            width={null}
                                            height={8}
                                            color={isOverBudget ? "#EF4444" : category.color}
                                            unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                                            borderWidth={0}
                                            borderRadius={4}
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Add New Category Button */}
                    <TouchableOpacity style={styles.addCategoryButton} onPress={addNewCategory}>
                        <Ionicons name="add" size={16} color="#2563EB" />
                        <Text style={styles.addCategoryText}>{t('set_budget.add_new_category')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Total Budget Summary */}
                <View style={styles.totalSummary}>
                    <View style={styles.totalSummaryContent}>
                        <View style={styles.totalItem}>
                            <Text style={styles.totalLabel}>{t('set_budget.total_budget')}</Text>
                            <Text style={styles.totalAmount}>${totalBudget.toLocaleString()}</Text>
                        </View>

                        <View style={styles.totalItem}>
                            <Text style={styles.totalLabel}>{t('set_budget.remaining')}</Text>
                            <Text style={[styles.totalAmount, { color: remaining >= 0 ? "#10B981" : "#EF4444" }]}>
                                ${Math.abs(remaining).toLocaleString()}
                            </Text>
                        </View>

                        <View style={styles.totalItem}>
                            <Text style={styles.totalLabel}>{t('set_budget.spent')}</Text>
                            <Text style={[styles.totalAmount, { color: "#2563EB" }]}>
                                ${spent.toLocaleString()}
                            </Text>
                        </View>

                        <View style={styles.progressCircleContainer}>
                            <Progress.Circle
                                size={80}
                                progress={percentage / 100}
                                color="#2563EB"
                                unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                                borderWidth={0}
                                thickness={8}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Create Budget Modal */}
            <CreateBudgetModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleCreateBudget}
                existingCategories={categories}
            />
        </SafeAreaView>
    );
};

// Остальные стили остаются теми же...
const getThemedStyles = (isDark) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#374151" : "#E5E7EB",
        },
        backButton: {
            padding: 4,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        saveButton: {
            fontSize: 16,
            fontWeight: "500",
            color: "#2563EB",
        },
        content: {
            flex: 1,
            paddingHorizontal: 20,
        },
        summaryCard: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            marginTop: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        summaryHeader: {
            flexDirection: "row",
            alignItems: "center",
        },
        percentageContainer: {
            marginRight: 20,
        },
        percentageText: {
            fontSize: 14,
            fontWeight: "600",
            color: "#111827",
        },
        summaryInfo: {
            flex: 1,
        },
        summaryLabel: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
            marginBottom: 4,
        },
        summaryAmount: {
            fontSize: 20,
            fontWeight: "700",
            color: isDark ? "#F9FAFB" : "#111827",
            marginBottom: 4,
        },
        summaryUsed: {
            fontSize: 14,
            color: "#2563EB",
            fontWeight: "500",
        },
        categoriesSection: {
            marginBottom: 24,
        },
        sectionHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        categoriesList: {
            gap: 16,
        },
        categoryItem: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        categoryHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
        },
        categoryLeft: {
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
        },
        categoryIcon: {
            width: 36,
            height: 36,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
        },
        categoryName: {
            fontSize: 16,
            fontWeight: "500",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        categoryBudgetContainer: {
            flexDirection: "row",
            alignItems: "center",
        },
        categorySpent: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        categorySlash: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        categoryBudgetLabel: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        categoryBudgetInput: {
            fontSize: 14,
            color: isDark ? "#F9FAFB" : "#111827",
            fontWeight: "500",
            minWidth: 40,
            textAlign: "left",
            padding: 0,
        },
        categoryProgress: {
            marginTop: 4,
        },
        addCategoryButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: isDark ? "#374151" : "#E5E7EB",
            borderStyle: "dashed",
        },
        addCategoryText: {
            fontSize: 14,
            color: "#2563EB",
            fontWeight: "500",
            marginLeft: 8,
        },
        totalSummary: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            marginBottom: 32,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        totalSummaryContent: {
            position: "relative",
        },
        totalItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
        },
        totalLabel: {
            fontSize: 16,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        totalAmount: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        progressCircleContainer: {
            position: "absolute",
            right: 0,
            top: "50%",
            transform: [{ translateY: -40 }],
        },
    });

export default SetBudgetScreen;