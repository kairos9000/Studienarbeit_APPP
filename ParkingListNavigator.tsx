import * as React from "react";
import {
    StyleSheet,
    Text,
    View,
    Dimensions,
    Button,
    TouchableOpacity,
    FlatList,
    TouchableHighlight,
    StatusBar,
} from "react-native";
import { useAPIcall } from "./ParkingAPI/useAPIcall";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { colors } from "./colors";
import { IGarage } from "./IGarage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parkingGarages } from "./staticDataParkingGarage";
import { ParkingListItem } from "./ParkingListItem";
import { NavigationContainer } from "@react-navigation/native";
import { ParkingListDetails } from "./ParkingListDetails";
import ParkingList from "./ParkingList";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

const staticDataParkingGarage = "@staticData";
const Stack = createStackNavigator();

export default function ParkingListNavigator({ navigation }: any) {
    return (
        <Stack.Navigator screenOptions={{ presentation: "modal" }} initialRouteName="Parkhaus-Liste">
            <Stack.Screen name="Parkhaus-Liste" options={{ headerShown: false }} component={ParkingList} />
            {parkingGarages.map((garage) => (
                <Stack.Screen
                    name={garage.name}
                    key={garage.id}
                    component={ParkingListDetails}
                    options={{
                        headerRight: () => (
                            <Ionicons.Button
                                color={colors.secondary}
                                backgroundColor="transparent"
                                underlayColor="transparent"
                                onPress={() => console.log("hello")}
                                style={{ marginRight: 10 }}
                                name="heart" //"heart-outline"
                                size={40}
                            />
                        ),
                    }}
                />
            ))}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray,
        alignItems: "center",
        justifyContent: "center",
    },
});
