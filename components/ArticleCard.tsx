import { Article } from "@/types/article";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ArticleCard = ({
  item,
  handleArticlePress,
}: {
  item: Article;
  handleArticlePress: (item: Article) => void;
}) => {
  // Construct full image URL
  const imageUrl = `https://app.treksor.com/${item.image}`;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleArticlePress(item)}
      style={styles.articleCard}
    >
      {/* Outer LinearGradient for the border */}
      <LinearGradient
        colors={["rgba(205,235,248,0.22)", "rgba(205,235,248,0.09)"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.borderGradient}
      >
        {/* Inner LinearGradient for the button background */}
        <LinearGradient
          colors={["rgba(183,221,240,0.10)", "rgba(183,221,240,0.045)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.innerGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.articleImage}
                contentFit="cover"
              />
            </View>

            <View style={styles.textContent}>
              <Text style={styles.articleTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.articleDescription} numberOfLines={3}>
                {item.description}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default ArticleCard;

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  articleCard: {
    width: "100%", // Full width minus margins
    minHeight: 165,
    borderRadius: 18,
    overflow: "hidden",
  },
  borderGradient: {
    flex: 1,
    borderRadius: 12,
    padding: 1, // This creates the border thickness
  },
  innerGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 17, // Slightly smaller than outer radius
  },
  cardContent: {
    flexDirection: "row",
    alignItems:'center',
  },
  imageContainer: {
    width: "43%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  articleImage: {
    width: "100%",
    height: "100%",
  },
  textContent: {
    flex: 1,
    // justifyContent: "space-between",
    minHeight:145,
    justifyContent:"center",
    gap:8,
    textAlign:'left',
    marginHorizontal:16
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 25, letterSpacing: -0.2, includeFontPadding: false, },
  articleDescription: {
    fontSize: 12,
    color: "#FFFFFF",
    lineHeight: 28,
  },
});
