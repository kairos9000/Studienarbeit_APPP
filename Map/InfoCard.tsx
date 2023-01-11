import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Card, Title } from "react-native-paper";
import * as Progress from "react-native-progress";
import { colors } from "../colors";
import { Pressable, Text, View } from "react-native";
import { useEffect } from "react";

export function InfoCard({ info, showInfoBox, navigateToParkingGarage, setFavorite }: any) {
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
                    progress={info.freeSpacesPercent}
                    showsText={true}
                    animated={false}
                />
                <Text style={{ marginTop: 10 }}>
                    {info.freeSpaces} von {info.allSpaces} Parkplätzen frei
                </Text>
            </Card.Content>
        </Card>
    );
}
