// NotificationsScreen.js

import React, { useState, useContext, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IconCmp = (iconName) =>
  iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

export default function NotificationsScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  // Табы согласно реальному API (убираем reports, так как API не поддерживает)
  const tabs = [
    { key: "all", label: t('notifications.all') || "All" },
    { key: "transactions", label: t('transactions.title') || "Transactions" },
    { key: "budget", label: t('budget.title') || "Budget" },
    { key: "bills", label: t('notifications.bills') || "Bills" },
    { key: "security", label: t('notifications.security') || "Security" }
  ];

  const [activeTab, setActiveTab] = useState("all");
  const [notificationGroups, setNotificationGroups] = useState([]);
  const [localNotifications, setLocalNotifications] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    unread: 0,
    by_category: {}
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Генерация локальных уведомлений для демонстрации
  const generateMockNotifications = useCallback(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return [
      // Transaction notifications
      {
        id: 9001,
        title: "New Transaction Added",
        message: "Grocery shopping transaction for $85.50 has been added",
        notification_type: "transaction_created",
        category: "transactions",
        icon: "add-circle-outline",
        is_actionable: true,
        action_url: "/transactions",
        transaction_id: null,
        user_id: 1,
        is_read: false,
        created_at: now.toISOString(),
        relative_time: "2 minutes ago"
      },
      {
        id: 9002,
        title: "Transaction Updated",
        message: "Coffee expense amount changed from $3.50 to $4.50",
        notification_type: "transaction_updated",
        category: "transactions",
        icon: "create-outline",
        is_actionable: true,
        action_url: "/transactions",
        transaction_id: null,
        user_id: 1,
        is_read: false,
        created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        relative_time: "30 minutes ago"
      },
      {
        id: 9003,
        title: "Large Transaction Alert",
        message: "Monthly rent payment of $1,200.00 detected",
        notification_type: "large_transaction",
        category: "transactions",
        icon: "warning-outline",
        is_actionable: true,
        action_url: "/transactions",
        transaction_id: null,
        user_id: 1,
        is_read: true,
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        relative_time: "2 hours ago"
      },
      {
        id: 9004,
        title: "Transaction Deleted",
        message: "Duplicate McDonald's purchase has been removed",
        notification_type: "transaction_deleted",
        category: "transactions",
        icon: "trash-outline",
        is_actionable: false,
        action_url: null,
        transaction_id: null,
        user_id: 1,
        is_read: false,
        created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        relative_time: "4 hours ago"
      },

      // Budget notifications
      {
        id: 9005,
        title: "New Budget Created",
        message: "Entertainment budget set to $300.00 for this month",
        notification_type: "budget_created",
        category: "budget",
        icon: "wallet-outline",
        is_actionable: true,
        action_url: "/budget",
        transaction_id: null,
        user_id: 1,
        is_read: false,
        created_at: yesterday.toISOString(),
        relative_time: "1 day ago"
      },
      {
        id: 9006,
        title: "Budget Milestone - 50% Reached",
        message: "You've spent 50% of your Food & Dining budget ($150 of $300)",
        notification_type: "budget_milestone",
        category: "budget",
        icon: "flag-outline",
        is_actionable: true,
        action_url: "/budget",
        transaction_id: null,
        user_id: 1,
        is_read: false,
        created_at: yesterday.toISOString(),
        relative_time: "1 day ago"
      },
      {
        id: 9007,
        title: "Budget Warning - 80% Used",
        message: "Food & Dining budget: $240 of $300 spent. Consider reviewing your expenses.",
        notification_type: "budget_warning",
        category: "budget",
        icon: "alert-circle-outline",
        is_actionable: true,
        action_url: "/budget",
        transaction_id: null,
        user_id: 1,
        is_read: false,
        created_at: new Date(yesterday.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        relative_time: "1 day ago"
      },
      {
        id: 9008,
        title: "Budget Exceeded!",
        message: "Shopping budget exceeded! $420 spent of $400 budget.",
        notification_type: "budget_exceeded",
        category: "budget",
        icon: "ban-outline",
        is_actionable: true,
        action_url: "/budget",
        transaction_id: null,
        user_id: 1,
        is_read: false,
        created_at: new Date(yesterday.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        relative_time: "1 day ago"
      },
      {
        id: 9009,
        title: "Budget Updated",
        message: "Transportation budget increased from $200 to $250 per month",
        notification_type: "budget_updated",
        category: "budget",
        icon: "create-outline",
        is_actionable: true,
        action_url: "/budget",
        transaction_id: null,
        user_id: 1,
        is_read: true,
        created_at: new Date(yesterday.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        relative_time: "1 day ago"
      },
      {
        id: 9010,
        title: "Budget Deleted",
        message: "Vacation budget has been removed",
        notification_type: "budget_deleted",
        category: "budget",
        icon: "close-circle-outline",
        is_actionable: false,
        action_url: null,
        transaction_id: null,
        user_id: 1,
        is_read: true,
        created_at: weekAgo.toISOString(),
        relative_time: "3 days ago"
      },

      // Bills notifications
      {
        id: 9011,
        title: "Upcoming Bill Payment",
        message: "Electric bill of $125.00 is due in 3 days",
        notification_type: "bill_reminder",
        category: "bills",
        icon: "calendar-outline",
        is_actionable: true,
        action_url: "/transactions",
        transaction_id: null,
        user_id: 1,
        is_read: false,
        created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        relative_time: "6 hours ago"
      },

      // Security notifications
      {
        id: 9012,
        title: "New Device Login",
        message: "New login detected from iPhone 14 Pro",
        notification_type: "security_alert",
        category: "security",
        icon: "shield-checkmark-outline",
        is_actionable: true,
        action_url: "/profile",
        transaction_id: null,
        user_id: 1,
        is_read: false,
        created_at: weekAgo.toISOString(),
        relative_time: "2 days ago"
      }
    ];
  }, []);

  // Сохранение локальных уведомлений
  const saveLocalNotifications = useCallback(async (notifications) => {
    try {
      await AsyncStorage.setItem('local_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving local notifications:', error);
    }
  }, []);

  // Загрузка локальных уведомлений
  const loadLocalNotifications = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('local_notifications');
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error loading local notifications:', error);
      return [];
    }
  }, []);

  // Добавление нового локального уведомления
  const addLocalNotification = useCallback(async (notification) => {
    const existing = await loadLocalNotifications();
    const updated = [notification, ...existing];
    await saveLocalNotifications(updated);
    setLocalNotifications(updated);
  }, [loadLocalNotifications, saveLocalNotifications]);

  // Инициализация локальных уведомлений
  const initializeLocalNotifications = useCallback(async () => {
    const existing = await loadLocalNotifications();
    if (existing.length === 0) {
      const mockNotifications = generateMockNotifications();
      await saveLocalNotifications(mockNotifications);
      setLocalNotifications(mockNotifications);
    } else {
      setLocalNotifications(existing);
    }
  }, [loadLocalNotifications, saveLocalNotifications, generateMockNotifications]);

  // Загрузка уведомлений с API
  const loadNotifications = useCallback(async (category = "all") => {
    try {
      // Загружаем реальные уведомления из API
      const params = new URLSearchParams({
        category: category === "all" ? "all" : category,
        limit: "50",
        skip: "0",
        include_read: "true"
      });

      const response = await apiFetch(`/api/v1/notifications/?${params}`);
      
      let apiGroups = [];
      let apiSummary = { total: 0, unread: 0, by_category: {} };

      if (response.ok) {
        const data = await response.json();
        apiGroups = data.groups || [];
        apiSummary = data.summary || { total: 0, unread: 0, by_category: {} };
      }

      // Загружаем локальные уведомления
      await initializeLocalNotifications();
      const localNots = await loadLocalNotifications();

      // Фильтруем локальные уведомления по категории
      const filteredLocalNots = category === "all" 
        ? localNots 
        : localNots.filter(n => n.category === category);

      // Группируем локальные уведомления
      const localGroups = groupNotificationsByDate(filteredLocalNots);

      // Объединяем API и локальные уведомления
      const combinedGroups = [...localGroups, ...apiGroups];

      // Подсчитываем общую статистику
      const totalLocal = localNots.length;
      const unreadLocal = localNots.filter(n => !n.is_read).length;
      
      // Подсчитываем по категориям для локальных уведомлений
      const localByCategory = localNots.reduce((acc, n) => {
        acc[n.category] = (acc[n.category] || 0) + 1;
        return acc;
      }, {});

      const combinedSummary = {
        total: apiSummary.total + totalLocal,
        unread: apiSummary.unread + unreadLocal,
        by_category: {
          all: apiSummary.total + totalLocal,
          ...apiSummary.by_category,
          ...Object.keys(localByCategory).reduce((acc, key) => {
            acc[key] = (apiSummary.by_category[key] || 0) + localByCategory[key];
            return acc;
          }, {})
        }
      };

      setNotificationGroups(combinedGroups);
      setSummary(combinedSummary);

    } catch (error) {
      console.error('Error loading notifications:', error);
      
      // В случае ошибки API показываем только локальные уведомления
      await initializeLocalNotifications();
      const localNots = await loadLocalNotifications();
      
      const filteredLocalNots = category === "all" 
        ? localNots 
        : localNots.filter(n => n.category === category);

      const localGroups = groupNotificationsByDate(filteredLocalNots);
      
      const localByCategory = localNots.reduce((acc, n) => {
        acc[n.category] = (acc[n.category] || 0) + 1;
        return acc;
      }, {});

      setNotificationGroups(localGroups);
      setSummary({
        total: localNots.length,
        unread: localNots.filter(n => !n.is_read).length,
        by_category: {
          all: localNots.length,
          ...localByCategory
        }
      });
    }
  }, [initializeLocalNotifications, loadLocalNotifications]);

  // Группировка уведомлений по дате
  const groupNotificationsByDate = useCallback((notifications) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      "Today": [],
      "Yesterday": [],
      "Earlier This Week": []
    };

    notifications.forEach(notification => {
      const notDate = new Date(notification.created_at);
      const notDateOnly = new Date(notDate.getFullYear(), notDate.getMonth(), notDate.getDate());

      if (notDateOnly.getTime() === today.getTime()) {
        groups["Today"].push(notification);
      } else if (notDateOnly.getTime() === yesterday.getTime()) {
        groups["Yesterday"].push(notification);
      } else if (notDateOnly >= weekAgo) {
        groups["Earlier This Week"].push(notification);
      }
    });

    // Возвращаем только группы с уведомлениями
    return Object.entries(groups)
      .filter(([_, notifications]) => notifications.length > 0)
      .map(([title, notifications]) => ({
        title,
        notifications: notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }));
  }, []);

  // Добавление уведомления о создании транзакции
  const addTransactionNotification = useCallback(async (type, message, transactionData) => {
    const notification = {
      id: Date.now() + Math.random(),
      title: `Transaction ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message: message,
      notification_type: `transaction_${type}`,
      category: "transactions",
      icon: type === "created" ? "add-circle-outline" : type === "updated" ? "create-outline" : "trash-outline",
      is_actionable: true,
      action_url: "/transactions",
      transaction_id: transactionData?.id || null,
      user_id: 1,
      is_read: false,
      created_at: new Date().toISOString(),
      relative_time: "Just now"
    };

    await addLocalNotification(notification);
  }, [addLocalNotification]);

  // Слушатель для событий транзакций (можно вызывать из других экранов)
  useEffect(() => {
    const checkForNewTransactions = async () => {
      // Здесь можно добавить логику для проверки новых транзакций
      // Например, сравнивать с предыдущим состоянием
    };
    
    checkForNewTransactions();
  }, []);

  // Загрузка сводки уведомлений
  const loadNotificationsSummary = useCallback(async () => {
    try {
      const response = await apiFetch("/api/v1/notifications/summary");
      
      if (response.ok) {
        const apiSummary = await response.json();
        const localNots = await loadLocalNotifications();
        
        const localByCategory = localNots.reduce((acc, n) => {
          acc[n.category] = (acc[n.category] || 0) + 1;
          return acc;
        }, {});

        const combinedSummary = {
          total: apiSummary.total + localNots.length,
          unread: apiSummary.unread + localNots.filter(n => !n.is_read).length,
          by_category: {
            all: apiSummary.total + localNots.length,
            ...apiSummary.by_category,
            ...Object.keys(localByCategory).reduce((acc, key) => {
              acc[key] = (apiSummary.by_category[key] || 0) + localByCategory[key];
              return acc;
            }, {})
          }
        };

        setSummary(combinedSummary);
      }
    } catch (error) {
      console.error('Error loading notifications summary:', error);
    }
  }, [loadLocalNotifications]);

  // Обновление уведомления (пометка как прочитанное)
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Проверяем, это локальное уведомление или из API
      const localNots = await loadLocalNotifications();
      const localNotification = localNots.find(n => n.id === notificationId);

      if (localNotification) {
        // Обновляем локальное уведомление
        const updatedLocalNots = localNots.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        await saveLocalNotifications(updatedLocalNots);
        setLocalNotifications(updatedLocalNots);
      } else {
        // Обновляем через API
        const response = await apiFetch(`/api/v1/notifications/${notificationId}`, {
          method: "PUT",
          body: JSON.stringify({ is_read: true })
        });

        if (!response.ok && response.status !== 404) {
          throw new Error('Failed to mark notification as read');
        }
      }

      // Перезагружаем уведомления
      await loadNotifications(activeTab);

    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert(t('common.error'), 'Failed to mark notification as read');
    }
  }, [activeTab, loadNotifications, loadLocalNotifications, saveLocalNotifications, t]);

  // Удаление уведомления
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      // Проверяем, это локальное уведомление или из API
      const localNots = await loadLocalNotifications();
      const localNotification = localNots.find(n => n.id === notificationId);

      if (localNotification) {
        // Удаляем локальное уведомление
        const updatedLocalNots = localNots.filter(n => n.id !== notificationId);
        await saveLocalNotifications(updatedLocalNots);
        setLocalNotifications(updatedLocalNots);
        Alert.alert(t('common.success'), 'Notification deleted');
      } else {
        // Удаляем через API
        const response = await apiFetch(`/api/v1/notifications/${notificationId}`, {
          method: "DELETE"
        });

        if (response.ok) {
          Alert.alert(t('common.success'), 'Notification deleted');
        } else {
          throw new Error('Failed to delete notification');
        }
      }

      // Перезагружаем уведомления
      await loadNotifications(activeTab);

    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert(t('common.error'), 'Failed to delete notification');
    }
  }, [activeTab, loadNotifications, loadLocalNotifications, saveLocalNotifications, t]);

  // Навигация по типу уведомления
  const navigateByNotificationType = useCallback((notification) => {
    const { category, notification_type } = notification;

    switch (category) {
      case "transactions":
        navigation.navigate("MainPage", { screen: "Transactions" });
        break;

      case "budget":
        if (notification_type === "budget_exceeded" || notification_type === "budget_warning") {
          navigation.navigate("Set Budget");
        } else if (notification_type === "budget_milestone") {
          navigation.navigate("Budget Analytics");
        } else {
          navigation.navigate("MainPage", { screen: "Budget" });
        }
        break;

      case "bills":
        navigation.navigate("MainPage", { screen: "Transactions" });
        break;

      case "security":
        navigation.navigate("MainPage", { screen: "Profile" });
        break;

      default:
        navigation.navigate("MainPage", { screen: "Home" });
        break;
    }
  }, [navigation]);

  // Обработка клика по уведомлению
  const handleNotificationPress = useCallback(async (notification) => {
    // Помечаем как прочитанное, если не прочитано
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Показываем alert с возможностью перехода
    Alert.alert(
      notification.title,
      notification.message,
      [
        { text: t('common.cancel'), style: "cancel" },
        { 
          text: "View Details", 
          onPress: () => navigateByNotificationType(notification)
        }
      ]
    );
  }, [markAsRead, navigateByNotificationType, t]);

  // Отметить все как прочитанные
  const markAllAsRead = useCallback(async () => {
    try {
      const allNotifications = notificationGroups.flatMap(group => group.notifications);
      const unreadNotifications = allNotifications.filter(n => !n.is_read);
      
      if (unreadNotifications.length === 0) {
        Alert.alert("Info", "All notifications are already read");
        return;
      }

      // Разделяем на локальные и API уведомления
      const localNots = await loadLocalNotifications();
      const localUnread = unreadNotifications.filter(n => localNots.some(local => local.id === n.id));
      const apiUnread = unreadNotifications.filter(n => !localNots.some(local => local.id === n.id));

      // Обновляем локальные уведомления
      if (localUnread.length > 0) {
        const updatedLocalNots = localNots.map(n => ({ ...n, is_read: true }));
        await saveLocalNotifications(updatedLocalNots);
        setLocalNotifications(updatedLocalNots);
      }

      // Обновляем API уведомления
      if (apiUnread.length > 0) {
        const promises = apiUnread.map(notification => 
          apiFetch(`/api/v1/notifications/${notification.id}`, {
            method: "PUT",
            body: JSON.stringify({ is_read: true })
          })
        );
        await Promise.all(promises);
      }
      
      // Перезагружаем данные
      await loadNotifications(activeTab);
      
      Alert.alert(t('common.success'), 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert(t('common.error'), 'Failed to mark all notifications as read');
    }
  }, [notificationGroups, activeTab, loadNotifications, loadLocalNotifications, saveLocalNotifications, t]);

  // Очистить все уведомления
  const clearAllNotifications = useCallback(async () => {
    try {
      const allNotifications = notificationGroups.flatMap(group => group.notifications);
      
      if (allNotifications.length === 0) {
        Alert.alert("Info", "No notifications to clear");
        return;
      }

      // Очищаем локальные уведомления
      await saveLocalNotifications([]);
      setLocalNotifications([]);

      // Удаляем API уведомления
      const localNots = await loadLocalNotifications();
      const apiNotifications = allNotifications.filter(n => !localNots.some(local => local.id === n.id));
      
      if (apiNotifications.length > 0) {
        const promises = apiNotifications.map(notification =>
          apiFetch(`/api/v1/notifications/${notification.id}`, {
            method: "DELETE"
          })
        );
        await Promise.all(promises);
      }
      
      // Перезагружаем данные
      await loadNotifications(activeTab);
      
      Alert.alert(t('common.success'), 'All notifications cleared');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      Alert.alert(t('common.error'), 'Failed to clear notifications');
    }
  }, [notificationGroups, activeTab, loadNotifications, saveLocalNotifications, loadLocalNotifications, t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications(activeTab);
    setRefreshing(false);
  }, [activeTab, loadNotifications]);

  // Загружаем данные при смене вкладки
  useEffect(() => {
    setLoading(true);
    loadNotifications(activeTab).finally(() => setLoading(false));
  }, [activeTab, loadNotifications]);

  // Загружаем данные при фокусе экрана
  useFocusEffect(
    useCallback(() => {
      loadNotifications(activeTab);
    }, [activeTab, loadNotifications])
  );

  // Получение иконки для типа уведомления
  const getNotificationIcon = (notificationType, defaultIcon) => {
    const iconMap = {
      large_transaction: "cash-outline",
      budget_warning: "alert-circle-outline",
      budget_exceeded: "ban-outline",
      budget_milestone: "flag-outline",
      budget_created: "wallet-outline",
      budget_updated: "create-outline",
      budget_deleted: "close-circle-outline",
      transaction_created: "add-circle-outline",
      transaction_updated: "create-outline",
      transaction_deleted: "trash-outline",
      bill_reminder: "calendar-outline",
      security_alert: "shield-checkmark-outline"
    };

    return iconMap[notificationType] || defaultIcon || "notifications-outline";
  };

  // Получение цвета фона иконки
  const getIconBackground = (notificationType, category) => {
    if (notificationType === "large_transaction" || notificationType === "budget_exceeded") {
      return "#FEE2E2";
    }
    if (notificationType === "budget_warning") {
      return "#FEF3C7";
    }
    if (category === "budget") {
      return "#EFF6FF";
    }
    if (category === "transactions") {
      return "#D1FAE5";
    }
    if (category === "security") {
      return "#FEE2E2";
    }
    if (category === "bills") {
      return "#FEF3C7";
    }
    return "#F3F4F6";
  };

  // Получение цвета иконки
  const getIconColor = (notificationType, category) => {
    if (notificationType === "large_transaction" || notificationType === "budget_exceeded") {
      return "#DC2626";
    }
    if (notificationType === "budget_warning") {
      return "#D97706";
    }
    if (category === "budget") {
      return "#2563EB";
    }
    if (category === "transactions") {
      return "#059669";
    }
    if (category === "security") {
      return "#DC2626";
    }
    if (category === "bills") {
      return "#D97706";
    }
    return "#6B7280";
  };

  if (loading && notificationGroups.length === 0) {
    return (
      <SafeAreaView style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={[styles.loadingText, isDark ? styles.loadingTextDark : styles.loadingTextLight]}>
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalNotifications = notificationGroups.reduce((total, group) => total + group.notifications.length, 0);

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <View style={[styles.containerInner, isDark ? styles.containerInnerDark : styles.containerInnerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <Text style={[styles.headerTitle, isDark ? styles.headerTitleDark : styles.headerTitleLight]}>
            {t('notifications.title')}
          </Text>
          <View style={styles.headerStats}>
            {summary.unread > 0 && (
              <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
                <Text style={styles.badgeText}>{summary.unread}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Блок табов */}
        <View style={[styles.tabsContainer, isDark ? styles.tabsContainerDark : styles.tabsContainerLight]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              const categoryCount = summary.by_category[tab.key] || 0;
              
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                  style={[
                    styles.tab,
                    isActive ? (isDark ? styles.tabActiveDark : styles.tabActiveLight) : null
                  ]}
                >
                  <Text style={[
                    styles.tabText,
                    isActive
                      ? isDark ? styles.tabTextActiveDark : styles.tabTextActiveLight
                      : isDark ? styles.tabTextInactiveDark : styles.tabTextInactiveLight,
                  ]}>
                    {tab.label}
                  </Text>
                  {categoryCount > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: isActive ? "#FFFFFF" : "#2563EB" }]}>
                      <Text style={[styles.tabBadgeText, { color: isActive ? "#2563EB" : "#FFFFFF" }]}>
                        {categoryCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Список уведомлений */}
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? "#FFFFFF" : "#000000"}
            />
          }
        >
          {notificationGroups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="notifications-off-outline" 
                size={64} 
                color={isDark ? "#6B7280" : "#9CA3AF"} 
              />
              <Text style={[styles.emptyTitle, isDark ? styles.emptyTitleDark : styles.emptyTitleLight]}>
                No Notifications
              </Text>
              <Text style={[styles.emptySubtitle, isDark ? styles.emptySubtitleDark : styles.emptySubtitleLight]}>
                {activeTab === "all" 
                  ? "You're all caught up! No new notifications."
                  : `No ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()} notifications.`
                }
              </Text>
            </View>
          ) : (
            notificationGroups.map((group, groupIndex) => (
              <View key={`${group.title}-${groupIndex}`}>
                <Text style={[
                  styles.sectionHeader,
                  isDark ? styles.sectionHeaderDark : styles.sectionHeaderLight,
                  { marginTop: groupIndex === 0 ? 16 : 32 },
                ]}>
                  {group.title}
                </Text>

                {group.notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.card, 
                      isDark ? styles.cardDark : styles.cardLight,
                      !notification.is_read && styles.cardUnread
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleNotificationPress(notification)}
                    onLongPress={() => {
                      Alert.alert(
                        "Notification Actions",
                        `What would you like to do with this notification?`,
                        [
                          { text: t('common.cancel'), style: "cancel" },
                          { 
                            text: notification.is_read ? "Mark as Unread" : "Mark as Read",
                            onPress: () => markAsRead(notification.id)
                          },
                          { 
                            text: t('common.delete'), 
                            style: "destructive",
                            onPress: () => deleteNotification(notification.id)
                          }
                        ]
                      );
                    }}
                  >
                    <View style={styles.cardContent}>
                      <View style={[
                        styles.iconWrapper, 
                        { backgroundColor: getIconBackground(notification.notification_type, notification.category) }
                      ]}>
                        <Ionicons 
                          name={getNotificationIcon(notification.notification_type, notification.icon)} 
                          size={20} 
                          color={getIconColor(notification.notification_type, notification.category)} 
                        />
                      </View>

                      <View style={styles.cardText}>
                        <View style={styles.cardTitleRow}>
                          <Text style={[
                            styles.cardTitle, 
                            isDark ? styles.cardTitleDark : styles.cardTitleLight,
                            !notification.is_read && styles.cardTitleUnread
                          ]}>
                            {notification.title}
                          </Text>
                          {!notification.is_read && (
                            <View style={styles.unreadDot} />
                          )}
                        </View>
                        
                        <Text style={[styles.cardSubtitle, isDark ? styles.cardSubtitleDark : styles.cardSubtitleLight]}>
                          {notification.message}
                        </Text>
                        
                        <View style={styles.cardFooter}>
                          <Text style={[styles.cardTime, isDark ? styles.cardTimeDark : styles.cardTimeLight]}>
                            {notification.relative_time}
                          </Text>
                          <View style={[styles.typeBadge, getTypeBadgeStyle(notification.category, isDark)]}>
                            <Text style={[styles.typeText, getTypeTextStyle(notification.category, isDark)]}>
                              {notification.category.charAt(0).toUpperCase() + notification.category.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      {notification.is_actionable && (
                        <Ionicons name="open-outline" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                      )}
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={isDark ? "#6B7280" : "#9CA3AF"}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}

          {/* Действия внизу списка */}
          {totalNotifications > 0 && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, isDark ? styles.actionButtonDark : styles.actionButtonLight]}
                onPress={markAllAsRead}
              >
                <Ionicons name="checkmark-done-outline" size={16} color="#2563EB" />
                <Text style={styles.actionButtonText}>Mark All Read</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, isDark ? styles.actionButtonDark : styles.actionButtonLight]}
                onPress={() => {
                  Alert.alert(
                    "Clear All Notifications", 
                    "Are you sure you want to delete all notifications? This action cannot be undone.", 
                    [
                      { text: t('common.cancel'), style: "cancel" },
                      { text: "Clear All", style: "destructive", onPress: clearAllNotifications }
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={[styles.actionButtonText, { color: "#EF4444" }]}>Clear All</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Кнопка для добавления тестового уведомления */}
          {__DEV__ && (
            <TouchableOpacity 
              style={[styles.actionButton, { alignSelf: 'center', marginTop: 20 }]}
              onPress={async () => {
                await addTransactionNotification('created', 'Test transaction for $25.00 has been added', { id: 123 });
                await loadNotifications(activeTab);
              }}
            >
              <Ionicons name="add-outline" size={16} color="#2563EB" />
              <Text style={styles.actionButtonText}>Add Test Notification</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const getTypeBadgeStyle = (category, isDark) => {
  const baseStyle = { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 };
  
  switch (category) {
    case "transactions":
      return { ...baseStyle, backgroundColor: isDark ? "#1F2937" : "#EFF6FF" };
    case "budget":
      return { ...baseStyle, backgroundColor: isDark ? "#1F2937" : "#F0FDF4" };
    case "bills":
      return { ...baseStyle, backgroundColor: isDark ? "#1F2937" : "#FEF3C7" };
    case "security":
      return { ...baseStyle, backgroundColor: isDark ? "#1F2937" : "#FEE2E2" };
    default:
      return { ...baseStyle, backgroundColor: isDark ? "#374151" : "#F3F4F6" };
  }
};

const getTypeTextStyle = (category, isDark) => {
  const baseStyle = { fontSize: 10, fontWeight: "600" };
  
  switch (category) {
    case "transactions":
      return { ...baseStyle, color: "#2563EB" };
    case "budget":
      return { ...baseStyle, color: "#059669" };
    case "bills":
      return { ...baseStyle, color: "#D97706" };
    case "security":
      return { ...baseStyle, color: "#DC2626" };
    default:
      return { ...baseStyle, color: isDark ? "#9CA3AF" : "#6B7280" };
  }
};

// Стили остаются такими же как в предыдущем коде...
const styles = StyleSheet.create({
  // контейнеры
  container: { flex: 1 },
  containerLight: { backgroundColor: "#F9FAFB" },
  containerDark: { backgroundColor: "#111827" },

  containerInner: { flex: 1 },
  containerInnerLight: { backgroundColor: "#F9FAFB" },
  containerInnerDark: { backgroundColor: "#111827" },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  loadingTextLight: { color: "#6B7280" },
  loadingTextDark: { color: "#9CA3AF" },

  // заголовок
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLight: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#F5F5F5",
  },
  headerDark: {
    backgroundColor: "#1F2937",
    borderBottomColor: "#374151",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  headerTitleLight: { color: "#111827" },
  headerTitleDark: { color: "#F9FAFB" },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  // блок табов
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabsContainerLight: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#F5F5F5",
  },
  tabsContainerDark: {
    backgroundColor: "#1F2937",
    borderBottomColor: "#374151",
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  tabActiveLight: {
    backgroundColor: "#EFF6FF",
  },
  tabActiveDark: {
    backgroundColor: "#374151",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabTextActiveLight: { color: "#2563EB" },
  tabTextInactiveLight: { color: "#71717A" },
  tabTextActiveDark: { color: "#2563EB" },
  tabTextInactiveDark: { color: "#9CA3AF" },
  tabBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 18,
    alignItems: "center",
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // контент
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionHeaderLight: { color: "#6B7280" },
  sectionHeaderDark: { color: "#9CA3AF" },

  // карта уведомления
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardLight: { backgroundColor: "#FFFFFF" },
  cardDark: { backgroundColor: "#1F2937" },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  cardText: { flex: 1 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  cardTitleLight: { color: "#111827" },
  cardTitleDark: { color: "#F9FAFB" },
  cardTitleUnread: { fontWeight: "600" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginLeft: 8,
  },
  cardSubtitle: { 
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  cardSubtitleLight: { color: "#6B7280" },
  cardSubtitleDark: { color: "#9CA3AF" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTime: { fontSize: 12 },
  cardTimeLight: { color: "#9CA3AF" },
  cardTimeDark: { color: "#6B7280" },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  // пустое состояние
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTitleLight: { color: "#111827" },
  emptyTitleDark: { color: "#F9FAFB" },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptySubtitleLight: { color: "#6B7280" },
  emptySubtitleDark: { color: "#9CA3AF" },

  // действия
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  actionButtonDark: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
    color: "#2563EB",
  },
});