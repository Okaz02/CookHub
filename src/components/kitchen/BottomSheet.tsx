import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";

type SheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({ visible, title, subtitle, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>閉じる</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "danger";
}) {
  return (
    <Pressable
      style={[
        styles.button,
        tone === "secondary" && styles.buttonSecondary,
        tone === "danger" && styles.buttonDanger,
        disabled && { opacity: 0.4 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, tone === "secondary" && { color: colors.roastedBean }]}>{label}</Text>
    </Pressable>
  );
}

// プリセットから選ぶか、自由に数値を入力するか。どちらか一方だけが有効になる。
export function NumberChoice({
  presets,
  value,
  unit,
  onChange,
  formatPreset,
}: {
  presets: number[];
  value: number | null;
  unit: string;
  onChange: (value: number | null) => void;
  formatPreset?: (value: number) => string;
}) {
  const isPreset = value !== null && presets.includes(value);
  const [isCustom, setIsCustom] = useState(value !== null && !isPreset);
  const [text, setText] = useState(value !== null && !isPreset ? String(value) : "");
  return (
    <View style={{ gap: 8 }}>
      <ChipRow>
        {presets.map((preset) => (
          <Chip
            key={preset}
            label={formatPreset ? formatPreset(preset) : `${preset}${unit}`}
            active={!isCustom && value === preset}
            onPress={() => {
              setIsCustom(false);
              onChange(preset);
            }}
          />
        ))}
        <Chip
          label="その他"
          active={isCustom}
          onPress={() => {
            setIsCustom(true);
            const parsed = Number(text);
            onChange(text && Number.isFinite(parsed) && parsed > 0 ? parsed : null);
          }}
        />
      </ChipRow>
      {isCustom ? (
        <View style={styles.numberRow}>
          <TextInput
            style={styles.numberInput}
            value={text}
            onChangeText={(next) => {
              const normalized = next.replace(/[^0-9.]/g, "");
              setText(normalized);
              const parsed = Number(normalized);
              onChange(normalized && Number.isFinite(parsed) && parsed > 0 ? parsed : null);
            }}
            keyboardType="decimal-pad"
            placeholder="数値を入力"
            autoFocus
          />
          <Text style={styles.numberUnit}>{unit}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const sheetStyles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
  },
  hint: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: colors.surface,
    paddingTop: 8,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  close: {
    fontSize: 13,
    color: colors.outline,
  },
  body: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.roastedBean,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  chipActive: {
    borderColor: colors.roastedBean,
    backgroundColor: colors.roastedBean,
  },
  chipText: {
    fontSize: 13,
    color: colors.onSurface,
  },
  chipTextActive: {
    color: colors.linenCream,
    fontWeight: "700",
  },
  button: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: colors.roastedBean,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.linenCream,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  numberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
  },
  numberUnit: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
  },
});
