import { useCallback, useMemo, useState } from "react";
import { Text, View, Image, StyleSheet, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getUserRepo, type Repository } from "../../lib/api-repo";

function RepoListRoute({ repos, emptyText }: { repos: Repository[]; emptyText: string }) {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {repos.map((repo) => (
        <Pressable key={repo.id} style={styles.recipe} onPress={() => router.push(`/tabs/repo/${repo.id}`)}>
          {repo.thumbnail ? (
            <Image style={styles.recipeImage} source={{ uri: repo.thumbnail }} />
          ) : (
            <View style={[styles.recipeImage, styles.recipeImagePlaceholder]} />
          )}
          <View style={styles.recipeExplain}>
            <Text style={styles.h3Text}>{repo.name}</Text>
            {repo.private ? <Text style={styles.text}>非公開</Text> : null}
          </View>
        </Pressable>
      ))}
      {repos.length === 0 ? <Text style={styles.emptyText}>{emptyText}</Text> : null}
    </ScrollView>
  );
}

function ProposalsRoute() {
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.emptyText}>採択提案の一覧はまだ準備中です。</Text>
    </ScrollView>
  );
}

export default function Profile() {
  const layout = useWindowDimensions();
  const router = useRouter();
  const { account, token, signOut } = useAuth();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "recipes", title: "レシピ" },
    { key: "arrangements", title: "アレンジ" },
    { key: "proposals", title: "採択提案" },
  ]);

  const [repos, setRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setRepos([]);
        setIsLoading(false);
        return;
      }
      let cancelled = false;
      setIsLoading(true);
      getUserRepo(token)
        .then((res) => {
          if (!cancelled) setRepos(res.data);
        })
        .catch(() => {
          if (!cancelled) setRepos([]);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [token])
  );

  const ownRepos = useMemo(() => repos.filter((repo) => !repo.fork), [repos]);
  const forkedRepos = useMemo(() => repos.filter((repo) => repo.fork), [repos]);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const renderScene = SceneMap({
    recipes: () => <RepoListRoute repos={ownRepos} emptyText="まだレシピがありません。" />,
    arrangements: () => <RepoListRoute repos={forkedRepos} emptyText="まだアレンジしたレシピがありません。" />,
    proposals: ProposalsRoute,
  });

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.profile}>
        <View style={styles.profileMain}>
          <Image style={styles.profileIcon}></Image>
          <View style={styles.profileName}>
            <Text style={styles.h2Text}>{account?.username ?? "ゲスト"}</Text>
            <Text style={styles.h4Text}>{account?.email ?? ""}</Text>
          </View>
          <Pressable onPress={handleSignOut}>
            <Text style={styles.signOutText}>ログアウト</Text>
          </Pressable>
        </View>
        {isLoading ? (
          <ActivityIndicator color="#1b110f" />
        ) : (
          <View style={styles.profileStatus}>
            <View style={styles.profileStatusItem}>
              <Text>{ownRepos.length}</Text>
              <Text>レシピ</Text>
            </View>
            <View style={styles.lineHorizontal} />
            <View style={styles.profileStatusItem}>
              <Text>{forkedRepos.length}</Text>
              <Text>アレンジ</Text>
            </View>
          </View>
        )}
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
  signOutText: {
    fontSize: 12,
    color: "#ba1a1a",
  },
  emptyText: {
    fontSize: 12,
    color: "#8a8a8a",
    textAlign: "center",
    padding: 20,
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
  recipeImagePlaceholder: {
    backgroundColor: "#3a3a3a",
  },
  recipeExplain: {
    flex: 1,
    padding: 20,
    backgroundColor: "#dbdbdb"
  }
});
