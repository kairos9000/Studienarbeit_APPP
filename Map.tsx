import * as React from "react";
import MapView, { LatLng, Marker, Region } from "react-native-maps";
import { StyleSheet, View, Dimensions, Button } from "react-native";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useGeofenceEvent } from "./Geofencing/geofencingHook";
import { IGarage } from "./IGarage";
import { useAPIcall } from "./ParkingAPI/useAPIcall";
import { Directions } from "./Directions";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import Toast from "react-native-root-toast";

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
}

export interface DirectionCoords {
    startCoords: LatLng;
    destCoords: LatLng;
}

const emptyDirCoords: DirectionCoords = {
    startCoords: { latitude: 0, longitude: 0 },
    destCoords: { latitude: 0, longitude: 0 },
};

export default function Map(props: IProps) {
    const { route, navigation, volume, mapsOn, staticParkingData } = props;
    const [positions, setPositions] = useState<LatLng[]>([]);
    const [region, setRegion] = useState<Region>(defaultRegion);
    const [showDirections, setShowDirections] = useState<DirectionCoords>(emptyDirCoords);

    const dynamicParkingData = useAPIcall(true);
    const nameAndInGeofence = useGeofenceEvent(volume, dynamicParkingData);

    useEffect(() => {
        if (route.params !== undefined) {
            const params: any = route.params;
            startNavigation(params.destinationCoords!);
        }
    }, [route]);

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
                            accuracy: Location.LocationAccuracy.BestForNavigation,
                            // Updates nur wenn sich der Nutzer bewegt hat => performanter
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
        setShowDirections(emptyDirCoords);
    }, [mapsOn]);

    const abortNavigation = () => {
        setShowDirections(emptyDirCoords);
    };

    const startNavigation = async (destinationCoords: LatLng = { latitude: 0, longitude: 0 }) => {
        Location.getCurrentPositionAsync({})
            .then((location) => {
                setShowDirections({ startCoords: location.coords, destCoords: destinationCoords });
            })
            .catch(() => {
                Toast.show("Standort-Erlaubnis wurde nicht erteilt!\n" + "Keine Navigation möglich.");
            });
    };

    const resetNavigation = () => {
        setShowDirections(emptyDirCoords);
    };

    return (
        <View style={styles.container}>
            <MapView style={styles.map} showsUserLocation followsUserLocation region={region}>
                {staticParkingData !== undefined &&
                    staticParkingData.map((garage) => (
                        <Marker
                            key={garage.id}
                            coordinate={garage.coords}
                            title={garage.name}
                            description={garage.additionalInformation}
                        />
                    ))}

                <Directions
                    alwaysUseMaps={mapsOn}
                    dirCoords={showDirections}
                    resetNavigation={resetNavigation}
                ></Directions>
            </MapView>
            <Button title="Starten" onPress={() => startNavigation()}></Button>
            <Button title="Abbrechen" onPress={abortNavigation}></Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    map: {
        flex: 10,
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
    },
});
