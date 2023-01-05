import * as React from "react";
import MapView, { Marker, Region } from "react-native-maps";
import { StyleSheet, Text, View, Dimensions, Button } from "react-native";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { parkingGarages } from "./staticDataParkingGarage";
import { useGeofenceEvent } from "./Geofencing/geofencingHook";
import { RootSiblingParent } from "react-native-root-siblings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IGarage } from "./IGarage";
import { useAPIcall } from "./ParkingAPI/useAPIcall";

const GEOFENCING_TASK = "GEOFENCING_TASK";
const staticDataParkingGarage = "@staticData";

const defaultRegion = {
    latitude: 49.44594,
    longitude: 11.85664,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
};

export default function App() {
    // const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [region, setRegion] = useState<Region>(defaultRegion);
    const [parkingData, setParkingData] = useState<IGarage[]>();

    const nameAndInGeofence = useGeofenceEvent();
    const dynamicParkingData = useAPIcall();

    useEffect(() => {
        nameAndInGeofence.forEach((element) => {
            console.log(element.name, element.inGeofence);
        });
        console.log("\n");
    }, [JSON.stringify(nameAndInGeofence)]);

    useEffect(() => {
        console.log(dynamicParkingData);
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
    return (
        <RootSiblingParent>
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
                </MapView>
            </View>
        </RootSiblingParent>
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
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height - 100,
    },
});
