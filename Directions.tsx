import { useEffect, useState } from "react";
import { LatLng, Polyline } from "react-native-maps";
import { gpxFiles } from "./Navigation/gpxFiles";
import { XMLParser } from "fast-xml-parser";
import { haversineDistance } from "./Geofencing/haversineDistance";
import * as Location from "expo-location";
import { Linking, Platform } from "react-native";
import Toast from "react-native-root-toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IGarage } from "./IGarage";

interface IProps {
    alwaysUseMaps: boolean;
    userCoords: LatLng;
    resetNavigation(): void;
}

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
});

const staticDataParkingGarage = "@staticData";

export function Directions(props: IProps) {
    const { alwaysUseMaps, userCoords, resetNavigation } = props;
    const [directions, setDirections] = useState<LatLng[]>([]);

    const findCorrectGpxFile = (coords: LatLng) => {
        let minDistance = 100000;
        let minTrackPoints: any[] = [];
        gpxFiles.forEach((gpxFile) => {
            let xml = parser.parse(gpxFile);
            const trackPoints = xml.gpx.trk.trkseg.trkpt;

            const startingPoint = trackPoints[0];
            const distance = haversineDistance({ latitude: startingPoint.lat, longitude: startingPoint.lon }, coords);
            if (distance < 20) {
                return trackPoints;
            }

            if (distance < minDistance) {
                minDistance = distance;
                minTrackPoints = trackPoints;
            }
        });

        if (minTrackPoints.length === 0 || minDistance >= 100) {
            return null;
        }

        return minTrackPoints;
    };

    useEffect(() => {
        if (userCoords.latitude !== 0 && userCoords.longitude !== 0) {
            let correctFile = null;
            if (alwaysUseMaps === false) {
                correctFile = findCorrectGpxFile(userCoords);
            }

            if (correctFile === null) {
                AsyncStorage.getItem(staticDataParkingGarage).then((garageData) => {
                    if (garageData !== null) {
                        const parkingGarages: IGarage[] = JSON.parse(garageData);

                        let minDistance = 100000;
                        let minCoords: LatLng = { latitude: 0, longitude: 0 };

                        parkingGarages.forEach((garage) => {
                            const distance = haversineDistance(garage.coords, userCoords);
                            if (distance < minDistance) {
                                minDistance = distance;
                                minCoords = garage.coords;
                            }
                        });

                        const latLng = `${minCoords.latitude},${minCoords.longitude}`;

                        // Weiterleitung zu Google Maps => wenn keine App installiert ist, dann im Browser
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${latLng}`;

                        resetNavigation();
                        Toast.show("Weiterleitung zu Google Maps.", { position: Toast.positions.CENTER });
                        Linking.openURL(url);
                    } else {
                        Toast.show("Parkhausdaten konnten nicht gefunden werden.", {
                            duration: Toast.durations.LONG,
                            position: Toast.positions.BOTTOM,
                        });
                    }
                });
                // zu Google Maps weitergehen
            } else {
                const extractedPositions: LatLng[] = [];
                correctFile.forEach((trackPoint: any) => {
                    extractedPositions.push({
                        latitude: Number(trackPoint.lat),
                        longitude: Number(trackPoint.lon),
                    });
                });
                setDirections(extractedPositions);
            }
        } else {
            setDirections([]);
        }
    }, [userCoords]);

    return (
        <Polyline
            coordinates={directions}
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
    );
}
