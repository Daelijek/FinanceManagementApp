// src/navigation/index.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С ПРАВИЛЬНЫМ ПОТОКОМ

import React, { useContext, useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
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
import LanguageScreen from "../screens/LanguageScreen";
import SetBudgetScreen from "../screens/SetBudgetScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import AllBudgetsScreen from "../screens/AllBudgetsScreen";
import ExportReportScreen from "../screens/ExportReportScreen";
import ChatBotScreen from "../screens/ChatBotScreen";

const Stack = createNativeStackNavigator();

// Компонент для управления логикой навигации
const NavigationController = () => {
  const { theme } = useContext(ThemeContext);
  const [initialRoute, setInitialRoute] = useState(null);
  const [isReady, setIsReady] = useState(false);

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

  // Определяем начальный маршрут - ДЛЯ РАЗРАБОТКИ
  useEffect(() => {
    const determineInitialRoute = async () => {
      try {
        console.log("🚀 DEVELOPMENT MODE: Always starting with Onboarding");
        
        // Показываем splash минимум 2 секунды для плавности
        const startTime = Date.now();
        
        // ДЛЯ РАЗРАБОТКИ: ВСЕГДА НАЧИНАЕМ С ONBOARDING
        const targetRoute = "Onboarding";
        
        // Убеждаемся, что splash показывается минимум 2 секунды
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsedTime);
        
        if (remainingTime > 0) {
          console.log(`⏱️ Waiting additional ${remainingTime}ms for smooth transition`);
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        console.log(`🎯 Setting initial route: ${targetRoute}`);
        setInitialRoute(targetRoute);
        setIsReady(true);
        
      } catch (error) {
        console.error("❌ Error determining initial route:", error);
        // В случае ошибки всегда показываем onboarding
        setInitialRoute("Onboarding");
        setIsReady(true);
      }
    };

    determineInitialRoute();
  }, []);

  // Универсальная функция для кнопки "Назад"
  const makeBackOptions = ({ navigation }) => {
    const state = navigation.getState();
    const { routes, index } = state;
    const prevRoute = routes[index - 1] || {};
    let previousRouteName = prevRoute.name ?? "Назад";
    
    // Если есть вложенный навигатор, берем активный таб
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

  // Показываем Splash пока определяем начальный маршрут
  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={theme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {/* Системные экраны */}
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />

        {/* Аутентификация */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="PasswordResetConfirm" 
          component={PasswordResetConfirmScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="Registration" 
          component={Registration}
          options={{ headerShown: false }}
        />

        {/* Основное приложение */}
        <Stack.Screen 
          name="MainPage" 
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />

        {/* Экраны с кастомными заголовками */}
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
          options={makeBackOptions}
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

        <Stack.Screen
          name="Language"
          component={LanguageScreen}
          options={makeBackOptions}
        />

        <Stack.Screen
          name="Set Budget"
          component={SetBudgetScreen}
          options={makeBackOptions}
        />

        <Stack.Screen
          name="Budget Analytics"
          component={AnalyticsScreen}
          options={makeBackOptions}
        />

        <Stack.Screen
          name="All Budgets"
          component={AllBudgetsScreen}
          options={makeBackOptions}
        />

        <Stack.Screen
          name="Export Report"
          component={ExportReportScreen}
          options={makeBackOptions}
        />

        <Stack.Screen
          name="Chat Bot"
          component={ChatBotScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Главный компонент навигации
export default function RootNavigation() {
  return <NavigationController />;
}