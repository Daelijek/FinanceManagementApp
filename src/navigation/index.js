import React, { useContext } from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeContext } from "../context/ThemeContext";

import Registration from "../screens/Registration";
import LoginScreen from "../screens/LoginScreen";
import TransactionAdd from "../screens/TransactionAdd";
import PrivacyPolicy from "../screens/PrivacyPolicy";
import BottomTabNavigator from "./BottomTabNavigator";
import TransferScreen from "../screens/TransferScreen";
import CustomHeader from "../components/CustomHeader";
import AppSettings from "../screens/AppSettings";

const Stack = createNativeStackNavigator();

const CustomBackButton = ({ color }) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Ionicons
        name="chevron-back"
        size={24}
        color={color}
        style={{ marginLeft: 15 }}
      />
    </TouchableOpacity>
  );
};

const AppNavigator = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const headerBackground = isDark ? "#1F2937" : "#FFFFFF";
  const headerTextColor = isDark ? "#FFFFFF" : "#111827";
  const headerBorderColor = isDark ? "#374151" : "#F3F4F6";

  const defaultHeaderOptions = {
    headerShown: true,
    headerStyle: {
      backgroundColor: headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: headerBorderColor,
    },
    headerTitleStyle: {
      color: headerTextColor,
      fontSize: 20,
      fontWeight: "600",
    },
    headerTintColor: headerTextColor,
  };

  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registration" component={Registration} />
      <Stack.Screen name="Profile" component={BottomTabNavigator} />
      <Stack.Screen name="TransactionAdd" component={TransactionAdd} options={defaultHeaderOptions} />
      <Stack.Screen name="Transfer" component={TransferScreen} options={defaultHeaderOptions} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} options={defaultHeaderOptions} />
      <Stack.Screen name="AppSettings" component={AppSettings} options={defaultHeaderOptions} />
    </Stack.Navigator>
  );
};

export default function RootNavigation() {
  const { theme } = useContext(ThemeContext);

  return (
    <NavigationContainer theme={theme === "dark" ? DarkTheme : DefaultTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}