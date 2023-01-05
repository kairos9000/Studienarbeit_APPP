import { LatLng } from "react-native-maps";

// https://community.esri.com/t5/coordinate-reference-systems-blog/distance-on-a-sphere-the-haversine-formula/ba-p/902128
export function haversineDistance(coord1: LatLng, coord2: LatLng): number {
    const earthRadius = 6371000; // radius of Earth in meters
    // Konvertierung der Winkelkoordinaten (latitude, longitude) ins Bogenmaß für trigonometrische Funktionen
    const phi_1 = degToRadians(coord1.latitude);
    const phi_2 = degToRadians(coord2.latitude);
    const delta_phi = degToRadians(coord2.latitude - coord1.latitude);
    const delta_lambda = degToRadians(coord2.longitude - coord1.longitude);

    // Berechnung des zentralen Winkels Theta zwischen beiden Punkten auf einer Kugel (Erde)
    const havTheta =
        Math.sin(delta_phi / 2.0) ** 2 + Math.cos(phi_1) * Math.cos(phi_2) * Math.sin(delta_lambda / 2.0) ** 2;

    // Benutzen der atan2-Funktion, da diese in allen Quadranten das richtige Ergebnis bringt
    // => eigentlich arcsin-Funktion => Konvertierung in arctan für atan2: arcsin(x) = arctan(x / (sqrt(1 - x^2)))
    // => arcsin(sqrt(havTheta)) = arctan(sqrt(havTheta) / sqrt(1 - havTheta))
    const distanceInMeters = 2 * earthRadius * Math.atan2(Math.sqrt(havTheta), Math.sqrt(1 - havTheta));

    // runden auf 3 Dezimalstellen
    return Math.round(distanceInMeters * 1000) / 1000;
}

function degToRadians(degree: number) {
    return (degree * Math.PI) / 180;
}

// console.log(haversineDistance({ latitude: 49.402, longitude: 11.9796 }, { latitude: 49.3762, longitude: 11.9809 }));
