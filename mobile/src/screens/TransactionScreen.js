import React from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigation } from "@react-navigation/bottom-tabs";

const TransactionScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerInner}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Transactions</Text>
          <View style={styles.headerIcons}>
            <Ionicons name="search-outline" size={24} color={"#4B5563"} />
            <Ionicons name="filter-outline" size={24} color={"#4B5563"} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerInner: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 600,
    color: '#000',
  },
  headerIcons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 25,
  },
});

export default TransactionScreen;
