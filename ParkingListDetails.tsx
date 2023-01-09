import { TouchableOpacity, Text, StyleSheet, Dimensions, View, ScrollView } from "react-native";
import { colors } from "./colors";
import { Button, Card, DataTable } from "react-native-paper";
import { DynamicParkingData } from "./ParkingAPI/useAPIcall";
import { IGarage } from "./IGarage";
import { useEffect, useState } from "react";
import * as Progress from "react-native-progress";

interface IProps {
    navigation: any;
    dynamicParkingData: DynamicParkingData | undefined;
    staticParkingData: IGarage;
}

type Trends = "Gleichbleibend" | "Steigend" | "Fallend";

export function ParkingListDetails(props: IProps) {
    const { navigation, dynamicParkingData, staticParkingData } = props;
    const [openingHours, setOpeningHours] = useState<number>(24);
    const [trend, setTrend] = useState<Trends>("Gleichbleibend");
    const [trendColor, setTrendColor] = useState<string>(colors.black);
    const [parkingSpaces, setParkingSpaces] = useState<number>(0);

    useEffect(() => {
        const endHour = Number(staticParkingData.openingHours.endHour.split(":")[0]);
        const startHour = Number(staticParkingData.openingHours.startHour.split(":")[0]);
        setOpeningHours(endHour - startHour);
        if (dynamicParkingData?.Trend === -1) {
            setTrend("Fallend");
            setTrendColor(colors.openGreen);
        } else if (dynamicParkingData?.Trend === 1) {
            setTrend("Steigend");
            setTrendColor(colors.red);
        } else {
            setTrend("Gleichbleibend");
            setTrendColor(colors.black);
        }
        if (dynamicParkingData !== undefined) {
            setParkingSpaces(dynamicParkingData.Frei / dynamicParkingData.Gesamt);
        }
    }, [dynamicParkingData, staticParkingData]);

    return (
        <View style={styles.container}>
            {dynamicParkingData !== undefined && (
                <ScrollView>
                    <View style={styles.cards}>
                        <Card style={styles.card}>
                            <Card.Title
                                title="Störung"
                                titleVariant="titleSmall"
                                titleStyle={{ color: colors.fontGray }}
                            />
                            <Card.Content>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        color: dynamicParkingData.Status === "OK" ? colors.openGreen : colors.red,
                                    }}
                                >
                                    {dynamicParkingData.Status === "OK" ? "Keine Störung" : "Störung"}
                                </Text>
                            </Card.Content>
                        </Card>
                        <Card style={styles.card}>
                            <Card.Title
                                title="Geöffnet"
                                titleVariant="titleSmall"
                                titleStyle={{ color: colors.fontGray }}
                            />
                            <Card.Content>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        color: dynamicParkingData.Geschlossen === 0 ? colors.openGreen : colors.red,
                                    }}
                                >
                                    {dynamicParkingData.Geschlossen === 0 ? "Offen" : "Geschlossen"}
                                </Text>
                            </Card.Content>
                        </Card>
                        <Card style={styles.card}>
                            <Card.Title
                                title="Öffnungszeiten"
                                titleVariant="titleSmall"
                                titleStyle={{ color: colors.fontGray }}
                            />
                            <Card.Content>
                                <Text
                                    style={{
                                        fontSize: 20,
                                    }}
                                >
                                    {openingHours.toString() + " Stunden geöffnet"}
                                </Text>
                            </Card.Content>
                        </Card>
                        <Card style={styles.card}>
                            <Card.Title
                                title="Trend"
                                titleVariant="titleSmall"
                                titleStyle={{ color: colors.fontGray }}
                            />
                            <Card.Content>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        color: trendColor,
                                    }}
                                >
                                    {trend}
                                </Text>
                            </Card.Content>
                        </Card>
                        <Card style={styles.cardWide}>
                            <Card.Title
                                title="Freie Parkplätze"
                                titleVariant="titleSmall"
                                titleStyle={{ color: colors.fontGray }}
                            />
                            <Card.Content style={{ alignItems: "center" }}>
                                <Progress.Circle
                                    thickness={7}
                                    color={parkingSpaces > 0.1 ? colors.primaryBackground : colors.red}
                                    size={100}
                                    progress={parkingSpaces}
                                    showsText={true}
                                />
                                <Text
                                    style={{
                                        fontSize: 20,
                                        marginTop: 10,
                                    }}
                                >
                                    {dynamicParkingData.Frei} von {dynamicParkingData.Gesamt} Parkplätzen frei
                                </Text>
                            </Card.Content>
                        </Card>
                        <Card style={styles.cardWide}>
                            <Card.Title
                                title="Preise"
                                titleVariant="titleSmall"
                                titleStyle={{ color: colors.fontGray }}
                            />

                            {staticParkingData.pricingNight !== undefined ? (
                                <Card.Content>
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
                                </Card.Content>
                            ) : (
                                <Card.Content>
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
                                </Card.Content>
                            )}
                        </Card>
                        {staticParkingData.additionalInformation !== undefined && (
                            <Card style={styles.cardWideBottom}>
                                <Card.Title
                                    title="Zusatzinformation"
                                    titleVariant="titleSmall"
                                    titleStyle={{ color: colors.fontGray }}
                                />
                                <Card.Content>
                                    <Text
                                        style={{
                                            fontSize: 20,
                                        }}
                                    >
                                        {staticParkingData.additionalInformation}
                                    </Text>
                                </Card.Content>
                            </Card>
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
    card: {
        marginTop: 15,
        width: Dimensions.get("window").width * 0.4,
    },
    cardWide: {
        marginTop: 15,
        width: Dimensions.get("window").width * 0.87,
    },
    cardWideBottom: {
        marginTop: 15,
        marginBottom: 15,
        width: Dimensions.get("window").width * 0.87,
    },
});
