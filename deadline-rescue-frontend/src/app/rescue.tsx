import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert } from "react-native";
import Purchases from "react-native-purchases";
import { usePremiumStatus } from "@/hooks/use-premium-status";
import { API_BASE_URL } from "@/constants/api";
import { useThemeMode } from "@/hooks/use-theme-mode";

type ScheduleItem = { task: string; hours: number };
type Schedule = { [day: string]: ScheduleItem[] };
type UnscheduledItem = { task: string; hours_remaining: number };

function Paywall() {
  const { colors } = useThemeMode();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const offerings = await Purchases.getOfferings();
      const monthlyPackage = offerings.current?.availablePackages.find(
        (pkg) => pkg.identifier === "$rc_monthly" || pkg.product.identifier === "monthly"
      );

      if (!monthlyPackage) {
        Alert.alert("Error", "Could not find the premium package. Please try again later.");
        return;
      }

      await Purchases.purchasePackage(monthlyPackage);
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert("Purchase failed", "Something went wrong. Please try again.");
        console.error(error);
      }
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <View style={[styles.paywallContainer, { backgroundColor: colors.background }]}>
      <Text style={styles.paywallEmoji}>🚀</Text>
      <Text style={[styles.paywallTitle, { color: colors.text }]}>Premium Planning</Text>
      <Text style={[styles.paywallSubtitle, { color: colors.textSecondary }]}>
        Go beyond basic tracking with a full intelligent planning system built
        for students juggling real deadlines.
      </Text>

      <View style={styles.paywallFeatures}>
        <Text style={[styles.paywallFeature, { color: colors.text }]}>✓ Smart Rescue engine — auto-rebuilds your schedule when you fall behind</Text>
        <Text style={[styles.paywallFeature, { color: colors.text }]}>✓ Unlimited tracked deadlines</Text>
        <Text style={[styles.paywallFeature, { color: colors.text }]}>✓ Adjustable planning windows</Text>
        <Text style={[styles.paywallFeature, { color: colors.text }]}>✓ Overload detection & recovery options</Text>
      </View>

      <TouchableOpacity
        style={styles.purchaseButton}
        onPress={handlePurchase}
        disabled={purchasing}
      >
        {purchasing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.purchaseButtonText}>Upgrade for $9.99/month</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function RescueEngine() {
  const { colors } = useThemeMode();
  const [dailyHours, setDailyHours] = useState("2");
  const [numDaysOverride, setNumDaysOverride] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [unscheduled, setUnscheduled] = useState<UnscheduledItem[]>([]);
  const [explanation, setExplanation] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);

  const runRescue = async (allowOverflow: boolean) => {
    setLoading(true);
    setDismissedWarning(false);
    try {
      const body: any = {
        daily_available_hours: parseFloat(dailyHours),
        allow_overflow: allowOverflow,
      };
      if (numDaysOverride !== null) {
        body.num_days = numDaysOverride;
      }

      const response = await fetch(`${API_BASE_URL}/rescue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Rescue request failed");
      }

      const data = await response.json();
      setSchedule(data.schedule);
      setUnscheduled(data.unscheduled || []);
      setExplanation(data.explanation || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={[styles.header, { color: colors.text }]}>Rescue My Plan</Text>

      <Text style={[styles.label, { color: colors.text }]}>Hours available per day</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={dailyHours}
        onChangeText={setDailyHours}
        keyboardType="numeric"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.label, { color: colors.text }]}>Planning window</Text>
      <View style={styles.chipRow}>
        {[
          { label: "3 days", value: 3 },
          { label: "1 week", value: 7 },
          { label: "2 weeks", value: 14 },
          { label: "Auto", value: null },
        ].map((preset) => (
          <TouchableOpacity
            key={preset.label}
            style={[
              styles.chip,
              { borderColor: colors.border, backgroundColor: colors.background },
              numDaysOverride === preset.value && styles.chipActive,
            ]}
            onPress={() => setNumDaysOverride(preset.value)}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.text },
                numDaysOverride === preset.value && styles.chipTextActive,
              ]}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.rescueButton} onPress={() => runRescue(false)}>
        <Text style={styles.rescueButtonText}>
          {loading ? "Calculating..." : "Rescue My Plan"}
        </Text>
      </TouchableOpacity>

      {explanation.length > 0 && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>💡 Why this plan?</Text>
          {explanation.map((line, index) => (
            <Text key={index} style={styles.explanationText}>{line}</Text>
          ))}
        </View>
      )}

      {unscheduled.length > 0 && !dismissedWarning && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Some work couldn't be scheduled in time:</Text>
          {unscheduled.map((item, index) => (
            <Text key={index} style={styles.warningText}>
              • {item.task} — {item.hours_remaining}h still needed
            </Text>
          ))}
          <View style={styles.warningActions}>
            <TouchableOpacity style={styles.warningButton} onPress={() => runRescue(true)}>
              <Text style={styles.warningButtonText}>Allow overflow past deadline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.warningButton, styles.dismissButton]}
              onPress={() => setDismissedWarning(true)}
            >
              <Text style={styles.warningButtonText}>Ignore for now</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.warningHint}>
            Or increase your available hours or planning window above and tap Rescue My Plan again.
          </Text>
        </View>
      )}

      {schedule && (
        <View style={styles.results}>
          {Object.entries(schedule).map(([day, items]) => (
            <View key={day} style={[styles.dayBlock, { backgroundColor: colors.card }]}>
              <Text style={[styles.dayTitle, { color: colors.text }]}>Day {parseInt(day) + 1}</Text>
              {items.length === 0 ? (
                <Text style={[styles.emptyDay, { color: colors.textSecondary }]}>Nothing scheduled</Text>
              ) : (
                items.map((item, index) => (
                  <View key={index} style={styles.taskRow}>
                    <Text style={{ color: colors.text, fontSize: 15 }}>{item.task}</Text>
                    <Text style={styles.hoursText}>{item.hours}h</Text>
                  </View>
                ))
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default function Rescue() {
  const { colors } = useThemeMode();
  const { isPremium, loading } = usePremiumStatus();

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  return isPremium ? <RescueEngine /> : <Paywall />;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 4, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: "#6c5ce7", borderColor: "#6c5ce7" },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  rescueButton: {
    backgroundColor: "#6c5ce7",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  rescueButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  explanationBox: {
    backgroundColor: "#f0edfc",
    borderColor: "#6c5ce7",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginTop: 16,
  },
  explanationTitle: { fontWeight: "700", color: "#4a3d99", marginBottom: 8 },
  explanationText: { color: "#4a3d99", marginBottom: 6, lineHeight: 20 },
  warningBox: {
    backgroundColor: "#fff4e5",
    borderColor: "#ffb84d",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginTop: 16,
  },
  warningTitle: { fontWeight: "700", color: "#8a5a00", marginBottom: 8 },
  warningText: { color: "#8a5a00", marginBottom: 4 },
  warningActions: { marginTop: 10, gap: 8 },
  warningButton: {
    backgroundColor: "#8a5a00",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  dismissButton: { backgroundColor: "#999", marginTop: 8 },
  warningButtonText: { color: "#fff", fontWeight: "600" },
  warningHint: { marginTop: 8, fontSize: 12, color: "#8a5a00", fontStyle: "italic" },
  results: { marginTop: 24 },
  dayBlock: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  dayTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  emptyDay: { fontStyle: "italic" },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  hoursText: { color: "#6c5ce7", fontWeight: "600" },
  paywallContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 100,
    alignItems: "center",
  },
  paywallEmoji: { fontSize: 60, marginBottom: 16 },
  paywallTitle: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  paywallSubtitle: { fontSize: 15, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  paywallFeatures: { alignSelf: "stretch", marginBottom: 30 },
  paywallFeature: { fontSize: 15, marginBottom: 10 },
  purchaseButton: {
    backgroundColor: "#6c5ce7",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignSelf: "stretch",
    alignItems: "center",
  },
  purchaseButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});