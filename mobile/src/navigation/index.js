// RootNavigation.js

import React, { useContext } from "react";
import { TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  getFocusedRouteNameFromRoute,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeContext } from "../context/ThemeContext";

// Screens
import Registration from "../screens/Registration";
import LoginScreen from "../screens/LoginScreen";
import TransactionAdd from "../screens/TransactionAdd";
import PrivacyPolicy from "../screens/PrivacyPolicy";
import BottomTabNavigator from "./BottomTabNavigator";
import TransferScreen from "../screens/TransferScreen";
import AppSettings from "../screens/AppSettings";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import PasswordResetConfirmScreen from "../screens/PasswordResetConfirmScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import AllTransactionsScreen from "../screens/AllTransactionsScreen";
import PersonalInformationScreen from "../screens/PersonalInformationScreen";
import BudgetCategoriesScreen from "../screens/BudgetCategoriesScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const headerBackground = isDark ? "#1F2937" : "#FFFFFF";
  const headerTextColor = isDark ? "#FFFFFF" : "#111827";
  const headerBorderColor = isDark ? "#374151" : "#F3F4F6";

  const defaultHeaderOptions = {
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

  // Универсальная функция для рендеринга «назад» с учётом вложенного таба
  const makeBackOptions = ({ navigation }) => {
    const state = navigation.getState();
    const { routes, index } = state;
    const prevRoute = routes[index - 1] || {};
    // сначала берём имя родительского маршрута
    let previousRouteName = prevRoute.name ?? "Назад";
    // если у него есть вложенный навигатор — вытаскиваем активный таб
    if (prevRoute.state) {
      const nestedIndex = prevRoute.state.index;
      const nestedRoute = prevRoute.state.routes[nestedIndex];
      previousRouteName = nestedRoute?.name ?? previousRouteName;
    }

    return {
      ...defaultHeaderOptions,
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", marginRight: 15 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={headerTextColor} />
          <Text style={{ color: headerTextColor, fontSize: 16 }}>
            {previousRouteName}
          </Text>
        </TouchableOpacity>
      ),
    };
  };

  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="PasswordResetConfirm" component={PasswordResetConfirmScreen} />
      <Stack.Screen name="Registration" component={Registration} />

      {/* Назовём стековый экран «MainPage», чтобы не дублировать имена */}
      <Stack.Screen name="MainPage" component={BottomTabNavigator} />

      <Stack.Screen
        name="Transaction Add"
        component={TransactionAdd}
        options={makeBackOptions}
      />

      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={makeBackOptions}
      />

      <Stack.Screen
        name="Transfer"
        component={TransferScreen}
        options={defaultHeaderOptions}
      />

      <Stack.Screen
        name="Privacy Policy"
        component={PrivacyPolicy}
        options={makeBackOptions}
      />

      <Stack.Screen
        name="App Settings"
        component={AppSettings}
        options={makeBackOptions}
      />
      
      <Stack.Screen
        name="All Transactions"
        component={AllTransactionsScreen}
        options={makeBackOptions}
      />
      
      <Stack.Screen
        name="Personal Information"
        component={PersonalInformationScreen}
        options={makeBackOptions}
      />
      
      <Stack.Screen
        name="Budget Categories"
        component={BudgetCategoriesScreen}
        options={makeBackOptions}
      />
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