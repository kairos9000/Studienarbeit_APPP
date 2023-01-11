import * as TaskManager from "expo-task-manager";
import { useEffect, useState } from "react";
import { LatLng } from "react-native-maps";
import { haversineDistance } from "./haversineDistance";
import * as Speech from "expo-speech";
import Toast from "react-native-root-toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IGarage } from "../IGarage";
import { XMLData } from "../ParkingAPI/useAPIcall";

const GEOFENCING_TASK = "GEOFENCING_TASK";
const staticDataParkingGarage = "@staticData";

let geofenceHandles: TaskManager.TaskManagerTaskExecutor[] = [];

TaskManager.defineTask(GEOFENCING_TASK, (data: any) => {
    if (data.error) {
        Toast.show("Fehler bei Abfragen der Positionsdaten");
        return;
    }
    // Nur die letzten Standort-Daten, da sonst sehr viel verarbeitet werden müsste
    const location = data.data.locations.pop();
    for (const handle of geofenceHandles) {
        handle(location.coords);
    }
});

interface RegionsStaticData {
    id: number;
    name: string;
    coords: LatLng;
}

interface GeofenceData {
    id: number;
    name: string;
    inGeofence: boolean;
    getUserCoords?: LatLng;
}

export function useGeofenceEvent(volume: boolean, dynamicParkingData: XMLData, getOnlyUserCoords: boolean = false) {
    let regionsData: RegionsStaticData[] = [];
    let geofenceData: GeofenceData[] = [];
    if (getOnlyUserCoords === false) {
        AsyncStorage.getItem(staticDataParkingGarage)
            .then((garageData) => {
                if (garageData !== null) {
                    const parkingGarages: IGarage[] = JSON.parse(garageData);
                    parkingGarages.map((garage) => {
                        regionsData.push({
                            id: garage.id,
                            name: garage.name,
                            coords: garage.coords,
                        });
                        geofenceData.push({
                            id: garage.id,
                            name: garage.name,
                            inGeofence: false,
                        });
                    });
                } else {
                    Toast.show("Parkhausdaten konnten nicht gefunden werden", {
                        duration: Toast.durations.LONG,
                        position: Toast.positions.BOTTOM,
                    });
                }
            })
            .catch((e) => {
                Toast.show("Beim Laden der Parkhausdaten ist ein Fehler aufgetreten", {
                    duration: Toast.durations.LONG,
                    position: Toast.positions.BOTTOM,
                });
            });
    }

    const [regions, setRegions] = useState<GeofenceData[]>(geofenceData);

    useEffect(() => {
        const handleIsInGeofence = (userCoords: any) => {
            // Für die Aktualisierung der ParkingList, falls nach Entfernung sortiert werden soll
            if (getOnlyUserCoords === true) {
                setRegions([{ id: 0, name: "", inGeofence: false, getUserCoords: userCoords }]);
                return;
            }
            if (regionsData.length === 0 && regions.length === 0) {
                return;
            }
            regionsData.forEach((region, index) => {
                const distance = haversineDistance(userCoords, region.coords);
                if (distance < 200) {
                    let newRegions = [...regions];
                    // wenn Nutzer vorher außerhalb des Geofences war Benachrichtigung, dass betreten wurde
                    if (newRegions[index].inGeofence === false) {
                        const dynamicData = dynamicParkingData.Parkhaus.find((data) => data.ID === region.id);
                        let notificationText = "Parkhaus " + newRegions[index].name + " in der Nähe.";

                        if (dynamicData !== undefined) {
                            let notificationWithFreeSpaces = notificationText.substring(0, notificationText.length - 1);
                            if (dynamicData.Frei === 1) {
                                notificationWithFreeSpaces += " mit einem freien Parkplatz.";
                            } else {
                                notificationWithFreeSpaces += " mit " + dynamicData.Frei + " freien Parkplätzen.";
                            }
                            notificationText = notificationWithFreeSpaces;
                        }
                        if (volume === true) {
                            Speech.speak(notificationText, { language: "de" });
                        }

                        Toast.show(notificationText, {
                            duration: Toast.durations.LONG,
                            position: Toast.positions.BOTTOM,
                        });
                    }
                    newRegions[index].inGeofence = true;
                    setRegions(newRegions);
                    // damit Nutzer weiter weg von Parkhaus sein muss, um als außerhalb des Geofences zu gelten
                    // => wenn hier nur auf über 200m getestet wird, kann es durch Schwankungen in den Koordinaten
                    // des Nutzers dazu kommen, dass der Nutzer das Geofence mehrmals betritt und wieder verlässt
                } else if (distance > 210) {
                    let newRegions = [...regions];
                    newRegions[index].inGeofence = false;
                    setRegions(newRegions);
                }
            });
        };

        geofenceHandles.push(handleIsInGeofence);
        return () => {
            geofenceHandles = geofenceHandles.filter((handle) => handle !== handleIsInGeofence);
        };
    }, [volume, dynamicParkingData]);

    return regions;
}
