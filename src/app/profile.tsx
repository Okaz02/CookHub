import { useState } from "react";
import { Text, View, Image, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

function RecipesRoute() {
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.recipe}>
        <Image style={styles.recipeImage} />
        <View style={styles.recipeExplain}>
          <Text style={styles.h3Text}>肉じゃが</Text>
        </View>
      </View>
      <View style={styles.recipe}>
        <Image style={styles.recipeImage} />
        <View style={styles.recipeExplain}>
          <Text style={styles.h3Text}>カレーライス</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ArrangementsRoute() {
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.listItem}>
        <Text style={styles.h4Text}>カレーのスパイスにクミンを追加</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.h4Text}>じゃがいもを大根に置き換え</Text>
      </View>
    </ScrollView>
  );
}

function ProposalsRoute() {
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.listItem}>
        <Text style={styles.h4Text}>出汁を昆布だしに変更する提案</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.h4Text}>砂糖を控えめにする提案</Text>
      </View>
    </ScrollView>
  );
}

const renderScene = SceneMap({
  recipes: RecipesRoute,
  arrangements: ArrangementsRoute,
  proposals: ProposalsRoute,
});

export default function Profile() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "recipes", title: "レシピ" },
    { key: "arrangements", title: "アレンジ" },
    { key: "proposals", title: "採択提案" },
  ]);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.profile}>
        <View style={styles.profileMain}>
          <Image style={styles.profileIcon}></Image>
          <View style={styles.profileName}>
            <Text style={styles.h2Text}>田中 品子</Text>
            <Text style={styles.h4Text}>家庭料理リサーチャー</Text>
          </View>
        </View>
        <Text style={styles.h4Text}>毎日の料理を美味しく。定番おかずの微調整や出汁の配合を研究中。アレンジ気軽に提案してください！</Text>
        <View style={styles.lineVertical} />
        <View style={styles.profileStatus}>
          <View style={styles.profileStatusItem}>
            <Text>24</Text>
            <Text>レシピ</Text>
          </View>
          <View style={styles.lineHorizontal} />
          <View style={styles.profileStatusItem}>
            <Text>18</Text>
            <Text>アレンジ</Text>
          </View>
          <View style={styles.lineHorizontal} />
          <View style={styles.profileStatusItem}>
            <Text>35</Text>
            <Text>採択提案</Text>
          </View>
          <View style={styles.lineHorizontal} />
          <View style={styles.profileStatusItem}>
            <Text>1240</Text>
            <Text>フォロワー</Text>
          </View>
        </View>
      </View>

      <TabView
        style={styles.tabView}
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.tabIndicator}
            activeColor="#1b110f"
            inactiveColor="#8a8a8a"
          />
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    alignContent: "center",
    gap: 20,
    padding: 20
  },
  lineVertical: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1
  },
  lineHorizontal: {
    borderLeftColor: '#ccc',
    borderLeftWidth: 1,
    height: '100%'
  },
  profile: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    gap: 20
  },
  profileMain: {
    flexDirection: "row",
    alignItems: "center"
  },
  profileStatus: {
    justifyContent: "center",
    flexDirection: "row",
    gap: 10
  },
  profileStatusItem: {
    alignItems: "center"
  },
  profileName: {
    flex: 1
  },
  profileIcon: {
    backgroundColor: "black",
    width: 70,
    height: 70,
    marginRight: 20,
    borderRadius: "50%"
  },
  h1Text: {
    fontSize: 40,
  },
  h2Text: {
    fontSize: 20,
  },
  h3Text: {
    fontSize: 15,
  },
  h4Text: {
    fontSize: 13,
  },
  text: {
    fontSize: 10
  },
  tabView: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    height: 500,
    borderRadius: 20,
  },
  tabBar: {
    backgroundColor: "white",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tabIndicator: {
    backgroundColor: "#1b110f",
  },
  tabContent: {
    gap: 20,
    padding: 20,
  },
  listItem: {
    backgroundColor: "#dbdbdb",
    padding: 20,
    borderRadius: 20,
  },
  recipe: {
    backgroundColor: "black",
    height: 350,
    overflow: "hidden",
    borderRadius: 20,
  },
  recipeImage: {
    height: 200,
  },
  recipeExplain: {
    flex: 1,
    padding: 20,
    backgroundColor: "#dbdbdb"
  }
});
