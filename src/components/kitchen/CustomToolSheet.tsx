import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../theme";
import {
  TOOL_ACTION_PRESETS,
  TOOL_COLORS,
  TOOL_ICONS,
  TOOL_SHAPES,
  TOOL_TEMPLATES,
} from "../../lib/kitchen/constants";
import { createId } from "../../lib/kitchen/reducer";
import type { CustomToolDefinition, ToolAppearance } from "../../lib/kitchen/types";
import { BottomSheet, Chip, ChipRow, PrimaryButton, SectionLabel, sheetStyles } from "./BottomSheet";
import { ToolPreview } from "./ToolSprite";

type Props = {
  visible: boolean;
  savedTools: CustomToolDefinition[];
  onClose: () => void;
  onCreate: (definition: CustomToolDefinition) => void;
};

// ベースにない器具を、名前・できる動作・見た目を選んで追加する。
// すべての器具を用意しなくても、ユーザーが必要な器具をその場で作れるようにするためのもの。
export function CustomToolSheet({ visible, savedTools, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [customAction, setCustomAction] = useState("");
  const [appearance, setAppearance] = useState<ToolAppearance>({ shape: "circle", color: TOOL_COLORS[0], icon: TOOL_ICONS[0] });
  const [container, setContainer] = useState(true);
  const [heatable, setHeatable] = useState(false);

  function applyTemplate(template: Omit<CustomToolDefinition, "id">) {
    setName(template.name);
    setActions(template.actions);
    setAppearance(template.appearance);
    setContainer(template.container);
    setHeatable(template.heatable);
  }

  function toggleAction(action: string) {
    setActions((prev) => (prev.includes(action) ? prev.filter((item) => item !== action) : [...prev, action]));
  }

  function addCustomAction() {
    const trimmed = customAction.trim();
    if (!trimmed) return;
    setActions((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setCustomAction("");
  }

  const canSubmit = name.trim().length > 0 && actions.length > 0;
  const templates = [
    ...savedTools.map((tool) => ({ ...tool, saved: true })),
    ...TOOL_TEMPLATES.filter((template) => !savedTools.some((tool) => tool.name === template.name)).map((template) => ({
      ...template,
      saved: false,
    })),
  ];

  return (
    <BottomSheet
      visible={visible}
      title="新しい器具を追加"
      subtitle="ベースにない器具は、自分で名前・使い方・見た目を決めて追加できます"
      onClose={onClose}
    >
      <SectionLabel>よく使う器具から選ぶ</SectionLabel>
      <ChipRow>
        {templates.map((template) => (
          <Chip
            key={template.name}
            label={template.saved ? `★ ${template.name}` : template.name}
            active={name === template.name}
            onPress={() => applyTemplate(template)}
          />
        ))}
      </ChipRow>

      <SectionLabel>器具の名前</SectionLabel>
      <TextInput style={sheetStyles.textInput} value={name} onChangeText={setName} placeholder="例: 圧力鍋、すり鉢、トング" />

      <SectionLabel>この器具で何をする？（複数選択）</SectionLabel>
      <ChipRow>
        {[...TOOL_ACTION_PRESETS, ...actions.filter((item) => !TOOL_ACTION_PRESETS.includes(item))].map((action) => (
          <Chip key={action} label={action} active={actions.includes(action)} onPress={() => toggleAction(action)} />
        ))}
      </ChipRow>
      <View style={styles.inlineRow}>
        <TextInput
          style={[sheetStyles.textInput, { flex: 1 }]}
          value={customAction}
          onChangeText={setCustomAction}
          placeholder="ほかの動作（例: 押しつぶす）"
          onSubmitEditing={addCustomAction}
        />
        <Pressable style={styles.addButton} onPress={addCustomAction}>
          <MaterialIcons name="add" size={20} color={colors.linenCream} />
        </Pressable>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>材料を中に入れられる（ボウル・フライパンなど）</Text>
        <Switch value={container} onValueChange={setContainer} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>コンロに乗せて加熱できる</Text>
        <Switch value={heatable} onValueChange={setHeatable} />
      </View>

      <SectionLabel>見た目</SectionLabel>
      <View style={styles.previewRow}>
        <View style={styles.previewBox}>
          <ToolPreview name={name} appearance={appearance} container={container} size={72} />
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <ChipRow>
            {TOOL_SHAPES.map((shape) => (
              <Chip
                key={shape.id}
                label={shape.label}
                active={appearance.shape === shape.id}
                onPress={() => setAppearance((prev) => ({ ...prev, shape: shape.id }))}
              />
            ))}
          </ChipRow>
          <View style={styles.swatchRow}>
            {TOOL_COLORS.map((color) => (
              <Pressable
                key={color}
                style={[styles.swatch, { backgroundColor: color }, appearance.color === color && styles.swatchActive]}
                onPress={() => setAppearance((prev) => ({ ...prev, color }))}
              />
            ))}
          </View>
        </View>
      </View>
      <View style={styles.iconRow}>
        {TOOL_ICONS.map((icon) => (
          <Pressable
            key={icon}
            style={[styles.iconButton, appearance.icon === icon && styles.iconButtonActive]}
            onPress={() => setAppearance((prev) => ({ ...prev, icon }))}
          >
            <MaterialIcons
              name={icon}
              size={22}
              color={appearance.icon === icon ? colors.linenCream : colors.roastedBean}
            />
          </Pressable>
        ))}
      </View>

      <View style={sheetStyles.buttonRow}>
        <PrimaryButton label="やめる" tone="secondary" onPress={onClose} />
        <PrimaryButton
          label="キッチンに追加"
          disabled={!canSubmit}
          onPress={() =>
            onCreate({ id: createId("def"), name: name.trim(), actions, appearance, container, heatable: heatable })
          }
        />
      </View>
      {!canSubmit ? <Text style={sheetStyles.hint}>名前と動作を1つ以上選んでください。</Text> : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.roastedBean,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  switchLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.onSurface,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  previewBox: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#8f969c",
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: "#ffb300",
  },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainer,
  },
  iconButtonActive: {
    backgroundColor: colors.roastedBean,
  },
});
