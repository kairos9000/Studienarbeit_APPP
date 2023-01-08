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

export default function Map(props: IProps) {
    const { route, navigation, volume, mapsOn, staticParkingData } = props;
    const [positions, setPositions] = useState<LatLng[]>([]);
    const [region, setRegion] = useState<Region>(defaultRegion);
    const [showDirections, setShowDirections] = useState<LatLng>({ latitude: 0, longitude: 0 });

    const dynamicParkingData = useAPIcall(true);
    const nameAndInGeofence = useGeofenceEvent(volume, dynamicParkingData);

    useEffect(() => {
        console.log(route.params);
    }, [route]);

    useEffect(() => {
        let status = "";
        (async () => {
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
        })();

        if (status === "granted") {
            if (TaskManager.isTaskDefined(GEOFENCING_TASK)) {
                Location.startLocationUpdatesAsync(GEOFENCING_TASK, {
                    accuracy: Location.LocationAccuracy.BestForNavigation,
                    deferredUpdatesDistance: 5,
                    deferredUpdatesInterval: 500,
                });
            } else {
                setTimeout(() => {
                    Location.startLocationUpdatesAsync(GEOFENCING_TASK, {
                        accuracy: Location.LocationAccuracy.BestForNavigation,
                    });
                }, 5000);
            }
        }
    }, []);

    useEffect(() => {
        setShowDirections({ latitude: 0, longitude: 0 });
    }, [mapsOn]);

    const abortNavigation = () => {
        setShowDirections({ latitude: 0, longitude: 0 });
    };

    const startNavigation = async () => {
        Location.getCurrentPositionAsync({})
            .then((location) => {
                setShowDirections(location.coords);
            })
            .catch(() => {
                Toast.show("Standort-Erlaubnis wurde nicht erteilt!\n" + "Keine Navigation möglich.");
            });
    };

    const resetNavigation = () => {
        setShowDirections({ latitude: 0, longitude: 0 });
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
                    userCoords={showDirections}
                    resetNavigation={resetNavigation}
                ></Directions>
            </MapView>
            <Button title="Starten" onPress={startNavigation}></Button>
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
