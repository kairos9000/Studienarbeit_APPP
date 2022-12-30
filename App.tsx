import * as React from "react";
import MapView, { Marker, Region } from "react-native-maps";
import { StyleSheet, Text, View, Dimensions, Button } from "react-native";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as SQLite from "expo-sqlite";
import { parkingGarages } from "./staticDataParkingGarage";
import { useGeofenceEvent } from "./helper/geofencingHook";

const GEOFENCING_TASK = "GEOFENCING_TASK";

const db = SQLite.openDatabase("db.ParkingGarages"); // returns Database object

const populateStaticDataTable = () => {
    parkingGarages.map((garage) => {
        db.transaction((tx) => {
            tx.executeSql(
                `INSERT INTO GarageStaticData
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    garage.id,
                    garage.name,
                    garage.coords.latitude,
                    garage.coords.longitude,
                    garage.numberOfParkingSpots,
                    garage.openingHours.startHour,
                    garage.openingHours.endHour,
                    garage.additionalInformation ? garage.additionalInformation : null,
                ]
            );
        });
    });
};

export default function App() {
    // const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [region, setRegion] = useState<Region | undefined>(undefined);
    const nameAndInGeofence = useGeofenceEvent();

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
        console.log(nameAndInGeofence);
    }, [nameAndInGeofence]);

    useEffect(() => {
        // Check if the items table exists if not create it
        db.transaction((tx) => {
            tx.executeSql(
                `CREATE TABLE IF NOT EXISTS Pricing (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, FOREIGN KEY(garage) REFERENCES GarageStaticData(id),
                isDayPricing INT, firstHour INT NOT NULL, followingHours INT NOT NULL, numHoursSpecialPrices INT, priceSpecialPrices INT, 
                startHours VARCHAR(10), endHours VARCHAR(10))`
            );
        });
        db.transaction((tx) => {
            tx.executeSql(
                `CREATE TABLE IF NOT EXISTS GarageStaticData (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL,
                numberOfParkingSpots INT NOT NULL, openingStartHour VARCHAR(10) NOT NULL, openingEndHour VARCHAR(10) NOT NULL, additionalInfo TEXT)`
            );
        });
        db.transaction((tx) => {
            tx.executeSql(`SELECT COUNT(*) FROM GarageStaticData`, [], (transaction, result) => {
                if (result.rows.item(0)["COUNT(*)"] !== parkingGarages.length) {
                    populateStaticDataTable();
                }
            });
        });
        db.transaction((tx) => {
            tx.executeSql(`SELECT * FROM GarageStaticData`, [], (transaction, result) => {
                console.log(result.rows);
            });
        });
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
                radius: 200,
            });
        });

        if (TaskManager.isTaskDefined(GEOFENCING_TASK)) {
            Location.startLocationUpdatesAsync(GEOFENCING_TASK, {
                accuracy: Location.LocationAccuracy.BestForNavigation,
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
