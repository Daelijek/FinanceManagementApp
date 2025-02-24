import React from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigation } from "@react-navigation/bottom-tabs";

const ReportsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerInner}>
        <View style={styles.header}>
          <Text>Welcome to the Reports Screen</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ReportsScreen;
