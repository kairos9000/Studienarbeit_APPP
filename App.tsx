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
import { ParkingListDetails } from "./ParkingListDetails";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ParkingListNavigator from "./ParkingListNavigator";
import { IGarage } from "./IGarage";
import { parkingGarages } from "./staticDataParkingGarage";
import Toast from "react-native-root-toast";

const Tab = createMaterialTopTabNavigator();
const googleMapsOffIcon = require("./assets/google-maps-off.png");
const settingsDataVolume = "@settingsDataVolume";
const settingsDataMaps = "@settingsDataMaps";
const staticDataParkingGarage = "@staticData";

export default function App() {
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [volumeOn, setVolumeOn] = useState<boolean>(true);
    const [mapsOn, setMapsOn] = useState<boolean>(false);
    const [staticParkingData, setStaticParkingData] = useState<IGarage[]>([]);

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

        (async () => {
            let parkingGaragesTest = await AsyncStorage.getItem(staticDataParkingGarage);
            if (parkingGaragesTest === null) {
                await AsyncStorage.setItem(staticDataParkingGarage, JSON.stringify(parkingGarages));
                parkingGaragesTest = await AsyncStorage.getItem(staticDataParkingGarage);
            } else {
                // Um das statische Objekt in der Datenbank zu aktualisieren, falls sich parkingGarages in
                // der Datei staticDataParkingGarage.ts geändert hat => zuerst alle favorite-Werte auf false
                // setzen, damit diese den Vergleich nicht stören
                let parkingGarageBuffer: IGarage[] = JSON.parse(parkingGaragesTest);

                parkingGarageBuffer.forEach((garageObject: IGarage, index: number) => {
                    parkingGarageBuffer[index].favorite = false;
                });

                if (JSON.stringify(parkingGarageBuffer) !== JSON.stringify(parkingGarages)) {
                    // neues Objekt erstellen, das die Neuerungen von parkingGarages enthält, aber die
                    // alten favorite Werte beibehält
                    const parkingGarageFavorite: IGarage[] = JSON.parse(parkingGaragesTest);
                    let newParkingGarages: IGarage[] = [];
                    parkingGarages.forEach((garage) => {
                        const oldFavorite = parkingGarageFavorite.find(
                            (favoriteGarage) => garage.id === favoriteGarage.id
                        );
                        if (oldFavorite !== undefined) {
                            newParkingGarages.push({ ...garage, favorite: oldFavorite.favorite });
                        }
                    });
                    await AsyncStorage.setItem(staticDataParkingGarage, JSON.stringify(newParkingGarages));
                    parkingGaragesTest = await AsyncStorage.getItem(staticDataParkingGarage);
                }
            }
            const garageObject = parkingGaragesTest !== null ? (JSON.parse(parkingGaragesTest) as IGarage[]) : [];
            setStaticParkingData(garageObject);
        })();
    }, []);

    useEffect(() => {
        AsyncStorage.setItem(settingsDataVolume, JSON.stringify(volumeOn));
    }, [volumeOn]);

    useEffect(() => {
        AsyncStorage.setItem(settingsDataMaps, JSON.stringify(mapsOn));
    }, [mapsOn]);

    const setFavorite = async (id: number) => {
        const parkingGarages = await AsyncStorage.getItem(staticDataParkingGarage);
        if (parkingGarages === null) {
            Toast.show("Keine Daten vorhanden.\nBitte App neu starten.");
        } else {
            let parkingGarageBuffer: IGarage[] = JSON.parse(parkingGarages);
            let garageIndex = parkingGarageBuffer.findIndex((garage: IGarage) => garage.id === id);
            parkingGarageBuffer[garageIndex].favorite = !parkingGarageBuffer[garageIndex].favorite;
            AsyncStorage.setItem(staticDataParkingGarage, JSON.stringify(parkingGarageBuffer));
            setStaticParkingData(parkingGarageBuffer);
        }
    };

    return (
        <Provider>
            <RootSiblingParent>
                <NavigationContainer>
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
                            children={(props) => (
                                <Map
                                    staticParkingData={staticParkingData}
                                    volume={volumeOn}
                                    mapsOn={mapsOn}
                                    {...props}
                                />
                            )}
                            options={{
                                tabBarLabel: "Karte",
                                tabBarIcon: ({ color }) => <Ionicons name="map" size={25} color={color} />,
                            }}
                        />
                        <Tab.Screen
                            name="Liste"
                            children={(props) => (
                                <ParkingListNavigator
                                    setFavorite={setFavorite}
                                    staticParkingData={staticParkingData}
                                    {...props}
                                />
                            )}
                            options={{
                                tabBarLabel: "Liste",
                                tabBarIcon: ({ color }) => <Ionicons name="list" size={25} color={color} />,
                            }}
                        />
                    </Tab.Navigator>
                </NavigationContainer>
            </RootSiblingParent>
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
