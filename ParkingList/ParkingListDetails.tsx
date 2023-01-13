import { Text, StyleSheet, View, ScrollView } from "react-native";
import { colors } from "../colors";
import { DataTable } from "react-native-paper";
import { DynamicParkingData } from "../ParkingAPI/useAPIcall";
import { IGarage } from "../IGarage";
import { useEffect, useState } from "react";
import * as Progress from "react-native-progress";
import { DetailsCard } from "./DetailsCard";

interface IProps {
    navigation: any;
    dynamicParkingData: DynamicParkingData | undefined;
    staticParkingData: IGarage;
}

type Trends = "Gleichbleibend" | "Steigend" | "Fallend";

export function ParkingListDetails(props: IProps) {
    const { dynamicParkingData, staticParkingData } = props;
    const [parkingSpaces, setParkingSpaces] = useState<number>(0);

    // nötig wegen Bug in react-native-progress => siehe InfoCard.tsx
    useEffect(() => {
        if (dynamicParkingData !== undefined) {
            setParkingSpaces(dynamicParkingData.Frei / dynamicParkingData.Gesamt);
        }
    }, [dynamicParkingData, staticParkingData]);

    // Aktualisierung der angezeigten Daten, wie Trend oder Öffnungszeiten
    const endHour = Number(staticParkingData.openingHours.endHour.split(":")[0]);
    const startHour = Number(staticParkingData.openingHours.startHour.split(":")[0]);
    const openingHours = endHour - startHour;

    let trend: Trends = "Gleichbleibend";
    let trendColor = colors.black;
    if (dynamicParkingData !== undefined) {
        trend =
            dynamicParkingData.Trend === -1
                ? "Fallend"
                : dynamicParkingData.Trend === 1
                ? "Steigend"
                : "Gleichbleibend";
        trendColor =
            dynamicParkingData.Trend === -1
                ? colors.openGreen
                : dynamicParkingData.Trend === 1
                ? colors.red
                : colors.black;
    }

    return (
        <View style={styles.container}>
            {dynamicParkingData !== undefined && (
                <ScrollView>
                    <View style={styles.cards}>
                        <DetailsCard styling="card" title="Störung">
                            <Text
                                style={{
                                    ...styles.text,
                                    color: dynamicParkingData.Status === "OK" ? colors.openGreen : colors.red,
                                }}
                            >
                                {dynamicParkingData.Status === "OK" ? "Keine Störung" : "Störung"}
                            </Text>
                        </DetailsCard>
                        <DetailsCard styling="card" title="Geöffnet">
                            <Text
                                style={{
                                    ...styles.text,
                                    color: dynamicParkingData.Geschlossen === 0 ? colors.openGreen : colors.red,
                                }}
                            >
                                {dynamicParkingData.Geschlossen === 0 ? "Offen" : "Geschlossen"}
                            </Text>
                        </DetailsCard>
                        <DetailsCard styling="card" title="Öffnungszeiten">
                            <Text style={styles.text}>{openingHours.toString() + " Stunden geöffnet"}</Text>
                        </DetailsCard>
                        <DetailsCard styling="card" title="Trend">
                            <Text
                                style={{
                                    ...styles.text,
                                    color: trendColor,
                                }}
                            >
                                {trend}
                            </Text>
                        </DetailsCard>
                        <DetailsCard styling="cardWide" title="Freie Parkplätze" center={true}>
                            <Progress.Circle
                                thickness={7}
                                color={parkingSpaces > 0.1 ? colors.primaryBackground : colors.red}
                                size={100}
                                progress={parkingSpaces}
                                showsText={true}
                            />
                            <Text
                                style={{
                                    ...styles.text,
                                    marginTop: 10,
                                }}
                            >
                                {dynamicParkingData.Frei} von {dynamicParkingData.Gesamt} Parkplätzen frei
                            </Text>
                        </DetailsCard>
                        <DetailsCard
                            styling={
                                staticParkingData.additionalInformation !== undefined ? "cardWide" : "cardWideBottom"
                            }
                            title="Preise"
                        >
                            {staticParkingData.pricingNight !== undefined ? (
                                <View>
                                    <Text>
                                        Tagpreise gelten von {staticParkingData.pricingDay.startHours} bis{" "}
                                        {staticParkingData.pricingDay.endHour} Uhr
                                    </Text>
                                    <DataTable>
                                        <DataTable.Header>
                                            <DataTable.Title>{}</DataTable.Title>
                                            <DataTable.Title textStyle={{ fontSize: 15 }} numeric>
                                                Tag
                                            </DataTable.Title>
                                            <DataTable.Title textStyle={{ fontSize: 15 }} numeric>
                                                Nacht
                                            </DataTable.Title>
                                        </DataTable.Header>
                                        <DataTable.Row>
                                            <DataTable.Cell>Erste Stunde</DataTable.Cell>
                                            <DataTable.Cell numeric>
                                                {staticParkingData.pricingDay.firstHour}€
                                            </DataTable.Cell>
                                            <DataTable.Cell numeric>
                                                {staticParkingData.pricingNight?.firstHour}€
                                            </DataTable.Cell>
                                        </DataTable.Row>

                                        <DataTable.Row>
                                            <DataTable.Cell>Weitere Stunde</DataTable.Cell>
                                            <DataTable.Cell numeric>
                                                {staticParkingData.pricingDay.followingHours}€
                                            </DataTable.Cell>
                                            <DataTable.Cell numeric>
                                                {staticParkingData.pricingNight?.followingHours}€
                                            </DataTable.Cell>
                                        </DataTable.Row>
                                    </DataTable>
                                </View>
                            ) : (
                                <View>
                                    <Text
                                        style={{
                                            fontSize: 20,
                                        }}
                                    >
                                        Erste Stunde: {staticParkingData.pricingDay.firstHour}€
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 20,
                                        }}
                                    >
                                        Weitere Stunde: {staticParkingData.pricingDay.followingHours}€
                                    </Text>
                                </View>
                            )}
                        </DetailsCard>
                        {staticParkingData.additionalInformation !== undefined && (
                            <DetailsCard styling="cardWideBottom" title="Zusatzinformationen">
                                <Text style={styles.text}>{staticParkingData.additionalInformation}</Text>
                            </DetailsCard>
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray,
        width: "100%",
        height: "100%",
    },
    cards: {
        flex: 1,
        backgroundColor: colors.gray,
        width: "100%",
        height: "100%",
        flexDirection: "row",
        justifyContent: "space-evenly",
        flexWrap: "wrap",
        overflow: "scroll",
    },
    text: {
        fontSize: 20,
    },
});
