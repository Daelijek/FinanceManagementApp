import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CustomHeader = ({ navigation, options, back }) => {
  const title = options.title;
  return (
    <SafeAreaView
      style={{ backgroundColor: options.headerStyle.backgroundColor }}
    >
      <View
        style={{
          height: 70, // Фиксированная высота хедера
          backgroundColor: options.headerStyle.backgroundColor,
          borderBottomWidth: options.headerStyle.borderBottomWidth,
          borderBottomColor: options.headerStyle.borderBottomColor,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {back && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              position: "absolute",
              left: 16, // Расстояние от левого края, как в стандартном iOS header
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={options.headerTintColor}
            />
          </TouchableOpacity>
        )}
        <Text style={[options.headerTitleStyle, { textAlign: "center" }]}>
          {title}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default CustomHeader;
