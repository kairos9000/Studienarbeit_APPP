import * as React from "react";
import MapView, { Marker, Region } from "react-native-maps";
import { StyleSheet, Text, View, Dimensions, Button } from "react-native";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { parkingGarages } from "./staticDataParkingGarage";

const GEOFENCING_TASK = "GEOFENCING_TASK";

TaskManager.defineTask(GEOFENCING_TASK, ({ data, error }: any) => {
    if (error) {
        // check `error.message` for more details.
        return;
    }
    if (data.eventType === Location.GeofencingEventType.Enter) {
        console.log("You've entered region:", data.region);
    } else if (data.eventType === Location.GeofencingEventType.Exit) {
        console.log("You've left region:", data.region);
    }
});

export default function App() {
    // const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [region, setRegion] = useState<Region | undefined>(undefined);

    const getAPI = () => {
        fetch("https://parken.amberg.de/wp-content/uploads/pls/pls.xml")
            .then((response) => response.text())
            .then((text) => {
                const parser = new XMLParser();
                let xml = parser.parse(text);
                console.log(xml.Daten.Parkhaus);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    useEffect(() => {
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
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
            });
        })();

        let regions: Location.LocationRegion[] = [];

        parkingGarages.map((garage) => {
            regions.push({
                identifier: garage.name,
                latitude: garage.coords.latitude,
                longitude: garage.coords.longitude,
                notifyOnEnter: true,
                radius: 500,
            });
        });

        if (TaskManager.isTaskDefined(GEOFENCING_TASK)) {
            Location.startGeofencingAsync(GEOFENCING_TASK, regions);
        } else {
            setTimeout(() => {
                Location.startGeofencingAsync(GEOFENCING_TASK, regions);
            }, 5000);
        }
    }, []);
    return (
        <View style={styles.container}>
            <MapView style={styles.map} showsUserLocation followsUserLocation region={region}>
                {parkingGarages.map((garage) => (
                    <Marker
                        key={garage.id}
                        coordinate={garage.coords}
                        title={garage.name}
                        description={garage.additionalInformation}
                    />
                ))}
            </MapView>
            <Button title="getAPI" onPress={getAPI}></Button>
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
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height - 100,
    },
    button: {
        flex: 1,
    },
});
