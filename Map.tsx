import * as React from "react";
import MapView, { LatLng, Marker, Polyline, Region } from "react-native-maps";
import { StyleSheet, Text, View, Dimensions, Button } from "react-native";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { parkingGarages } from "./staticDataParkingGarage";
import { useGeofenceEvent } from "./Geofencing/geofencingHook";
import { RootSiblingParent } from "react-native-root-siblings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IGarage } from "./IGarage";
import { useAPIcall } from "./ParkingAPI/useAPIcall";
import { Directions } from "./Directions";
import { NavigationContainer, ParamListBase, RouteProp } from "@react-navigation/native";

const GEOFENCING_TASK = "GEOFENCING_TASK";
const staticDataParkingGarage = "@staticData";

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
}

export default function Map(props: IProps) {
    const { route, navigation, volume, mapsOn } = props;
    const [positions, setPositions] = useState<LatLng[]>([]);
    const [region, setRegion] = useState<Region>(defaultRegion);
    const [parkingData, setParkingData] = useState<IGarage[]>();
    const [showDirections, setShowDirections] = useState<LatLng>({ latitude: 0, longitude: 0 });

    const dynamicParkingData = useAPIcall(true);
    const nameAndInGeofence = useGeofenceEvent(volume, dynamicParkingData);

    useEffect(() => {
        // nameAndInGeofence.forEach((element) => {
        //     console.log(element.name, element.inGeofence);
        // });
        // console.log("\n");
    }, [JSON.stringify(nameAndInGeofence)]);

    useEffect(() => {
        // console.log(dynamicParkingData);
    }, [dynamicParkingData]);

    useEffect(() => {
        (async () => {
            let parkingGaragesTest = await AsyncStorage.getItem(staticDataParkingGarage);
            if (parkingGaragesTest === null) {
                await AsyncStorage.setItem(staticDataParkingGarage, JSON.stringify(parkingGarages));
                parkingGaragesTest = await AsyncStorage.getItem(staticDataParkingGarage);
            }
            const garageObject = parkingGaragesTest !== null ? (JSON.parse(parkingGaragesTest) as IGarage[]) : [];
            setParkingData(garageObject);
        })();

        (async () => {
            let status = (await Location.requestForegroundPermissionsAsync()).status;
            if (status !== "granted") {
                console.error("Permission to access location was denied");
                return;
            }
            status = (await Location.requestBackgroundPermissionsAsync()).status;
            if (status !== "granted") {
                console.error("Permission to access location was denied");
                return;
            }
            let location: Location.LocationObject = await Location.getCurrentPositionAsync({});
            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
            });
        })();

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
    }, []);

    useEffect(() => {
        setShowDirections({ latitude: 0, longitude: 0 });
    }, [mapsOn]);

    const abortNavigation = () => {
        setShowDirections({ latitude: 0, longitude: 0 });
    };

    const startNavigation = async () => {
        let location: Location.LocationObject = await Location.getCurrentPositionAsync({});
        setShowDirections(location.coords);
    };

    const resetNavigation = () => {
        setShowDirections({ latitude: 0, longitude: 0 });
    };

    return (
        <View style={styles.container}>
            <MapView style={styles.map} showsUserLocation followsUserLocation region={region}>
                {parkingData !== undefined &&
                    parkingData.map((garage) => (
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
