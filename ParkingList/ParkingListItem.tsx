import { TouchableOpacity, Text, StyleSheet, Dimensions, View } from "react-native";
import { colors } from "../colors";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";

// Anzeige der einzelnen Elemente der Liste
export function ParkingListItem({ item, onPress, backgroundColor, textColor }: any) {
    return (
        <TouchableOpacity onPress={() => onPress(item)} style={[styles.item, backgroundColor]}>
            <Text style={[styles.title, textColor]}>{item.name}</Text>
            <Text style={[styles.openClosed, { color: item.open === 0 ? colors.openGreen : colors.red }]}>
                {item.open === 0 ? "Offen" : "Geschlossen"}
            </Text>
            <View style={styles.trend}>
                <Text>
                    {item.distance}
                    {item.distance === "n.a." ? "" : "m"}
                </Text>
                {item.trend === 1 || item.trend === -1 ? (
                    <AntDesign
                        name={item.trend === 1 ? "caretup" : "caretdown"}
                        size={30}
                        color={item.trend === -1 ? colors.primaryBackground : colors.red}
                    />
                ) : (
                    <MaterialCommunityIcons size={30} name={"minus-thick"} />
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray,
        alignItems: "center",
        justifyContent: "center",
    },
    item: {
        width: Dimensions.get("window").width - 60,
        borderRadius: 10,
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
    openClosed: {
        fontSize: 20,
    },
    trend: {
        position: "absolute",
        top: "55%",
        right: 20,
        alignItems: "flex-end",
    },
});
