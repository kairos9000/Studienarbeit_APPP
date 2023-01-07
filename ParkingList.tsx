import * as React from "react";
import {
    StyleSheet,
    Text,
    View,
    Dimensions,
    Button,
    TouchableOpacity,
    FlatList,
    TouchableHighlight,
    StatusBar,
} from "react-native";
import { useAPIcall } from "./ParkingAPI/useAPIcall";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { colors } from "./colors";
import { IGarage } from "./IGarage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parkingGarages } from "./staticDataParkingGarage";
import { ParkingListItem } from "./ParkingListItem";
import { NavigationContainer } from "@react-navigation/native";
import { ParkingListDetails } from "./ParkingListDetails";

const staticDataParkingGarage = "@staticData";
const Stack = createNativeStackNavigator();

interface ItemInformation {
    id: number;
    name: string;
    trend: number;
    open: number;
}

export default function ParkingList({ navigation }: any) {
    const [listData, setListData] = useState<ItemInformation[]>([]);
    const [staticParkingData, setStaticParkingData] = useState<IGarage[]>([]);
    const dynamicParkingData = useAPIcall(false);

    useEffect(() => {
        (async () => {
            let parkingGaragesTest = await AsyncStorage.getItem(staticDataParkingGarage);
            if (parkingGaragesTest === null) {
                await AsyncStorage.setItem(staticDataParkingGarage, JSON.stringify(parkingGarages));
                parkingGaragesTest = await AsyncStorage.getItem(staticDataParkingGarage);
            }
            const garageObject = parkingGaragesTest !== null ? (JSON.parse(parkingGaragesTest) as IGarage[]) : [];
            setStaticParkingData(garageObject);

            let listDataBuffer: ItemInformation[] = [];
            garageObject.forEach((garage) => {
                const dynamicData = dynamicParkingData.Parkhaus.find((data) => data.ID === garage.id);
                if (dynamicData !== undefined) {
                    listDataBuffer.push({
                        id: garage.id,
                        name: garage.name,
                        trend: dynamicData.Trend,
                        open: dynamicData.Geschlossen,
                    });
                }
            });

            setListData(listDataBuffer);
        })();
    }, []);

    useEffect(() => {
        if (staticParkingData.length > 0) {
            let listDataBuffer: ItemInformation[] = [];
            dynamicParkingData.Parkhaus.forEach((garage) => {
                const staticData = staticParkingData.find((data) => garage.ID === data.id);
                if (staticData !== undefined) {
                    listDataBuffer.push({
                        id: staticData.id,
                        name: staticData.name,
                        trend: garage.Trend,
                        open: garage.Geschlossen,
                    });
                }
            });

            setListData(listDataBuffer);
        }
    }, [dynamicParkingData]);

    const onPress = (item: IGarage) => {
        navigation.navigate(item.name);
    };

    const renderItem = ({ item }: any) => <ParkingListItem onPress={onPress} item={item} />;

    return (
        <View style={styles.container}>
            <FlatList data={listData} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} />
        </View>
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
