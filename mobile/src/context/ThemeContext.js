import React, { createContext, useState, useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState("light");

    // Загружаем тему при запуске
    useEffect(() => {
        (async () => {
            const savedTheme = await AsyncStorage.getItem("appTheme");
            if (savedTheme) {
                setTheme(savedTheme);
            } else {
                const deviceTheme = Appearance.getColorScheme(); // light/dark
                setTheme(deviceTheme || "light");
            }
        })();
    }, []);

    const toggleTheme = (selected) => {
        const newTheme = selected || (theme === "light" ? "dark" : "light");
        setTheme(newTheme);
        AsyncStorage.setItem("appTheme", newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
