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
import { XMLParser } from "fast-xml-parser";
import { Altstadtring } from "./Altstadtring copy";

const GEOFENCING_TASK = "GEOFENCING_TASK";
const staticDataParkingGarage = "@staticData";

const defaultRegion = {
    latitude: 49.44594,
    longitude: 11.85664,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
};

export default function App() {
    const [positions, setPositions] = useState<LatLng[]>([]);
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

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
        });
        let xml = parser.parse(Altstadtring);
        const trackPoints = xml.gpx.trk.trkseg.trkpt;

        const extractedPositions: LatLng[] = [];
        trackPoints.forEach((trackPoint: any) => {
            extractedPositions.push({ latitude: Number(trackPoint.lat), longitude: Number(trackPoint.lon) });
        });
        setPositions(extractedPositions);
    }, []);

    const abortNavigation = () => {
        setPositions([]);
    };

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

                    <Polyline
                        coordinates={positions}
                        strokeColor="#4285F4" // fallback for when `strokeColors` is not supported by the map-provider
                        strokeColors={[
                            "#7F0000",
                            "#00000000", // no color, creates a "long" gradient between the previous and next coordinate
                            "#B24112",
                            "#E5845C",
                            "#238C23",
                            "#7F0000",
                        ]}
                        strokeWidth={6}
                    />
                </MapView>
                <Button title="Abbrechen" onPress={abortNavigation}></Button>
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
