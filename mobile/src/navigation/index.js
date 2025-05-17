import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Registration from "../screens/Registration";
import LoginScreen from "../screens/LoginScreen";
import TransactionAdd from "../screens/TransactionAdd";
import BottomTabNavigator from "./BottomTabNavigator"; // Теперь ProfileScreen будет с табами
import TransferScreen from "../screens/TransferScreen";
import CustomHeader from "../components/CustomHeader";

const Stack = createNativeStackNavigator();
const CustomBackButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Ionicons
        name="chevron-back"
        size={24}
        color="#111827"
        style={{ marginLeft: 15 }}
      />
    </TouchableOpacity>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registration" component={Registration} />
      <Stack.Screen name="Profile" component={BottomTabNavigator} />
      <Stack.Screen
        name="TransactionAdd"
        component={TransactionAdd}
        options={{
          headerShown: true, // Обязательно включаем header для этого экрана
          title: "Add Transaction",
          header: (props) => <CustomHeader {...props} />,
          headerStyle: {
            backgroundColor: "#fff",
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
          },
          headerTitleStyle: {
            color: "#111827",
            fontSize: 20,
            fontWeight: "600",
          },
          headerTintColor: "#111827",
        }}
      />

      <Stack.Screen
        name="Transfer"
        component={TransferScreen}
        options={{
          headerShown: true,
          title: "Transfer",
          header: (props) => <CustomHeader {...props} />,
          headerStyle: {
            backgroundColor: "#fff",
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
          },
          headerTitleStyle: {
            color: "#111827",
            fontSize: 20,
            fontWeight: "600",
          },
          headerTintColor: "#111827",
        }}
      />
    </Stack.Navigator>
  );
};

export default function RootNavigation() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
