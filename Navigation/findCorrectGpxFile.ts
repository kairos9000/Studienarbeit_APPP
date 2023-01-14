import { LatLng } from "react-native-maps";
import * as Location from "expo-location";
import { gpxFiles } from "./gpxFiles";
import { XMLParser } from "fast-xml-parser";
import { haversineDistance } from "../Geofencing/haversineDistance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IGarage } from "../IGarage";
import Toast from "react-native-root-toast";
import { Linking } from "react-native";

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
});

const staticDataParkingGarage = "@staticData";

// GPX-Datei finden, die zum einem Parkhaus vom Altstadtring aus führt
export const findCorrectGpxFile = (destCoords: LatLng, alwaysUseMaps: boolean) => {
    return Location.getCurrentPositionAsync()
        .then((location) => {
            const startCoords: LatLng = { latitude: location.coords.latitude, longitude: location.coords.longitude };
            // damit der Rückgabewert beim Aufruf mit dem erwarteten Schema Promise<any[] | null> übereinstimmt
            if (alwaysUseMaps === true) {
                forwardToGoogleMaps(startCoords, destCoords);
                return null;
            }
            // nähestes Parkhaus finden
            if (destCoords.latitude === 0 && destCoords.longitude === 0) {
                let minDistance = 100000;
                let minTrackPoints: any[] = [];
                // Eigener GPX-Datei Parser mithilfe des XML-Parsers, da im Internet kein guter gefunden werden konnte
                gpxFiles.forEach((gpxFile) => {
                    let xml = parser.parse(gpxFile);
                    const trackPoints = xml.gpx.trk.trkseg.trkpt;

                    const startingPoint = trackPoints[0];

                    // Berechnung der Luftlinie zwischen den Koordinaten des Startpunkts
                    // der GPX-Datei und den aktuellen Koordinaten des Nutzers
                    const distance = haversineDistance(
                        { latitude: startingPoint.lat, longitude: startingPoint.lon },
                        startCoords
                    );

                    // Wenn Entfernung kleiner als 20m ist abbrechen => wird wahrscheinlich nicht viel besser
                    // und räumlicher Unterschied zwischen Startpunkt der GPX-Datei und dem NUtzer kaum
                    // sichtbar
                    if (distance < 20) {
                        return trackPoints;
                    }

                    // GPX-Datei mit minimalster Entfernung zum Startpunkt
                    if (distance < minDistance) {
                        minDistance = distance;
                        minTrackPoints = trackPoints;
                    }
                });

                // Wenn keine Datei gefunden wurde oder die Entfernung zum nähesten Startpunkt mehr
                // als 100m sind => Google Maps aufrufen, da Nutzer wahrscheinlich nicht auf dem
                // Altstadtring ist, weil die GPX-Dateien in möglichst unter 100m Abständen gewählt wurden
                if (minTrackPoints.length === 0 || minDistance >= 100) {
                    forwardToGoogleMaps(startCoords, destCoords);
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
                    forwardToGoogleMaps(startCoords, destCoords);
                    return null;
                } else {
                    let correctTrackPoints: any[] = [];
                    possibleTrackPoints.forEach((trackPoints) => {
                        // Endpunkt der GPX-Datei
                        const lastTrackPoint = trackPoints.slice(-1)[0];
                        // Entfernung zwischen Endpunkt und gewünschtem Punkt (Parkhaus)
                        const distance = haversineDistance(
                            { latitude: lastTrackPoint.lat, longitude: lastTrackPoint.lon },
                            destCoords
                        );

                        // von den möglichen GPX-Dateien, mit annehmbaren Startkoordinaten
                        // nur die nehmen, bei denen das gewünschte Parkhaus weniger als 50m
                        // vom Endpunkt entfernt ist
                        if (distance < 50) {
                            correctTrackPoints = trackPoints;
                        }
                    });
                    if (correctTrackPoints.length !== 0) {
                        return correctTrackPoints;
                    }
                    // Wenn keine GPX-Datei gefunden wurde wieder zu Google Maps weiterleiten
                    forwardToGoogleMaps(startCoords, destCoords);
                    return null;
                }
            }
        })
        .catch(() => {
            Toast.show("Standort-Erlaubnis wurde nicht erteilt!\n" + "Keine Navigation möglich.");
            return null;
        });
};

const forwardToGoogleMaps = (startCoords: LatLng, destCoords: LatLng) => {
    // Weiterleitung zu Google Maps muss bei beiden Konditionen stattfinden,
    // da es bei AsyncStorage dazu kommen kann, dass das Programm weiterläuft und Google
    // Maps dann mit falschen Koordinaten aufruft => mit einem Aufruf in jeder Kondition
    // wird sichergestellt, dass die richtigen Koordinaten verwendet werden
    if (destCoords.latitude === 0 && destCoords.longitude === 0) {
        AsyncStorage.getItem(staticDataParkingGarage).then((garageData) => {
            if (garageData !== null) {
                const parkingGarages: IGarage[] = JSON.parse(garageData);

                let minDistance = 100000;
                let minCoords: LatLng = destCoords;

                parkingGarages.forEach((garage) => {
                    const distance = haversineDistance(garage.coords, startCoords);
                    if (distance < minDistance) {
                        minDistance = distance;
                        minCoords = garage.coords;
                    }
                });
                // Weiterleitung zu Google Maps => wenn keine App installiert ist, dann im Browser
                const latLng = `${minCoords.latitude},${minCoords.longitude}`;
                const url = `https://www.google.com/maps/dir/?api=1&destination=${latLng}`;
                Toast.show("Weiterleitung zu Google Maps.", { position: Toast.positions.CENTER });
                Linking.openURL(url);
            } else {
                Toast.show("Parkhausdaten konnten nicht gefunden werden.", {
                    duration: Toast.durations.LONG,
                    position: Toast.positions.BOTTOM,
                });
            }
        });
    } else {
        // Weiterleitung zu Google Maps => wenn keine App installiert ist, dann im Browser
        const latLng = `${destCoords.latitude},${destCoords.longitude}`;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latLng}`;
        Toast.show("Weiterleitung zu Google Maps.", { position: Toast.positions.CENTER });
        Linking.openURL(url);
    }
};
