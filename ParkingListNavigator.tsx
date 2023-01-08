import * as React from "react";
import { StyleSheet } from "react-native";
import { useAPIcall } from "./ParkingAPI/useAPIcall";
import { colors } from "./colors";
import { ParkingListDetails } from "./ParkingListDetails";
import ParkingList from "./ParkingList";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { IGarage } from "./IGarage";

const Stack = createStackNavigator();

export default function ParkingListNavigator({ navigation, staticParkingData }: any) {
    const dynamicParkingData = useAPIcall();

    return (
        <Stack.Navigator screenOptions={{ presentation: "modal" }} initialRouteName="Parkhaus-Liste">
            <Stack.Screen name="Parkhaus-Liste" options={{ headerShown: false }}>
                {(props) => (
                    <ParkingList
                        staticParkingData={staticParkingData}
                        dynamicParkingData={dynamicParkingData}
                        {...props}
                    />
                )}
            </Stack.Screen>
            {staticParkingData.map((garage: IGarage) => (
                <Stack.Screen
                    name={garage.name}
                    key={garage.id}
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
                >
                    {(props) => (
                        <ParkingListDetails
                            {...props}
                            dynamicParkingData={dynamicParkingData.Parkhaus.find(
                                (dynamicGarage) => dynamicGarage.ID === garage.id
                            )}
                            staticParkingData={garage}
                        />
                    )}
                </Stack.Screen>
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
