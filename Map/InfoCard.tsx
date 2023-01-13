import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Card, Title } from "react-native-paper";
import * as Progress from "react-native-progress";
import { colors } from "../colors";
import { Pressable, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { Info } from "./Map";

interface IProps {
    info: Info;
    showInfoBox(value: boolean): void;
    navigateToParkingGarage(id: number): void;
    setFavorite(id: number): void;
}

export function InfoCard(props: IProps) {
    const { info, showInfoBox, navigateToParkingGarage, setFavorite } = props;
    const [freeSpacesPercent, setFreeSpacesPercent] = useState<number>(0);

    // nötig, da ein Bug im react-native-progress Paket verhindert, dass der richtige
    // Prozentwert in der Mitte des Kreises mit Animation angezeigt wird, wenn sich der Wert der freien Parkplätze
    // nicht explizit ändert => über useState ändern, da dabei initiale Wert 0 an react-native-progress
    // übergeben wird und dann geändert wird => Kreis bekommt neuen Wert
    // https://github.com/oblador/react-native-progress/pull/117
    useEffect(() => {
        setFreeSpacesPercent(info.freeSpacesPercent);
    }, [info]);
    return (
        <Card style={{ position: "absolute", bottom: 10 }}>
            <View style={{ position: "absolute", right: 5, top: 5 }}>
                <Pressable onPress={() => showInfoBox(false)} android_ripple={{ color: colors.fontGray, radius: 12 }}>
                    <MaterialCommunityIcons
                        name="close"
                        backgroundColor="transparent"
                        underlayColor="transparent"
                        size={25}
                        color={colors.black}
                    />
                </Pressable>
            </View>
            <Card.Content style={{ alignItems: "center", margin: 20 }}>
                <Title>{info.name}</Title>

                <View style={{ flexDirection: "row" }}>
                    <MaterialCommunityIcons.Button
                        color={colors.navigationBlue}
                        backgroundColor="transparent"
                        underlayColor="transparent"
                        onPress={() => navigateToParkingGarage(info.id)}
                        name={"navigation-variant"}
                        size={30}
                    />
                    <Ionicons.Button
                        color={colors.secondary}
                        backgroundColor="transparent"
                        underlayColor="transparent"
                        onPress={() => setFavorite(info.id)}
                        name={info.favorite === true ? "heart" : "heart-outline"}
                        size={30}
                    />
                </View>
                <Progress.Circle
                    thickness={7}
                    color={info.freeSpacesPercent > 0.1 ? colors.primaryBackground : colors.red}
                    size={90}
                    progress={freeSpacesPercent}
                    showsText={true}
                />
                <Text style={{ marginTop: 10 }}>
                    {info.freeSpaces} von {info.allSpaces} Parkplätzen frei
                </Text>
            </Card.Content>
        </Card>
    );
}
