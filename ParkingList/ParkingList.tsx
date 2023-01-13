import * as React from "react";
import { StyleSheet, View, FlatList, Switch, Text, Pressable } from "react-native";
import { DynamicParkingData, XMLData } from "../ParkingAPI/useAPIcall";
import { useEffect, useState, useMemo } from "react";
import { colors } from "../colors";
import { IGarage } from "../IGarage";
import { ParkingListItem } from "./ParkingListItem";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { Divider, Menu } from "react-native-paper";
import { haversineDistance } from "../Geofencing/haversineDistance";
import { useGeofenceEvent } from "../Geofencing/geofencingHook";
import { LatLng } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ItemInformation {
    id: number;
    name: string;
    trend: number;
    open: number;
    distance: number;
}

type Sorting = "Alphabet" | "Distance" | "FreeSpace";

const listSorting = "@listSorting";
const listFavorite = "@listFavorite";

const IconPlaceHolder = () => {
    // colors.background ist nicht exakt die richtige Farbe vom Hintergrund des Menüs bei
    // react-native-paper aber nah genug dran, damit das Icon unsichtbar wird
    return <MaterialCommunityIcons name="check" color={colors.background}></MaterialCommunityIcons>;
};

interface IProps {
    navigation: any;
    dynamicParkingData: XMLData;
    staticParkingData: IGarage[];
}

export default function ParkingList(props: IProps) {
    const { navigation, dynamicParkingData, staticParkingData } = props;
    const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [sorting, setSorting] = useState<Sorting>("Alphabet");
    // damit sich die Entfernungen zu den Parkhäusern in der Liste automatisch aktualisieren
    const userCoords = useGeofenceEvent(false, { Parkhaus: [], Zeitstempel: 0 }, true);

    const dataWithDistance = (coordsOfUser: LatLng) => {
        let distanceData: any[] = [];
        // Durchgehen der Daten und erstellen einer Liste, welche die IDs und die Entfernung
        // des Nutzers zu jedem Parkhaus enthält
        dynamicParkingData.Parkhaus.forEach((garage: DynamicParkingData) => {
            const staticData: IGarage | undefined = staticParkingData.find((data: IGarage) => garage.ID === data.id);

            if (staticData !== undefined) {
                const distance = haversineDistance(coordsOfUser, staticData.coords);
                distanceData.push({ ...garage, distance: distance });
            }
        });
        return distanceData;
    };

    // die Listendaten memoizen, damit diese Berechnung nur ausgeführt wird, wenn sich eine
    // der Dependencies ändert und der Wert gecachet wird => performanter
    const listData = useMemo(() => {
        let dynamicDataWithDistance: any[] = [];
        // Berechnung der Distanz, wenn keine Daten vom Hook gegeben wurden
        if (userCoords.length === 0) {
            // Nutzer-Position hier manuell zu holen würde viele await-callbacks erzeugen
            // und die App unperformant machen, wenn noch keine Daten
            // aus dem Geofence-Hook geliefert wurde => nur n.a. als Distanz angeben, bis der Geofence Hook
            // Daten liefert
            // callbacks wurden durch "Hack" mit selbst aufrufender async-await Funktion erstellt, also
            // (async () => {})(); => führt bei zu vielen Aufrufen zu Performanceproblemen, da diese Funktionen
            // auf den Callback-Stapel gelegt werden, und die App nicht mehr mit Aktualisieren mitkommt.
            // Den "Hack" nur in useEffects einfügen, die nur einmal aufgerufen werden oder
            // gar nicht
            dynamicParkingData.Parkhaus.forEach((garage: DynamicParkingData) => {
                dynamicDataWithDistance.push({ ...garage, distance: "n.a." });
            });
            // Berechnung mit Daten des Hooks
        } else {
            dynamicDataWithDistance = dataWithDistance(userCoords[0].getUserCoords!);
        }
        let listDataBuffer: ItemInformation[] = [];
        if (staticParkingData.length > 0) {
            if (sorting === "Distance") {
                // Sortieren der Daten nach der Reihenfolge des Arrays aus IDs der Parkhäuser
                dynamicDataWithDistance.sort((a: any, b: any) => (a.distance > b.distance ? 1 : -1));
            } else if (sorting === "FreeSpace") {
                dynamicDataWithDistance.sort((a: any, b: any) => (a.Frei < b.Frei ? 1 : -1));
            } else {
                dynamicDataWithDistance.sort((a: any, b: any) => (a.Name > b.Name ? 1 : -1));
            }
            // Erstellen der Liste für die FlatList aus den dynamischen und statischen Daten
            dynamicDataWithDistance.forEach((garage: any) => {
                const staticData = staticParkingData.find((data: IGarage) => garage.ID === data.id);
                if (staticData !== undefined) {
                    if (showOnlyFavorites === false || (showOnlyFavorites === true && staticData.favorite === true)) {
                        listDataBuffer.push({
                            id: staticData.id,
                            name: staticData.name,
                            trend: garage.Trend,
                            open: garage.Geschlossen,
                            distance: Math.round(garage.distance),
                        });
                    }
                }
            });
        }
        return listDataBuffer;
    }, [staticParkingData, dynamicParkingData, showOnlyFavorites, sorting, userCoords]);

    useEffect(() => {
        AsyncStorage.getItem(listSorting).then((value) => {
            if (value !== null) {
                setSorting(JSON.parse(value));
            }
        });
        AsyncStorage.getItem(listFavorite).then((value) => {
            if (value !== null) {
                setShowOnlyFavorites(JSON.parse(value));
            }
        });
    }, []);

    useEffect(() => {
        AsyncStorage.setItem(listSorting, JSON.stringify(sorting));
    }, [sorting]);

    useEffect(() => {
        AsyncStorage.setItem(listFavorite, JSON.stringify(showOnlyFavorites));
    }, [showOnlyFavorites]);

    const onPress = (item: ItemInformation) => {
        navigation.navigate(item.name);
    };

    return (
        <View style={styles.container}>
            <View style={styles.configurationContainer}>
                <View style={{ flexDirection: "row" }}>
                    <Text style={{ margin: 10, fontSize: 20 }}>Nur Favoriten</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: colors.primaryBackground }}
                        thumbColor={"#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={() => setShowOnlyFavorites(!showOnlyFavorites)}
                        value={showOnlyFavorites}
                    />
                </View>
                <Menu
                    visible={showMenu}
                    onDismiss={() => setShowMenu(false)}
                    anchorPosition="bottom"
                    anchor={
                        <Pressable
                            onPress={() => setShowMenu(true)}
                            android_ripple={{ color: colors.fontGray, radius: 24 }}
                        >
                            <FontAwesome
                                name="sort-amount-desc"
                                backgroundColor="transparent"
                                underlayColor="transparent"
                                color={colors.black}
                                size={30}
                                style={{ margin: 10 }}
                            ></FontAwesome>
                        </Pressable>
                    }
                >
                    <Menu.Item
                        onPress={() => setSorting("Alphabet")}
                        title="Alphabetisch"
                        leadingIcon={sorting === "Alphabet" ? "check" : IconPlaceHolder}
                    />
                    <Divider />
                    <Menu.Item
                        onPress={() => setSorting("Distance")}
                        title="Entfernung"
                        leadingIcon={sorting === "Distance" ? "check" : IconPlaceHolder}
                    />
                    <Divider />
                    <Menu.Item
                        onPress={() => setSorting("FreeSpace")}
                        title="Freie Plätze"
                        leadingIcon={sorting === "FreeSpace" ? "check" : IconPlaceHolder}
                    />
                </Menu>
            </View>
            <FlatList
                data={listData}
                renderItem={(listItem) => <ParkingListItem onPress={onPress} item={listItem.item} />}
                keyExtractor={(item) => item.id.toString()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray,
        alignItems: "center",
        justifyContent: "center",
    },
    configurationContainer: {
        width: "100%",
        backgroundColor: colors.white,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: colors.fontGray,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.29,
        shadowRadius: 4.65,

        elevation: 7,
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row",
        padding: 10,
    },
});
