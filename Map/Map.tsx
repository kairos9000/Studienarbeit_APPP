import * as React from "react";
import MapView, { Callout, LatLng, Marker, Region } from "react-native-maps";
import { StyleSheet, View, Dimensions, Button, Pressable, Text } from "react-native";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useGeofenceEvent } from "../Geofencing/geofencingHook";
import { IGarage } from "../IGarage";
import { useAPIcall } from "../ParkingAPI/useAPIcall";
import { Directions } from "./Directions";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import Toast from "react-native-root-toast";
import { findCorrectGpxFile } from "../Navigation/findCorrectGpxFile";
import { Card, Divider, Menu, Title } from "react-native-paper";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../colors";
import { InfoCard } from "./InfoCard";

const GEOFENCING_TASK = "GEOFENCING_TASK";

const defaultRegion = {
    latitude: 49.44594,
    longitude: 11.85664,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
};

interface IProps {
    route: RouteProp<ParamListBase, "Karte">;
    navigation: any;
    volume: boolean;
    mapsOn: boolean;
    staticParkingData: IGarage[];
    setFavorite(id: number): void;
}

export interface DirectionCoords {
    startCoords: LatLng;
    destCoords: LatLng;
}

export default function Map(props: IProps) {
    const { route, navigation, volume, mapsOn, staticParkingData, setFavorite } = props;
    const [positions, setPositions] = useState<LatLng[]>([]);
    const [region, setRegion] = useState<Region>(defaultRegion);
    const [showDirections, setShowDirections] = useState<any[]>([]);
    const [showMenu, setShowMenu] = useState<boolean>(false);
    const [markerList, setMarkerList] = useState<any[]>([]);
    const [showInfoBox, setShowInfoBox] = useState<boolean>(false);
    const [info, setInfo] = useState<any>({ freeSpacesPercent: 0.0 });

    const dynamicParkingData = useAPIcall(true);
    const nameAndInGeofence = useGeofenceEvent(volume, dynamicParkingData);

    useEffect(() => {
        if (route.params !== undefined) {
            if ("trackPoints" in route.params) {
                startNavigation(route.params.trackPoints as any[]);
            }
        }
    }, [route]);

    useEffect(() => {
        let markerListBuffer: any[] = [];
        staticParkingData.forEach((garage) => {
            const dynamicData = dynamicParkingData.Parkhaus.find((dynamicGarage) => dynamicGarage.ID === garage.id);
            if (dynamicData !== undefined) {
                const freeSpacesPercent = Math.round((dynamicData.Frei / dynamicData.Gesamt) * 10) / 10;
                markerListBuffer.push({ ...garage, trend: dynamicData.Trend, freeSpacesPercent: freeSpacesPercent });
            }
        });
        setMarkerList(markerListBuffer);

        if (showInfoBox === true && info !== undefined) {
            showGarageInfo(info.id);
        }
    }, [staticParkingData, dynamicParkingData]);

    useEffect(() => {
        let status = "";
        // Anfragen der Erlaubnis für die Positionsdaten vom Nutzer
        (async () => {
            try {
                status = (await Location.requestForegroundPermissionsAsync()).status;
                if (status !== "granted") {
                    Toast.show("Standort-Erlaubnis wurde nicht erteilt!\n" + "Keine Navigation möglich.");
                    return;
                }
                status = (await Location.requestBackgroundPermissionsAsync()).status;
                if (status !== "granted") {
                    Toast.show("Standort-Erlaubnis wurde nicht erteilt!\n" + "Keine Navigation möglich.");
                    return;
                }
                if (status === "granted") {
                    let location: Location.LocationObject = await Location.getCurrentPositionAsync({});
                    setRegion({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.03,
                        longitudeDelta: 0.03,
                    });
                }
            } catch {
                Toast.show("Standort-Erlaubnis wurde nicht erteilt!\n" + "Keine Navigation möglich.");
            }

            // Starten der kontinuierlichen Updates der Position des Nutzers, für das Geofencing
            if (status === "granted") {
                if (TaskManager.isTaskDefined(GEOFENCING_TASK)) {
                    try {
                        Location.startLocationUpdatesAsync(GEOFENCING_TASK, {
                            // Updates nur wenn sich der Nutzer bewegt hat => performanter
                            // Bugs möglich wenn Genauigkeit des Updates zu hoch gesetzt wird, z.B.
                            // Location.LocationAccuracy.BestForNavigation => führt zu zu vielen
                            // Updates, bei denen sich die Position des Nutzers kaum bis gar nicht ändert
                            deferredUpdatesDistance: 5,
                            deferredUpdatesInterval: 500,
                        });
                    } catch {
                        Toast.show("Standort-Erlaubnis wurde nicht erteilt!\n" + "Keine Navigation möglich.");
                    }
                } else {
                    // Falls noch kein Task definiert war, 5 Sekunden warten und nochmal versuchen
                    setTimeout(() => {
                        try {
                            Location.startLocationUpdatesAsync(GEOFENCING_TASK, {
                                accuracy: Location.LocationAccuracy.BestForNavigation,
                            });
                        } catch {
                            Toast.show("Standort-Erlaubnis wurde nicht erteilt!\n" + "Keine Navigation möglich.");
                        }
                    }, 5000);
                }
            }
        })();
    }, []);

    useEffect(() => {
        setShowDirections([]);
    }, [mapsOn]);

    const abortNavigation = () => {
        setShowDirections([]);
    };

    const startNavigation = async (trackPoints: any[]) => {
        if (trackPoints.length === 0) {
            findCorrectGpxFile({ latitude: 0, longitude: 0 }, mapsOn)
                .then((nearestTrackPoints) => {
                    if (nearestTrackPoints !== null) {
                        setShowDirections(nearestTrackPoints);
                    }
                })
                .catch(() => {
                    Toast.show("Ein Fehler bei der Routen-Suche ist aufgetreten.");
                });
        }
        setShowDirections(trackPoints);
    };

    const resetNavigation = () => {
        setShowDirections([]);
    };

    const checkIfMenuNecessary = () => {
        let navigationToNearest = true;
        nameAndInGeofence.forEach((garage) => {
            if (garage.inGeofence === true) {
                setShowMenu(true);
                navigationToNearest = false;
            }
        });

        if (navigationToNearest) {
            startNavigation([]);
        }
    };

    const navigateToSpecificParkingGarage = (id: number) => {
        const staticData = staticParkingData.find((garage) => id === garage.id);

        if (staticData !== undefined) {
            findCorrectGpxFile(staticData.coords, mapsOn)
                .then((trackPoints) => {
                    if (trackPoints !== null) {
                        startNavigation(trackPoints);
                    }
                })
                .catch(() => {
                    Toast.show("Fehler bei der Navigation.");
                });
        } else {
            Toast.show("Parkhaus konnte nicht gefunden werden.");
        }
    };

    const showGarageInfo = (id: number) => {
        const dynamicData = dynamicParkingData.Parkhaus.find((dynamicGarage) => dynamicGarage.ID === id);
        const staticData = staticParkingData.find((staticGarage) => staticGarage.id === id);

        if (dynamicData !== undefined && staticData !== undefined) {
            const freeSpacesPercent = dynamicData.Frei / dynamicData.Gesamt;
            setInfo({
                id: id,
                freeSpacesPercent: freeSpacesPercent,
                name: staticData.name,
                freeSpaces: dynamicData.Frei,
                allSpaces: dynamicData.Gesamt,
                favorite: staticData.favorite,
            });
            setShowInfoBox(true);
        }
    };

    return (
        <View style={styles.container}>
            <MapView style={styles.map} showsUserLocation followsUserLocation region={region}>
                {markerList.map((garage) => (
                    <Marker
                        key={garage.id}
                        coordinate={garage.coords}
                        // title={garage.name}
                        // description={garage.additionalInformation}
                        onPress={() => showGarageInfo(garage.id)}
                        onDeselect={() => setShowInfoBox(false)}
                    >
                        <View style={styles.fillView} />
                        <MaterialCommunityIcons
                            size={50}
                            color={
                                garage.trend === 1
                                    ? colors.red
                                    : garage.trend === -1
                                    ? colors.primaryBackground
                                    : colors.fontGray
                            }
                            name={
                                garage.trend === 1
                                    ? "map-marker-up"
                                    : garage.trend === -1
                                    ? "map-marker-down"
                                    : "map-marker"
                            }
                        ></MaterialCommunityIcons>
                    </Marker>
                ))}

                <Directions
                    alwaysUseMaps={mapsOn}
                    dirCoords={showDirections}
                    resetNavigation={resetNavigation}
                ></Directions>
            </MapView>
            {showInfoBox === true && info !== undefined && (
                <InfoCard
                    navigateToParkingGarage={(id: number) => navigateToSpecificParkingGarage(id)}
                    info={info}
                    showInfoBox={(value: boolean) => setShowInfoBox(value)}
                    setFavorite={setFavorite}
                ></InfoCard>
            )}
            <View style={styles.navigationContainer}>
                {showDirections.length === 0 ? (
                    <Menu
                        visible={showMenu}
                        onDismiss={() => setShowMenu(false)}
                        anchorPosition="top"
                        anchor={
                            <Button
                                onPress={checkIfMenuNecessary}
                                title="Starten"
                                color={colors.navigationBlue}
                            ></Button>
                        }
                    >
                        <Menu.Item onPress={() => startNavigation([])} title="Nähestes Parkhaus" />
                        {nameAndInGeofence.map((garage) => {
                            if (garage.inGeofence !== false) {
                                return (
                                    <View>
                                        <Divider />
                                        <Menu.Item
                                            onPress={() => navigateToSpecificParkingGarage(garage.id)}
                                            title={garage.name}
                                            key={garage.id}
                                        />
                                    </View>
                                );
                            }
                        })}
                    </Menu>
                ) : (
                    <Button title="Abbrechen" color={colors.navigationBlue} onPress={abortNavigation}></Button>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    map: {
        flex: 1,
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
    },
    navigationContainer: {
        position: "absolute",
        bottom: 20,
        right: 13,
    },
    fillView: {
        position: "absolute",
        top: 10,
        right: 14,
        width: 20,
        height: 20,
        backgroundColor: colors.white,
    },
    calloutContainer: {
        width: 250,
        height: 200,
        alignItems: "center",
    },
});
