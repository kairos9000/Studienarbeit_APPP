import * as React from "react";
import { StyleSheet, Text, View, Dimensions, Button, Pressable } from "react-native";
import { RootSiblingParent } from "react-native-root-siblings";
import { NavigationContainer } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Map from "./Map";
import ParkingList from "./ParkingList";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "./colors";
import { useState } from "react";
import { Divider, Menu, Provider } from "react-native-paper";

const Tab = createMaterialTopTabNavigator();
const googleMapsOffIcon = require("./assets/google-maps-off.png");

export default function App() {
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [volumeOn, setVolumeOn] = useState<boolean>(true);
    const [mapsOn, setMapsOn] = useState<boolean>(false);

    return (
        <Provider>
            <NavigationContainer>
                <RootSiblingParent>
                    <View style={styles.container}>
                        <Text style={styles.text}>Parken in Amberg</Text>
                    </View>
                    <View style={styles.settingsContainer}>
                        <Menu
                            visible={showMenu}
                            onDismiss={() => setShowMenu(false)}
                            anchorPosition="bottom"
                            anchor={
                                <Pressable
                                    onPress={() => setShowMenu(true)}
                                    android_ripple={{ color: colors.fontGray, radius: 20 }}
                                >
                                    <Ionicons name="ios-reorder-three" size={40} color={colors.primaryBackground} />
                                </Pressable>
                            }
                        >
                            <Menu.Item
                                onPress={() => setVolumeOn(!volumeOn)}
                                title="Ton an/aus"
                                leadingIcon={volumeOn ? "volume-high" : "volume-off"}
                            />
                            <Divider />
                            <Menu.Item
                                onPress={() => setMapsOn(!mapsOn)}
                                title="Immer Google Maps nutzen"
                                leadingIcon={mapsOn ? "google-maps" : googleMapsOffIcon}
                            />
                        </Menu>
                    </View>

                    <Tab.Navigator
                        initialRouteName="Karte"
                        screenOptions={{
                            tabBarActiveTintColor: colors.primaryBackground,
                            tabBarInactiveTintColor: colors.fontGray,
                            // tabBarContentContainerStyle: { backgroundColor: colors.background },
                            tabBarStyle: { backgroundColor: colors.background },
                            tabBarIndicatorStyle: { backgroundColor: colors.primaryBackground },
                        }}
                    >
                        <Tab.Screen
                            name="Karte"
                            component={Map}
                            options={{
                                tabBarLabel: "Karte",
                                tabBarIcon: ({ color }) => <Ionicons name="map" size={25} color={color} />,
                            }}
                        />
                        <Tab.Screen
                            name="Liste"
                            component={ParkingList}
                            options={{
                                tabBarLabel: "Liste",
                                tabBarIcon: ({ color }) => <Ionicons name="list" size={25} color={color} />,
                            }}
                        />
                    </Tab.Navigator>
                </RootSiblingParent>
            </NavigationContainer>
        </Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 0.1,
        backgroundColor: colors.background,
        alignItems: "flex-end",
        justifyContent: "space-around",
        flexDirection: "row",
    },
    text: {
        fontSize: 25,
        alignItems: "center",
        fontFamily: "serif",
    },
    settingsContainer: {
        position: "absolute",
        right: 15,
        top: 33,
        borderRadius: 30,
    },
});
