import * as React from "react";
import MapView, { Region } from "react-native-maps";
import { StyleSheet, Text, View, Dimensions, Button } from "react-native";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";
import { useEffect, useState } from "react";
import * as Location from "expo-location";

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
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.error("Permission to access location was denied");
                return;
            }

            let location: Location.LocationObject = await Location.getCurrentPositionAsync({});
            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        })();
    }, []);
    return (
        <View style={styles.container}>
            <MapView style={styles.map} showsUserLocation followsUserLocation region={region} />
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
