// src/screens/LanguageScreen.js
// src/screens/LanguageScreen.js
import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import i18n from '../i18n'; // Прямой импорт i18n

const languages = [
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English',
    region: 'English (US)'
  },
  { 
    code: 'ru', 
    name: 'Russian', 
    nativeName: 'Русский',
    region: 'Russian'
  },
  { 
    code: 'kz', 
    name: 'Kazakh', 
    nativeName: 'Қазақша',
    region: 'Kazakh'
  }
];

const LanguageScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { i18n, t } = useTranslation();
  const isDark = theme === 'dark';
  
  const [searchText, setSearchText] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState(languages);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredLanguages(languages);
    } else {
      const filtered = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchText.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchText.toLowerCase()) ||
        lang.region.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredLanguages(filtered);
    }
  }, [searchText]);

  const handleLanguageChange = async (languageCode) => {
    try {
      console.log('Changing language to:', languageCode);
      console.log('i18n object:', i18n);
      console.log('i18n.changeLanguage:', typeof i18n.changeLanguage);
      
      if (i18n && typeof i18n.changeLanguage === 'function') {
        // Сохраняем язык в AsyncStorage
        await AsyncStorage.setItem('user-language', languageCode);
        
        // Меняем язык в i18n
        await i18n.changeLanguage(languageCode);
        
        console.log('Language changed successfully to:', languageCode);
        
        // Небольшая задержка для плавности перехода
        setTimeout(() => {
          navigation.goBack();
        }, 300);
      } else {
        console.error('i18n.changeLanguage is not available');
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        isDark ? styles.containerDark : styles.containerLight
      ]}
    >
      {/* Search Bar */}
      <View style={[
        styles.searchContainer,
        isDark ? styles.searchContainerDark : styles.searchContainerLight
      ]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={isDark ? "#9CA3AF" : "#6B7280"} 
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            isDark ? styles.searchInputDark : styles.searchInputLight
          ]}
          placeholder={t('language_screen.search_placeholder')}
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          value={searchText}
          onChangeText={setSearchText}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Language Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            isDark ? styles.sectionTitleDark : styles.sectionTitleLight
          ]}>
            {t('language_screen.current_language')}
          </Text>
          
          <View style={[
            styles.currentLanguageContainer,
            isDark ? styles.currentLanguageContainerDark : styles.currentLanguageContainerLight
          ]}>
            <TouchableOpacity 
              style={styles.languageItem}
              onPress={() => handleLanguageChange(currentLanguage.code)}
              activeOpacity={0.6}
            >
              <View style={styles.languageInfo}>
                <Text style={[
                  styles.languageName,
                  isDark ? styles.languageNameDark : styles.languageNameLight
                ]}>
                  {currentLanguage.nativeName}
                </Text>
                <Text style={[
                  styles.languageRegion,
                  isDark ? styles.languageRegionDark : styles.languageRegionLight
                ]}>
                  {currentLanguage.region}
                </Text>
              </View>
              <Ionicons 
                name="checkmark" 
                size={24} 
                color="#2563EB" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* All Languages Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            isDark ? styles.sectionTitleDark : styles.sectionTitleLight
          ]}>
            {t('language_screen.all_languages')}
          </Text>
          
          <View style={[
            styles.languagesContainer,
            isDark ? styles.languagesContainerDark : styles.languagesContainerLight
          ]}>
            {filteredLanguages.map((language, index) => {
              const isSelected = language.code === i18n.language;
              const isLastItem = index === filteredLanguages.length - 1;
              
              return (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    !isLastItem && styles.languageItemBorder,
                    isDark && !isLastItem && styles.languageItemBorderDark,
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                  activeOpacity={0.6}
                >
                  <View style={styles.languageInfo}>
                    <Text style={[
                      styles.languageName,
                      isDark ? styles.languageNameDark : styles.languageNameLight,
                    ]}>
                      {language.nativeName}
                    </Text>
                    <Text style={[
                      styles.languageRegion,
                      isDark ? styles.languageRegionDark : styles.languageRegionLight,
                    ]}>
                      {language.region}
                    </Text>
                  </View>
                  
                  {isSelected ? (
                    <Ionicons 
                      name="checkmark" 
                      size={24} 
                      color="#2563EB" 
                    />
                  ) : (
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={isDark ? "#6B7280" : "#9CA3AF"} 
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer Note */}
      <View style={styles.footer}>
        <Text style={[
          styles.footerText,
          isDark ? styles.footerTextDark : styles.footerTextLight
        ]}>
          {t('language_screen.change_immediately')}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: '#F9FAFB',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchContainerLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchContainerDark: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  searchInputLight: {
    color: '#111827',
  },
  searchInputDark: {
    color: '#F9FAFB',
  },

  scrollView: {
    flex: 1,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitleLight: {
    color: '#6B7280',
  },
  sectionTitleDark: {
    color: '#9CA3AF',
  },

  currentLanguageContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  currentLanguageContainerLight: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  currentLanguageContainerDark: {
    backgroundColor: '#1E3A8A',
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },

  languagesContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  languagesContainerLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  languagesContainerDark: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },

  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  languageItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  languageItemBorderDark: {
    borderBottomColor: '#374151',
  },
  languageItemDisabled: {
    opacity: 0.5,
  },

  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  languageNameLight: {
    color: '#111827',
  },
  languageNameDark: {
    color: '#F9FAFB',
  },
  languageNameDisabled: {
    color: '#9CA3AF',
  },
  languageRegion: {
    fontSize: 14,
  },
  languageRegionLight: {
    color: '#6B7280',
  },
  languageRegionDark: {
    color: '#9CA3AF',
  },
  languageRegionDisabled: {
    color: '#6B7280',
  },

  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  footerTextLight: {
    color: '#6B7280',
  },
  footerTextDark: {
    color: '#9CA3AF',
  },
});

export default LanguageScreen;