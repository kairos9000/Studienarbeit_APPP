import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useState } from "react";
import { LatLng } from "react-native-maps";
import { haversineDistance } from "./haversineDistance";
import { parkingGarages } from "../staticDataParkingGarage";
import * as Speech from "expo-speech";
import Toast from "react-native-root-toast";

const GEOFENCING_TASK = "GEOFENCING_TASK";
let geofenceHandles: TaskManager.TaskManagerTaskExecutor[] = [];

TaskManager.defineTask(GEOFENCING_TASK, (data: any) => {
    if (data.error) {
        console.log("error here");
        return;
    }
    const location = data.data.locations.pop();
    for (const handle of geofenceHandles) {
        handle(location.coords);
    }
    // if (error) {
    //     // check `error.message` for more details.
    //     return;
    // }
    // if (data.eventType === Location.GeofencingEventType.Enter) {
    //     console.log("You've entered region:", data.region);
    // } else if (data.eventType === Location.GeofencingEventType.Exit) {
    //     console.log("You've left region:", data.region);
    // }
});

interface RegionsStaticData {
    name: string;
    coords: LatLng;
}

interface GeofenceData {
    name: string;
    inGeofence: boolean;
}

export function useGeofenceEvent() {
    let regionsData: RegionsStaticData[] = [];
    let geofenceData: GeofenceData[] = [];

    parkingGarages.map((garage) => {
        regionsData.push({
            name: garage.name,
            coords: garage.coords,
        });
        geofenceData.push({
            name: garage.name,
            inGeofence: false,
        });
    });
    const [regions, setRegions] = useState<GeofenceData[]>(geofenceData);

    useEffect(() => {
        const handleIsInGeofence = (userCoords: any) => {
            regionsData.forEach((region, index) => {
                const distance = haversineDistance(userCoords, region.coords);
                if (distance < 200) {
                    let newRegions = [...regions];
                    // wenn Nutzer vorher außerhalb des Geofences war Benachrichtigung, dass betreten wurde
                    if (newRegions[index].inGeofence === false) {
                        const notificationText = "Sie nähern sich " + newRegions[index].name + ".";
                        Speech.speak(notificationText, { language: "de" });
                        Toast.show(notificationText, {
                            duration: Toast.durations.LONG,
                            position: Toast.positions.BOTTOM,
                        });
                    }
                    newRegions[index].inGeofence = true;
                    setRegions(newRegions);
                } else if (distance > 210) {
                    let newRegions = [...regions];
                    newRegions[index].inGeofence = false;
                    setRegions(newRegions);
                }
            });
            // if (nameAndInGeofence.inGeofence === true) {
            //     if (
            //         data.region.identifier === nameAndInGeofence.name &&
            //         data.eventType === Location.GeofencingEventType.Enter
            //     ) {
            //         return;
            //     }
            // }

            // if (data.eventType === Location.GeofencingEventType.Enter) {
            //     setNameAndInGeofence({ name: data.region.identifier, inGeofence: true });
            //     console.log("You've entered region:", data.region);
            // } else if (data.eventType === Location.GeofencingEventType.Exit) {
            //     setNameAndInGeofence({ name: data.region.identifier, inGeofence: false });
            //     console.log("You've left region:", data.region);
            // } else {
            //     console.log("Komisches Event");
            // }
        };

        geofenceHandles.push(handleIsInGeofence);
        return () => {
            geofenceHandles = geofenceHandles.filter((handle) => handle !== handleIsInGeofence);
        };
    }, []);

    return regions;
}
