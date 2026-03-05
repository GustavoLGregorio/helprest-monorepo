import { View, ScrollView, DimensionValue, StyleSheet } from "react-native";
import React from "react";

type ContainerProps = {
    width: DimensionValue;
    height: DimensionValue;
    marginTop?: DimensionValue;
    children?: React.ReactElement | React.ReactElement[];
};
export default function Container(props: ContainerProps) {
    return (
        <View style={styles.container}>
            <ScrollView
                overScrollMode="always"
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical={true}
                style={[
                    styles.scroll,
                    {
                        width: props.width,
                        height: props.height,
                        marginTop: props.marginTop,
                    },
                ]}
            >
                <View style={styles.innerContainer}>{props.children}</View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "relative",
    },
    scroll: {
        position: "absolute",
        borderRadius: 12,
    },
    innerContainer: {
        backgroundColor: "#EEE",

        width: "100%",
        minHeight: "100%",
        padding: 8,

        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignContent: "flex-start",
        rowGap: 12,
        gap: 10,

        boxShadow: "-1px 1px 0px 1px rgba(0, 0, 0, 0.1)",
    },
});
