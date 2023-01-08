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
import { colors } from "./colors";
import { DirectionCoords } from "./Map";

interface IProps {
    alwaysUseMaps: boolean;
    dirCoords: DirectionCoords;
    resetNavigation(): void;
}

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
});

const staticDataParkingGarage = "@staticData";

export function Directions(props: IProps) {
    const { alwaysUseMaps, dirCoords, resetNavigation } = props;
    const [directions, setDirections] = useState<LatLng[]>([]);

    const findCorrectGpxFile = (startCoords: LatLng, destCoords: LatLng) => {
        // nähestes Parkhaus finden
        if (destCoords.latitude === 0 && destCoords.longitude === 0) {
            let minDistance = 100000;
            let minTrackPoints: any[] = [];
            gpxFiles.forEach((gpxFile) => {
                let xml = parser.parse(gpxFile);
                const trackPoints = xml.gpx.trk.trkseg.trkpt;

                const startingPoint = trackPoints[0];

                const distance = haversineDistance(
                    { latitude: startingPoint.lat, longitude: startingPoint.lon },
                    startCoords
                );
                console.log(distance);
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

            // möglichst Parkhaus mit startCoords als Start-Koordinaten und destCoords als End-Koordinaten finden
        } else {
            let possibleTrackPoints: any[] = [];
            gpxFiles.forEach((gpxFile) => {
                let xml = parser.parse(gpxFile);
                const trackPoints = xml.gpx.trk.trkseg.trkpt;

                const startingPoint = trackPoints[0];
                const distance = haversineDistance(
                    { latitude: startingPoint.lat, longitude: startingPoint.lon },
                    startCoords
                );

                // nur gpx-Dateien nehmen, bei denen die Start-Koordinaten weniger als 50m von startCoords entfernt ist
                if (distance < 50) {
                    possibleTrackPoints.push(trackPoints);
                }
            });

            if (possibleTrackPoints.length === 0) {
                return null;
            } else {
                let correctTrackPoints: any[] = [];
                possibleTrackPoints.forEach((trackPoints) => {
                    const lastTrackPoint = trackPoints.slice(-1)[0];
                    const distance = haversineDistance(
                        { latitude: lastTrackPoint.lat, longitude: lastTrackPoint.lon },
                        destCoords
                    );

                    if (distance < 50) {
                        correctTrackPoints = trackPoints;
                    }
                });
                if (correctTrackPoints.length !== 0) {
                    return correctTrackPoints;
                }
                return null;
            }
        }
    };

    useEffect(() => {
        if (dirCoords.startCoords.latitude !== 0 && dirCoords.startCoords.longitude !== 0) {
            let correctFile = null;
            if (alwaysUseMaps === false) {
                correctFile = findCorrectGpxFile(dirCoords.startCoords, dirCoords.destCoords);
            }

            if (correctFile === null) {
                let destCoords: LatLng = dirCoords.destCoords;

                if (dirCoords.destCoords.latitude === 0 && dirCoords.destCoords.longitude === 0) {
                    AsyncStorage.getItem(staticDataParkingGarage).then((garageData) => {
                        if (garageData !== null) {
                            const parkingGarages: IGarage[] = JSON.parse(garageData);

                            let minDistance = 100000;
                            let minCoords: LatLng = { latitude: 0, longitude: 0 };

                            parkingGarages.forEach((garage) => {
                                const distance = haversineDistance(garage.coords, dirCoords.startCoords);
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    minCoords = garage.coords;
                                }
                            });
                            destCoords = minCoords;
                        } else {
                            Toast.show("Parkhausdaten konnten nicht gefunden werden.", {
                                duration: Toast.durations.LONG,
                                position: Toast.positions.BOTTOM,
                            });
                        }
                    });
                }
                // Weiterleitung zu Google Maps => wenn keine App installiert ist, dann im Browser
                const latLng = `${destCoords.latitude},${destCoords.longitude}`;
                const url = `https://www.google.com/maps/dir/?api=1&destination=${latLng}`;
                Toast.show("Weiterleitung zu Google Maps.", { position: Toast.positions.CENTER });
                resetNavigation();
                Linking.openURL(url);
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
    }, [dirCoords]);

    return (
        <Polyline
            coordinates={directions}
            strokeColor={colors.navigationBlue} // fallback for when `strokeColors` is not supported by the map-provider
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
