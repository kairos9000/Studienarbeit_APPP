// hier feste Dateien als ts-Objekt exportieren, um einfacher in Datenbank einlesen zu können
import { IGarage } from "./IGarage";

export const parkingGarages: IGarage[] = [
    {
        id: 1,
        name: "Kurfürstengarage",
        coords: {
            latitude: 49.44146,
            longitude: 11.86055,
        },
        numberOfParkingSpots: 179,
        pricingDay: {
            firstHour: 1,
            followingHours: 0.5,
            maxPrice: 5,
            startHours: "08:00:00",
            endHour: "19:00:00",
        },
        pricingNight: {
            firstHour: 0.5,
            followingHours: 0.5,
            maxPrice: 1.5,
            startHours: "19:00:00",
            endHour: "08:00:00",
        },
        openingHours: {
            startHour: "00:00:00",
            endHour: "24:00:00",
        },
        additionalInformation: "Für Besucher des Kurfürstenbades ist das Parken kostenfrei",
    },
    {
        id: 2,
        name: "Theatergarage",
        coords: {
            latitude: 49.44649,
            longitude: 11.85492,
        },
        numberOfParkingSpots: 105,
        pricingDay: {
            firstHour: 1,
            followingHours: 0.5,
            maxPrice: 4,
            startHours: "07:00:00",
            endHour: "23:00:00",
        },
        openingHours: {
            startHour: "00:00:00",
            endHour: "24:00:00",
        },
        additionalInformation: "Von 23 bis 7 Uhr gebührenfrei",
    },
    {
        id: 3,
        name: "Kräuterwiese",
        coords: {
            latitude: 49.44921,
            longitude: 11.85246,
        },
        numberOfParkingSpots: 240,
        pricingDay: {
            firstHour: 0.5,
            followingHours: 0,
            specialPrices: {
                numHours: 5,
                price: 1,
            },
            maxPrice: 2,
            startHours: "08:00:00",
            endHour: "18:00:00",
        },
        openingHours: {
            startHour: "00:00:00",
            endHour: "24:00:00",
        },
        additionalInformation: "Monatsticket: 15€, Jahresticket: 120€",
    },
    {
        id: 4,
        name: "Am Ziegeltor",
        coords: {
            latitude: 49.44864,
            longitude: 11.85684,
        },
        numberOfParkingSpots: 200,
        pricingDay: {
            firstHour: 1,
            followingHours: 0.5,
            maxPrice: 5,
            startHours: "08:00:00",
            endHour: "19:00:00",
        },
        pricingNight: {
            firstHour: 0.5,
            followingHours: 0.5,
            maxPrice: 1.5,
            startHours: "19:00:00",
            endHour: "08:00:00",
        },
        openingHours: {
            startHour: "00:00:00",
            endHour: "24:00:00",
        },
        additionalInformation: "FLEXI-Ticket möglich",
    },
    {
        id: 5,
        name: "Kurfürstenbad",
        coords: {
            latitude: 49.44222,
            longitude: 11.85861,
        },
        numberOfParkingSpots: 40,
        pricingDay: {
            firstHour: 1,
            followingHours: 0.5,
            maxPrice: 5,
            startHours: "08:00:00",
            endHour: "19:00:00",
        },
        pricingNight: {
            firstHour: 0.5,
            followingHours: 0.5,
            maxPrice: 1.5,
            startHours: "19:00:00",
            endHour: "08:00:00",
        },
        openingHours: {
            startHour: "00:00:00",
            endHour: "24:00:00",
        },
        additionalInformation: "Für Besucher des Kurfürstenbades ist das Parken kostenfrei",
    },
    {
        id: 6,
        name: "Kino",
        coords: {
            latitude: 49.44469,
            longitude: 11.8648,
        },
        numberOfParkingSpots: 99,
        pricingDay: {
            firstHour: 0.5,
            followingHours: 0,
            specialPrices: {
                numHours: 5,
                price: 1,
            },
            maxPrice: 1,
            startHours: "08:00:00",
            endHour: "18:00:00",
        },
        openingHours: {
            startHour: "00:00:00",
            endHour: "24:00:00",
        },
        additionalInformation: "Maximal 5 Stunden Parkdauer",
    },
    {
        id: 7,
        name: "ACC",
        coords: {
            latitude: 49.44112,
            longitude: 11.86041,
        },
        numberOfParkingSpots: 271,
        pricingDay: {
            firstHour: 1,
            followingHours: 0.5,
            maxPrice: 5,
            startHours: "08:00:00",
            endHour: "18:00:00",
        },
        openingHours: {
            startHour: "00:00:00",
            endHour: "24:00:00",
        },
    },
    {
        id: 8,
        name: "Altstadtgarage",
        coords: {
            latitude: 49.44787,
            longitude: 11.86092,
        },
        numberOfParkingSpots: 135,
        pricingDay: {
            firstHour: 1,
            followingHours: 0.3,
            specialPrices: {
                numHours: 2,
                price: 1.5,
            },
            maxPrice: 3.6,
            startHours: "07:00:00",
            endHour: "20:30:00",
        },
        pricingNight: {
            firstHour: 0.3,
            followingHours: 0.3,
            maxPrice: 3.6,
            startHours: "20:30:00",
            endHour: "07:00:00",
        },
        openingHours: {
            startHour: "00:00:00",
            endHour: "24:00:00",
        },
    },
    {
        id: 9,
        name: "Marienstraße",
        coords: {
            latitude: 49.44489,
            longitude: 11.86654,
        },
        numberOfParkingSpots: 860,
        pricingDay: {
            firstHour: 1.5,
            followingHours: 1.5,
            maxPrice: 10,
            startHours: "00:00:00",
            endHour: "24:00:00",
        },

        openingHours: {
            startHour: "00:00:00",
            endHour: "24:00:00",
        },
    },
];
