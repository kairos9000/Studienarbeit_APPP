import { Card } from "react-native-paper";
import { Dimensions, StyleSheet } from "react-native";
import { colors } from "../colors";

interface IProps {
    children: React.ReactNode;
    styling: string;
    title: string;
    center?: boolean;
}

// Anzeigen der einzelnen Elemente im Detail-Fenster
export function DetailsCard(props: IProps) {
    // durch children-Property ist es möglich, HTML-Elemente innerhalb der Tags von
    // selbst definierten Komponenten zu schreiben
    const { children, styling, title, center } = props;

    return (
        <Card
            style={styling === "card" ? styles.card : styling === "cardWide" ? styles.cardWide : styles.cardWideBottom}
        >
            <Card.Title title={title} titleVariant="titleSmall" titleStyle={{ color: colors.fontGray }} />
            <Card.Content style={center !== undefined && center === true && { alignItems: "center" }}>
                {children}
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
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
