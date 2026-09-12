import { Text, View, Image, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../../theme";

export default function Write() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.discardButton} onPress={() => router.back()}>
          <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
          <Text style={styles.discardText}>破棄</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>レシピを書く</Text>
          <View style={styles.autosaveRow}>
            <View style={styles.autosaveDot} />
            <Text style={styles.autosaveText}>自動保存中: 14:02</Text>
          </View>
        </View>
        <Pressable style={styles.draftButton} onPress={() => router.back()}>
          <Text style={styles.draftButtonText}>下書き</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.versionBanner}>
          <View style={styles.versionBannerLeft}>
            <MaterialIcons name="account-tree" size={18} color={colors.dustyRose} />
            <View>
              <Text style={styles.versionTitle}>新規レシピ / v1.0.0</Text>
              <Text style={styles.versionSubtitle}>あなたのオリジナル本流（main）</Text>
            </View>
          </View>
          <View style={styles.draftPill}>
            <Text style={styles.draftPillText}>Draft</Text>
          </View>
        </View>

        <View style={styles.photoUpload}>
          <View style={styles.photoUploadIconCircle}>
            <MaterialIcons name="photo-camera" size={24} color={colors.roastedBean} />
          </View>
          <Text style={styles.photoUploadTitle}>料理の完成写真をのせる</Text>
          <Text style={styles.photoUploadSubtitle}>タップして写真を選択 または撮影</Text>
          <View style={styles.photoUploadHintPill}>
            <Text style={styles.photoUploadHintText}>美味しそうなカフェトーン写真がおすすめ</Text>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            レシピのタイトル <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.titleInput}
            defaultValue="我が家の絶品ふっくら煮込みハンバーグ"
            placeholder="例: 我が家の絶品ふっくら煮込みハンバーグ"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>一言メモ・キャッチコピー</Text>
          <TextInput
            style={styles.catchphraseInput}
            multiline
            numberOfLines={2}
            defaultValue="飴色玉ねぎをたっぷり入れて、肉汁がジュワッと溢れる仕上がりに。煮込みソースで失敗知らずの家族定番おかずです。"
          />
        </View>

        <View style={styles.presetsCard}>
          <View style={styles.presetsHeaderRow}>
            <View style={styles.presetsHeaderLeft}>
              <MaterialIcons name="restaurant" size={16} color={colors.mutedForest} />
              <Text style={styles.presetsHeaderLabel}>分量設定</Text>
            </View>
            <Text style={styles.presetsHeaderValue}>現在: 2人分</Text>
          </View>
          <View style={styles.servingPillRow}>
            <View style={styles.servingPill}>
              <Text style={styles.servingPillText}>1人分</Text>
            </View>
            <View style={[styles.servingPill, styles.servingPillActive]}>
              <Text style={styles.servingPillActiveText}>2人分</Text>
            </View>
            <View style={styles.servingPill}>
              <Text style={styles.servingPillText}>3〜4人</Text>
            </View>
            <View style={styles.servingPill}>
              <Text style={styles.servingPillText}>自由入力</Text>
            </View>
          </View>
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <MaterialIcons name="schedule" size={18} color={colors.dustyRose} />
              <View style={styles.chipTextGroup}>
                <Text style={styles.chipLabel}>目安時間</Text>
                <Text style={styles.chipValue}>30分</Text>
              </View>
            </View>
            <View style={styles.chip}>
              <MaterialIcons name="local-fire-department" size={18} color={colors.dustyRose} />
              <View style={styles.chipTextGroup}>
                <Text style={styles.chipLabel}>カロリー(目安)</Text>
                <Text style={styles.chipValue}>480 kcal</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>材料</Text>
              <Text style={styles.sectionHeaderNote}>（2人分）</Text>
            </View>
            <Pressable style={styles.sectionHeaderAction}>
              <MaterialIcons name="add-circle" size={16} color={colors.mutedForest} />
              <Text style={styles.sectionHeaderActionText}>グループ追加</Text>
            </Pressable>
          </View>

          <View style={styles.ingredientList}>
            <View style={styles.ingredientRow}>
              <MaterialIcons name="drag-indicator" size={18} color={colors.outline} />
              <TextInput style={styles.ingredientNameInput} defaultValue="合い挽き肉" placeholder="材料名（例: 玉ねぎ）" />
              <TextInput style={styles.ingredientAmountInput} defaultValue="300g" placeholder="分量" />
              <Pressable style={styles.ingredientDeleteButton}>
                <MaterialIcons name="close" size={18} color={colors.outlineVariant} />
              </Pressable>
            </View>
            <View style={styles.ingredientRow}>
              <MaterialIcons name="drag-indicator" size={18} color={colors.outline} />
              <TextInput style={styles.ingredientNameInput} defaultValue="玉ねぎ（みじん切り）" placeholder="材料名" />
              <TextInput style={styles.ingredientAmountInput} defaultValue="1/2個" placeholder="分量" />
              <Pressable style={styles.ingredientDeleteButton}>
                <MaterialIcons name="close" size={18} color={colors.outlineVariant} />
              </Pressable>
            </View>
            <View style={styles.ingredientRow}>
              <MaterialIcons name="drag-indicator" size={18} color={colors.outline} />
              <TextInput style={styles.ingredientNameInput} defaultValue="パン粉・牛乳" placeholder="材料名" />
              <TextInput style={styles.ingredientAmountInput} defaultValue="各大さじ3" placeholder="分量" />
              <Pressable style={styles.ingredientDeleteButton}>
                <MaterialIcons name="close" size={18} color={colors.outlineVariant} />
              </Pressable>
            </View>

            <View style={styles.ingredientGroupHeaderRow}>
              <View style={styles.ingredientGroupHeaderLeft}>
                <View style={styles.ingredientGroupDot} />
                <Text style={styles.ingredientGroupLabel}>[特製デミソース]</Text>
              </View>
              <Text style={styles.ingredientGroupTag}>グループ</Text>
            </View>
            <View style={styles.ingredientRow}>
              <MaterialIcons name="drag-indicator" size={18} color={colors.outline} />
              <TextInput style={styles.ingredientNameInput} defaultValue="中濃ソース・ケチャップ" placeholder="材料名" />
              <TextInput style={styles.ingredientAmountInput} defaultValue="各大さじ2" placeholder="分量" />
              <Pressable style={styles.ingredientDeleteButton}>
                <MaterialIcons name="close" size={18} color={colors.outlineVariant} />
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.dashedAddButton}>
            <MaterialIcons name="add" size={18} color={colors.roastedBean} />
            <Text style={styles.dashedAddButtonText}>材料を追加する</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>作り方・手順</Text>
            <Text style={styles.sectionHeaderNote}>全3ステップ</Text>
          </View>

          <View style={styles.stepList}>
            <View style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepHeaderLeft}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepSubtitle}>下準備・玉ねぎ</Text>
                </View>
                <View style={styles.stepActions}>
                  <MaterialIcons name="arrow-upward" size={18} color={colors.outline} />
                  <MaterialIcons name="arrow-downward" size={18} color={colors.outline} />
                  <MaterialIcons name="delete" size={18} color={colors.outline} />
                </View>
              </View>
              <View style={styles.stepBodyRow}>
                <View style={styles.stepThumbnail}>
                  <Image style={styles.stepThumbnailImage} />
                  <View style={styles.stepThumbnailEditButton}>
                    <MaterialIcons name="edit" size={12} color={colors.linenCream} />
                  </View>
                </View>
                <TextInput
                  style={styles.stepTextArea}
                  multiline
                  numberOfLines={3}
                  defaultValue="玉ねぎは細かくみじん切りにし、フライパンで飴色になるまで弱火で10分じっくり炒めます。炒めたら平皿に移し、粗熱を完全に取っておきます。"
                />
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepHeaderLeft}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepSubtitle}>こねる・成形</Text>
                </View>
                <View style={styles.stepActions}>
                  <MaterialIcons name="arrow-upward" size={18} color={colors.outline} />
                  <MaterialIcons name="arrow-downward" size={18} color={colors.outline} />
                  <MaterialIcons name="delete" size={18} color={colors.outline} />
                </View>
              </View>
              <View style={styles.stepBodyRow}>
                <View style={styles.stepAddPhoto}>
                  <MaterialIcons name="add-a-photo" size={20} color={colors.outline} />
                  <Text style={styles.stepAddPhotoText}>写真追加</Text>
                </View>
                <TextInput
                  style={styles.stepTextArea}
                  multiline
                  numberOfLines={3}
                  defaultValue="ボウルにひき肉、冷ました玉ねぎ、パン粉、牛乳、塩胡椒を入れて白っぽく粘りが出るまでよく練り合わせます。2等分して空気を抜きながら小判形に丸めます。"
                />
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepHeaderLeft}>
                  <View style={styles.stepNumberCircleDraft}>
                    <Text style={styles.stepNumberDraftText}>3</Text>
                  </View>
                  <Text style={styles.stepSubtitle}>焼き・煮込み仕上げ</Text>
                </View>
                <View style={styles.stepActions}>
                  <MaterialIcons name="arrow-upward" size={18} color={colors.outline} />
                  <MaterialIcons name="delete" size={18} color={colors.outline} />
                </View>
              </View>
              <View style={styles.stepBodyRow}>
                <View style={styles.stepAddPhoto}>
                  <MaterialIcons name="add-a-photo" size={20} color={colors.outline} />
                  <Text style={styles.stepAddPhotoText}>写真追加</Text>
                </View>
                <TextInput
                  style={styles.stepTextArea}
                  multiline
                  numberOfLines={3}
                  placeholder="中火で両面に焼き色をつけたら、ソースの材料を加えて弱火で5分煮込みます..."
                />
              </View>
            </View>
          </View>

          <Pressable style={styles.dashedAddButton}>
            <MaterialIcons name="add" size={18} color={colors.roastedBean} />
            <Text style={styles.dashedAddButtonText}>手順を追加する</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.tipsSectionHeader}>
            <Text style={styles.sectionTitle}>コツ・こだわり ＆ バージョンメモ</Text>
            <Text style={styles.tipsSectionSubtitle}>次回の自分がもっと美味しく作れるための記録</Text>
          </View>

          <View style={styles.tipsCard}>
            <View style={styles.tipsLabelRow}>
              <MaterialIcons name="lightbulb" size={16} color={colors.dustyRose} />
              <Text style={styles.tipsLabel}>美味しく作るコツ・ポイント</Text>
            </View>
            <TextInput
              style={styles.tipsTextArea}
              multiline
              numberOfLines={2}
              defaultValue="タネを焼くときは中央を少しくぼませると火通りが均一になります。ソースに赤ワインを少し足すと大人のビストロ風に！"
            />
          </View>

          <View style={styles.commitCard}>
            <View style={styles.commitHeaderRow}>
              <View style={styles.commitHeaderLeft}>
                <MaterialIcons name="history-edu" size={18} color={colors.mutedForest} />
                <Text style={styles.commitHeaderLabel}>今回のアレンジ・こだわりメモ</Text>
              </View>
              <View style={styles.commitVersionPill}>
                <Text style={styles.commitVersionPillText}>v1.0.0 メモ</Text>
              </View>
            </View>
            <TextInput
              style={styles.commitInput}
              defaultValue="初回登録：飴色玉ねぎの甘みを活かした黄金比レシピ"
              placeholder="例: 今回は牛乳を豆乳に変えてヘルシーに仕上げてみた"
            />
            <View style={styles.forkRow}>
              <View style={styles.forkRowLeft}>
                <MaterialIcons name="fork-left" size={18} color={colors.mutedForest} />
                <View>
                  <Text style={styles.forkTitle}>他の人のレシピのアレンジですか？</Text>
                  <Text style={styles.forkSubtitle}>元のシェフにリスペクトが伝わります</Text>
                </View>
              </View>
              <View style={styles.toggle}>
                <View style={styles.toggleKnob} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.visibilityRow}>
          <View style={styles.visibilityRowLeft}>
            <MaterialIcons name="public" size={20} color={colors.mutedForest} />
            <View>
              <Text style={styles.visibilityTitle}>公開範囲</Text>
              <Text style={styles.visibilitySubtitle}>全体に公開（CookHubタイムライン）</Text>
            </View>
          </View>
          <Pressable style={styles.visibilityChangeButton}>
            <Text style={styles.visibilityChangeText}>変更</Text>
            <MaterialIcons name="chevron-right" size={16} color={colors.mutedForest} />
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarRow}>
          <Pressable style={styles.draftSaveButton} onPress={() => router.back()}>
            <MaterialIcons name="bookmark-border" size={18} color={colors.roastedBean} />
            <Text style={styles.draftSaveButtonText}>下書き保存</Text>
          </Pressable>
          <Pressable style={styles.publishButton} onPress={() => router.back()}>
            <MaterialIcons name="publish" size={18} color={colors.linenCream} />
            <Text style={styles.publishButtonText}>公開する (v1.0.0)</Text>
          </Pressable>
        </View>
        <Text style={styles.bottomBarCaption}>公開後もバージョン履歴からいつでも過去の状態に戻せます</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  discardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  discardText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  autosaveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  autosaveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mutedForest,
  },
  autosaveText: {
    fontSize: 10,
    color: colors.mutedForest,
  },
  draftButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
  draftButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  versionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
  versionBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  versionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  versionSubtitle: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  draftPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.secondaryContainer,
  },
  draftPillText: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.secondary,
  },
  photoUpload: {
    height: 224,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 16,
  },
  photoUploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  photoUploadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.roastedBean,
  },
  photoUploadSubtitle: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  photoUploadHintPill: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.surfaceContainerLowest,
  },
  photoUploadHintText: {
    fontSize: 10,
    color: colors.mutedForest,
  },
  field: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
    marginBottom: 4,
  },
  required: {
    color: colors.error,
  },
  titleInput: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(62,39,35,0.2)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.onSurface,
  },
  catchphraseInput: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(62,39,35,0.2)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.onSurface,
    textAlignVertical: "top",
  },
  presetsCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    gap: 12,
  },
  presetsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  presetsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  presetsHeaderLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  presetsHeaderValue: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  servingPillRow: {
    flexDirection: "row",
    gap: 6,
  },
  servingPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
  },
  servingPillText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  servingPillActive: {
    borderColor: colors.roastedBean,
    backgroundColor: colors.roastedBean,
  },
  servingPillActiveText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.linenCream,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  chipTextGroup: {
    flex: 1,
  },
  chipLabel: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  chipValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.onSurface,
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.roastedBean,
  },
  sectionHeaderNote: {
    fontSize: 12,
    color: colors.mutedForest,
  },
  sectionHeaderAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectionHeaderActionText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.mutedForest,
  },
  ingredientList: {
    gap: 8,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  ingredientNameInput: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
    padding: 4,
  },
  ingredientAmountInput: {
    width: 80,
    fontSize: 12,
    textAlign: "right",
    color: colors.onSurface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ingredientDeleteButton: {
    padding: 4,
  },
  ingredientGroupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginTop: 4,
  },
  ingredientGroupHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ingredientGroupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.dustyRose,
  },
  ingredientGroupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.mutedForest,
  },
  ingredientGroupTag: {
    fontSize: 10,
    color: colors.outline,
  },
  dashedAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(62,39,35,0.3)",
    backgroundColor: colors.surfaceContainerLow,
  },
  dashedAddButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  stepList: {
    gap: 12,
  },
  stepCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    gap: 8,
  },
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.roastedBean,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.linenCream,
  },
  stepNumberCircleDraft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberDraftText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
  },
  stepSubtitle: {
    fontSize: 11,
    color: colors.mutedForest,
  },
  stepActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepBodyRow: {
    flexDirection: "row",
    gap: 10,
  },
  stepThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
  },
  stepThumbnailImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.onSurface,
  },
  stepThumbnailEditButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(26,26,26,0.7)",
    borderRadius: 999,
    padding: 4,
  },
  stepAddPhoto: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  stepAddPhotoText: {
    fontSize: 9,
    color: colors.outline,
  },
  stepTextArea: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: colors.onSurface,
    textAlignVertical: "top",
  },
  tipsSectionHeader: {
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    gap: 2,
  },
  tipsSectionSubtitle: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  tipsCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    gap: 8,
    marginTop: 12,
  },
  tipsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tipsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  tipsTextArea: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    textAlignVertical: "top",
  },
  commitCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(85,98,85,0.2)",
    backgroundColor: "rgba(211,225,209,0.4)",
    gap: 12,
    marginTop: 12,
  },
  commitHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commitHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commitHeaderLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.roastedBean,
  },
  commitVersionPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.secondary,
  },
  commitVersionPillText: {
    fontSize: 10,
    color: colors.linenCream,
  },
  commitInput: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.onSurface,
  },
  forkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(85,98,85,0.15)",
  },
  forkRowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  forkTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.roastedBean,
  },
  forkSubtitle: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(211,195,192,0.5)",
    justifyContent: "center",
    padding: 2,
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLowest,
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
  },
  visibilityRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  visibilityTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  visibilitySubtitle: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  visibilityChangeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  visibilityChangeText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.mutedForest,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomBarRow: {
    flexDirection: "row",
    gap: 10,
  },
  draftSaveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(62,39,35,0.3)",
    backgroundColor: colors.surfaceContainerLow,
  },
  draftSaveButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  publishButton: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.roastedBean,
  },
  publishButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.linenCream,
  },
  bottomBarCaption: {
    textAlign: "center",
    fontSize: 10,
    color: colors.outline,
    marginTop: 6,
  },
});
