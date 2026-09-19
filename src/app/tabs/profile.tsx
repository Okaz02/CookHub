import { useCallback, useMemo, useState } from "react";
import { Text, View, Image, StyleSheet, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getUserRepo, type Repository } from "../../lib/api-repo";
import { colors, textStyles } from "../../theme";

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
            <Text style={textStyles.h3Text}>{repo.name}</Text>
            {repo.private ? <Text style={textStyles.text}>非公開</Text> : null}
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
            <Text style={textStyles.h2Text}>{account?.username ?? "ゲスト"}</Text>
            <Text style={textStyles.h4Text}>{account?.email ?? ""}</Text>
          </View>
          <Pressable onPress={handleSignOut}>
            <Text style={styles.signOutText}>ログアウト</Text>
          </Pressable>
        </View>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.profileStatus}>
            <View style={styles.profileStatusItem}>
              <Text style={textStyles.h2Text}>{ownRepos.length}</Text>
              <Text style={textStyles.text}>レシピ</Text>
            </View>
            <View style={styles.lineHorizontal} />
            <View style={styles.profileStatusItem}>
              <Text style={textStyles.h2Text}>{forkedRepos.length}</Text>
              <Text style={styles.statusLabel}>アレンジ</Text>
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
            activeColor={colors.primary}
            inactiveColor={colors.outline}
          />
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    alignContent: "center",
    gap: 20,
    padding: 20,
  },
  lineVertical: {
    borderBottomColor: colors.outlineVariant,
    borderBottomWidth: 1,
  },
  lineHorizontal: {
    borderLeftColor: colors.outlineVariant,
    borderLeftWidth: 1,
    height: "100%",
  },
  profile: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: 20,
    borderRadius: 20,
    gap: 20,
  },
  profileMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileStatus: {
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  profileStatusItem: {
    alignItems: "center",
  },
  profileName: {
    flex: 1,
  },
  profileIcon: {
    backgroundColor: colors.primary,
    width: 70,
    height: 70,
    marginRight: 20,
    borderRadius: 35,
  },
  statusText: {
    color: colors.onSurface,
  },
  statusLabel: {
    color: colors.onSurfaceVariant,
  },
  signOutText: {
    fontSize: 12,
    color: colors.error,
  },
  emptyText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
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
    backgroundColor: colors.surfaceContainerLowest,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  tabIndicator: {
    backgroundColor: colors.primary,
  },
  tabContent: {
    gap: 20,
    padding: 20,
  },
  listItem: {
    backgroundColor: colors.surfaceContainerLow,
    padding: 20,
    borderRadius: 20,
  },
  recipe: {
    backgroundColor: colors.primary,
    height: 350,
    overflow: "hidden",
    borderRadius: 20,
  },
  recipeImage: {
    height: 200,
  },
  recipeImagePlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  recipeExplain: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.surfaceContainerLow,
  },
});
