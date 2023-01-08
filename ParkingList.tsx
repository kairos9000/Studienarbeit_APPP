import * as React from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { DynamicParkingData } from "./ParkingAPI/useAPIcall";
import { useEffect, useState } from "react";
import { colors } from "./colors";
import { IGarage } from "./IGarage";
import { ParkingListItem } from "./ParkingListItem";

interface ItemInformation {
    id: number;
    name: string;
    trend: number;
    open: number;
}

export default function ParkingList({ navigation, dynamicParkingData, staticParkingData }: any) {
    const [listData, setListData] = useState<ItemInformation[]>([]);

    useEffect(() => {
        let listDataBuffer: ItemInformation[] = [];
        staticParkingData.forEach((garage: IGarage) => {
            const dynamicData = dynamicParkingData.Parkhaus.find((data: DynamicParkingData) => data.ID === garage.id);
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
    }, []);

    useEffect(() => {
        if (staticParkingData.length > 0) {
            let listDataBuffer: ItemInformation[] = [];
            dynamicParkingData.Parkhaus.forEach((garage: DynamicParkingData) => {
                const staticData = staticParkingData.find((data: IGarage) => garage.ID === data.id);
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
