import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useState } from "react";
import { LatLng } from "react-native-maps";
import { haversineDistance } from "./haversineDistance";
import { parkingGarages } from "../staticDataParkingGarage";
import * as Speech from "expo-speech";

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

interface NameAndCoords {
    name: string;
    coords: LatLng;
    inGeofence: boolean;
}

export function useGeofenceEvent() {
    let regionsData: NameAndCoords[] = [];

    parkingGarages.map((garage) => {
        regionsData.push({
            name: garage.name,
            coords: garage.coords,
            inGeofence: false,
        });
    });
    const [regions, setRegions] = useState<NameAndCoords[]>(regionsData);

    useEffect(() => {
        const handleIsInGeofence = (userCoords: any) => {
            regions.forEach((region, index) => {
                const distance = haversineDistance(userCoords, region.coords);
                if (distance < 200) {
                    let newRegions = [...regions];
                    // wenn Nutzer vorher außerhalb des Geofences war Benachrichtigung, dass betreten wurde
                    if (newRegions[index].inGeofence === false) {
                        Speech.speak("Sie nähern sich " + newRegions[index].name, { language: "de" });
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
