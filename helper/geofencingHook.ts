import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useState } from "react";

const GEOFENCING_TASK = "GEOFENCING_TASK";
let geofenceHandles: TaskManager.TaskManagerTaskExecutor[] = [];

TaskManager.defineTask(GEOFENCING_TASK, (data) => {
    for (const handle of geofenceHandles) {
        handle(data);
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

interface NameAndInGeofence {
    name: string;
    inGeofence: boolean;
}

export function useGeofenceEvent() {
    const [nameAndInGeofence, setNameAndInGeofence] = useState<NameAndInGeofence>({ name: "", inGeofence: false });

    useEffect(() => {
        const handleIsInGeofence = ({ data, error }: any) => {
            if (error) {
                console.log("error here");
            }
            if (nameAndInGeofence.inGeofence === true) {
                if (
                    data.region.identifier === nameAndInGeofence.name &&
                    data.eventType === Location.GeofencingEventType.Enter
                ) {
                    return;
                }
            }

            if (data.eventType === Location.GeofencingEventType.Enter) {
                setNameAndInGeofence({ name: data.region.identifier, inGeofence: true });
                console.log("You've entered region:", data.region);
            } else if (data.eventType === Location.GeofencingEventType.Exit) {
                setNameAndInGeofence({ name: data.region.identifier, inGeofence: false });
                console.log("You've left region:", data.region);
            } else {
                console.log("Komisches Event");
            }
        };

        geofenceHandles.push(handleIsInGeofence);
        return () => {
            geofenceHandles = geofenceHandles.filter((handle) => handle !== handleIsInGeofence);
        };
    }, []);

    return nameAndInGeofence;
}
