import * as React from "react";
import { StyleSheet, Text, View, Dimensions, Button, Pressable } from "react-native";
import { RootSiblingParent } from "react-native-root-siblings";
import { NavigationContainer } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Map from "./Map";
import ParkingList from "./ParkingList";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "./colors";
import { createContext, useEffect, useState } from "react";
import { Divider, Menu, Provider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Tab = createMaterialTopTabNavigator();
const googleMapsOffIcon = require("./assets/google-maps-off.png");
const settingsDataVolume = "@settingsDataVolume";
const settingsDataMaps = "@settingsDataMaps";

export default function App() {
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [volumeOn, setVolumeOn] = useState<boolean>(true);
    const [mapsOn, setMapsOn] = useState<boolean>(false);

    useEffect(() => {
        // weil async/await warten würde und damit die anderen useEffects ausgeführt werden und die
        // Werte von volumeOn oder mapsOn verändern, bevor sie ausgelesen werden
        // => then macht sofort weiter und fügt das Auslesen von settingsVolumeMaps an
        // die callback-chain => Variablen werden ausgelesen, bevor sie verändert werden können
        AsyncStorage.getItem(settingsDataVolume).then((value) => {
            if (value !== null) {
                setVolumeOn(JSON.parse(value));
            }
        });
        AsyncStorage.getItem(settingsDataMaps).then((value) => {
            if (value !== null) {
                setMapsOn(JSON.parse(value));
            }
        });
    }, []);

    useEffect(() => {
        AsyncStorage.setItem(settingsDataVolume, JSON.stringify(volumeOn));
    }, [volumeOn]);

    useEffect(() => {
        AsyncStorage.setItem(settingsDataMaps, JSON.stringify(mapsOn));
    }, [mapsOn]);

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
                                    <Ionicons name="menu" size={40} color={colors.primaryBackground} />
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
                            tabBarStyle: { backgroundColor: colors.background },
                            tabBarIndicatorStyle: { backgroundColor: colors.primaryBackground },
                        }}
                    >
                        <Tab.Screen
                            name="Karte"
                            children={(props) => <Map volume={volumeOn} mapsOn={mapsOn} {...props} />}
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
        right: 17,
        top: 33,
        borderRadius: 30,
    },
});
