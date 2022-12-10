interface LatLng {
    latitude: number;
    longitude: number;
}

interface Prices {
    firstHour: number;
    followingHours: number;
    specialPrices?: {
        numHours: number;
        price: number;
    };
    maxPrice: number;
    startHours: string;
    endHour: string;
}

interface openHours {
    startHour: string;
    endHour: string;
}

export interface IGarage {
    id: number;
    name: string;
    coords: LatLng;
    numberOfParkingSpots: number;
    pricingDay: Prices;
    pricingNight?: Prices;
    openingHours: openHours;
    additionalInformation?: string;
}
