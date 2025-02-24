import React from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const ProfileScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false} // Отключает эффект перетягивания вверх/вниз на iOS
        overScrollMode="never" // Отключает overscroll на Android
        showsVerticalScrollIndicator={false} // Скрывает полосу прокрутки
      >
        <LinearGradient
          colors={["#3B82F6", "#2563EB"]} // Градиентный фон
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1, // Дает возможность прокрутки
  },
  header: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },
  headerImg: {
    margin: "auto",
    width: 80,
    height: 80,
    borderRadius: "50%",
    borderWidth: 4,
    borderColor: "#fff",
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
});

export default ProfileScreen;
