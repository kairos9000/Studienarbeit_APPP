import * as React from "react";
import { StyleSheet, View } from "react-native";
import { useAPIcall } from "../ParkingAPI/useAPIcall";
import { colors } from "../colors";
import { ParkingListDetails } from "./ParkingListDetails";
import ParkingList from "./ParkingList";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { IGarage } from "../IGarage";
import { findCorrectGpxFile } from "../Navigation/findCorrectGpxFile";
import { LatLng } from "react-native-maps";
import Toast from "react-native-root-toast";

const Stack = createStackNavigator();

interface IProps {
    navigation: any;
    staticParkingData: IGarage[];
    setFavorite(id: number): void;
    alwaysUseMaps: boolean;
}

// Definieren der Routen zu den Detail-Fenstern der einzelnen Parkhäuser, die mit einem Klick
// in der Liste geöffnet werden
export default function ParkingListNavigator(props: IProps) {
    const { navigation, staticParkingData, setFavorite, alwaysUseMaps } = props;
    const dynamicParkingData = useAPIcall();

    const navigateToParkingGarage = (destCoords: LatLng) => {
        findCorrectGpxFile(destCoords, alwaysUseMaps)
            .then((trackPoints) => {
                if (trackPoints !== null) {
                    navigation.navigate("Karte", {
                        trackPoints: trackPoints,
                    });
                }
            })
            .catch(() => {
                Toast.show("Ein Fehler bei der Routen-Suche ist aufgetreten.");
            });
    };

    return (
        <Stack.Navigator initialRouteName="Parkhaus-Liste">
            <Stack.Screen name="Parkhaus-Liste" options={{ headerShown: false }}>
                {(props) => (
                    <ParkingList
                        staticParkingData={staticParkingData}
                        dynamicParkingData={dynamicParkingData}
                        {...props}
                    />
                )}
            </Stack.Screen>
            {staticParkingData.map((garage: IGarage) => (
                <Stack.Screen
                    name={garage.name}
                    key={garage.id}
                    options={{
                        headerRight: () => (
                            <View style={{ flexDirection: "row" }}>
                                <MaterialCommunityIcons.Button
                                    color={colors.navigationBlue}
                                    backgroundColor="transparent"
                                    underlayColor="transparent"
                                    onPress={() => navigateToParkingGarage(garage.coords)}
                                    name={"navigation-variant"}
                                    size={40}
                                />
                                <Ionicons.Button
                                    color={colors.secondary}
                                    backgroundColor="transparent"
                                    underlayColor="transparent"
                                    onPress={() => setFavorite(garage.id)}
                                    name={garage.favorite === true ? "heart" : "heart-outline"}
                                    size={40}
                                />
                            </View>
                        ),
                    }}
                >
                    {(props) => (
                        <ParkingListDetails
                            {...props}
                            dynamicParkingData={dynamicParkingData.Parkhaus.find(
                                (dynamicGarage) => dynamicGarage.ID === garage.id
                            )}
                            staticParkingData={garage}
                        />
                    )}
                </Stack.Screen>
            ))}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray,
        alignItems: "center",
        justifyContent: "center",
    },
});
