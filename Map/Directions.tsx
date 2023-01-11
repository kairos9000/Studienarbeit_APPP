import { useEffect, useState } from "react";
import { LatLng, Polyline } from "react-native-maps";
import { colors } from "../colors";

interface IProps {
    dirCoords: any[];
}

export function Directions(props: IProps) {
    const { dirCoords } = props;
    const [directions, setDirections] = useState<LatLng[]>([]);

    useEffect(() => {
        if (dirCoords.length > 0) {
            // Erstellen der Koordinaten zum Einzeichnen in die Karte im richtigen Format
            // für die Polyline-Komponente
            const extractedPositions: LatLng[] = [];
            dirCoords.forEach((trackPoint: any) => {
                extractedPositions.push({
                    latitude: Number(trackPoint.lat),
                    longitude: Number(trackPoint.lon),
                });
            });
            setDirections(extractedPositions);
        } else {
            setDirections([]);
        }
    }, [dirCoords]);

    return (
        <Polyline
            coordinates={directions}
            strokeColor={colors.navigationBlue}
            strokeColors={["#7F0000", "#00000000", "#B24112", "#E5845C", "#238C23", "#7F0000"]}
            strokeWidth={6}
        />
    );
}
