import React, { useContext } from "react";
import { StyleSheet, Text, View, SafeAreaView, TextInput } from "react-native";
import { ThemeContext } from "@react-navigation/native";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

const TransferScreen = () => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.firstBlock}>
          <View style={styles.firstBlockInner}>
            <View style={styles.firstTitle}>
              <Text style={styles.firstTitleInner}>Available Balance</Text>
            </View>
            <View style={styles.firstAmount}>
              <Text style={styles.firstAmountInner}>$24,256.00</Text>
            </View>
            <View style={styles.firstAccount}>
              <Text style={styles.firstAccountInner}>Main Account ・ 1234</Text>
            </View>
          </View>
        </View>
        <View style={styles.secondBlock}>
          <View style={styles.secondBlockInner}>
            <View style={styles.secondAmount}>
              <View style={styles.secondGroup}>
                <Text style={styles.secondInputLabel}>$</Text>
                <TextInput style={styles.secondAmountInput}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
                  keyboardType="numeric"
                  returnKeyType="done"
                />
              </View>
              <View style={styles.secondAvailable}>
                <Text style={styles.secondAmountAvailable}>Available: $24,562.00</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.thirdBlock}>
          <View style={styles.thirdTitle}>
            <Text style={styles.thirdTitleInner}>Quick Transfer</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getThemedStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
  },
  firstBlock: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    height: 152,
    backgroundColor: '#FFFFFF',
  },
  firstBlockInner: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  firstTitleInner: {
    color: '#4B5563',
    fontWeight: '500',
    fontSize: '14',
  },
  firstAmountInner: {
    color: '#111827',
    fontWeight: '600',
    fontSize: '30',
  },
  firstAccountInner: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: '14',
  },
  secondAmount: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  secondBlock: {
    paddingHorizontal: 20,
    height: 164,
    justifyContent: 'center',
  },
  secondBlockInner: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    height: 116,
    borderRadius: 12,
  },
  secondGroup: {
    display: 'flex',
    flexDirection: 'row',
    gap: '10',
  },
  secondInputLabel: {
    fontWeight: '600',
    fontSize: '24',
    color: '#111827',
  },
  secondAmountInput: {
    fontWeight: '600',
    fontSize: '24',
    color: '#111827',
  },
  secondAvailable: {
  },
  secondAmountAvailable: {
    fontWeight: '500',
    fontSize: '14',
    color: '#6B7280',
  },
});

export default TransferScreen;
