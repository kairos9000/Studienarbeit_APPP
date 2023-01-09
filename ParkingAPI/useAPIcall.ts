import AsyncStorage from "@react-native-async-storage/async-storage";
import { XMLParser } from "fast-xml-parser";
import { decode } from "html-entities";
import { useEffect, useState } from "react";
import Toast from "react-native-root-toast";

const dynamicDataParkingGarage = "@dynamicData";

export interface XMLData {
    Zeitstempel: number;
    Parkhaus: DynamicParkingData[];
}

export interface DynamicParkingData {
    Aktuell: number;
    Frei: number;
    Gesamt: number;
    Geschlossen: number;
    ID: number;
    Name: string;
    Status: string;
    Trend: number;
}

const getAPI = (showToasts: boolean) => {
    return (
        fetch("https://parken.amberg.de/wp-content/uploads/pls/pls.xml")
            .then((response) => {
                if (response.status === 200) {
                    return response.text();
                } else {
                    throw new Error();
                }
            })
            .then(async (text) => {
                // falls keine Daten geliefert wurden alte Daten nehmen
                if (text === undefined) {
                    const oldParkingData: XMLData = await getOldParkingData(showToasts);
                    return oldParkingData;
                } else {
                    const parser = new XMLParser();
                    let xml = parser.parse(text);
                    // decoden der HTML-Entities, wie zum Beispiel ü in Kurfürstenbad, da diese sonst nicht
                    // korrekt angezeigt werden können
                    const decodedData = decodeHTMLEntities(xml.Daten.Parkhaus);
                    const parkingData: XMLData = {
                        Zeitstempel: xml.Daten.Zeitstempel,
                        Parkhaus: decodedData,
                    };

                    // Daten aktualisieren
                    await AsyncStorage.setItem(dynamicDataParkingGarage, JSON.stringify(parkingData));
                    if (showToasts) {
                        Toast.show("Daten wurden aktualisiert.");
                    }
                    return parkingData;
                }
            })
            // Bei Fehler, zum Beispiel keine Internetverbindung, alte Daten nehmen
            .catch(async () => {
                const oldParkingData: XMLData = await getOldParkingData(showToasts);
                return oldParkingData;
            })
    );
};

const getOldParkingData = async (showToasts: boolean) => {
    const oldParkingDataTest = await AsyncStorage.getItem(dynamicDataParkingGarage);

    // Falls gar keine Daten vorhanden sind und keine abgefragt werden können => nichts zu machen
    if (oldParkingDataTest === null) {
        if (showToasts) {
            Toast.show(
                "Neue Daten konnten nicht abgefragt werden!\n" +
                    "Keine alten Daten vorhanden.\n" +
                    "Bitte Internetverbindung prüfen."
            );
        }

        return { Zeitstempel: 0, Parkhaus: [] };
    } else {
        if (showToasts) {
            Toast.show("Neue Daten konnten nicht abgefragt werden!\n" + "Alte Daten werden verwendet.");
        }
        const oldParkingData: XMLData = JSON.parse(oldParkingDataTest);
        return oldParkingData;
    }
};

const decodeHTMLEntities = (xmlObject: DynamicParkingData[]) => {
    xmlObject.forEach((garage, index) => {
        const decodedName = decode(garage.Name, { level: "xml" });
        xmlObject[index].Name = decodedName;
        const decodedStatus = decode(garage.Status, { level: "xml" });
        xmlObject[index].Status = decodedStatus;
    });

    return xmlObject;
};

// showToasts muss verwendet werden, da Map und App beide diesen Hook brauchen => damit die Toasts
// nicht doppelt angezeigt werden, die Toast-Anzeige von einer Komponente blockieren
export function useAPIcall(showToasts: boolean = false) {
    const [dynamicParkingData, setDynamicParkingData] = useState<XMLData>({ Zeitstempel: 0, Parkhaus: [] });

    useEffect(() => {
        const updateParkingData = async () => {
            const parkingData = await getAPI(showToasts);
            setDynamicParkingData(parkingData);
        };

        updateParkingData();
        const updateInterval = window.setInterval(updateParkingData, 60000);

        return () => {
            window.clearInterval(updateInterval);
        };
    }, []);

    return dynamicParkingData;
}
