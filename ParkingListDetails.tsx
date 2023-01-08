import { TouchableOpacity, Text, StyleSheet, Dimensions, View } from "react-native";
import { colors } from "./colors";
import { Button } from "react-native-paper";
import { DynamicParkingData } from "./ParkingAPI/useAPIcall";
import { IGarage } from "./IGarage";
import { useEffect } from "react";

interface IProps {
    navigation: any;
    dynamicParkingData: DynamicParkingData | undefined;
    staticParkingData: IGarage;
}

export function ParkingListDetails(props: IProps) {
    const { navigation, dynamicParkingData, staticParkingData } = props;

    useEffect(() => {
        console.log(dynamicParkingData);
        console.log(staticParkingData);
    }, [dynamicParkingData, staticParkingData]);

    return (
        <View style={styles.container}>
            <Button onPress={() => navigation.navigate("Karte", { destinationCoords: "hello" })}>Zur Karte</Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
    },
    item: {
        width: Dimensions.get("window").width - 60,
        backgroundColor: colors.background,
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 8,
    },
    title: {
        fontSize: 25,
    },
});
