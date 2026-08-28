import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from "react-native";

type ScheduleItem = { task: string; hours: number };
type Schedule = { [day: string]: ScheduleItem[] };

export default function Rescue() {
  const [dailyHours, setDailyHours] = useState("2");
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRescue = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daily_available_hours: parseFloat(dailyHours),
          num_days: 7,
        }),
      });

      if (!response.ok) {
        throw new Error("Rescue request failed");
      }

      const data: Schedule = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Rescue My Plan</Text>

      <Text style={styles.label}>Hours available per day</Text>
      <TextInput
        style={styles.input}
        value={dailyHours}
        onChangeText={setDailyHours}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.rescueButton} onPress={handleRescue}>
        <Text style={styles.rescueButtonText}>
          {loading ? "Calculating..." : "Rescue My Plan"}
        </Text>
      </TouchableOpacity>

      {schedule && (
        <View style={styles.results}>
          {Object.entries(schedule).map(([day, items]) => (
            <View key={day} style={styles.dayBlock}>
              <Text style={styles.dayTitle}>Day {parseInt(day) + 1}</Text>
              {items.length === 0 ? (
                <Text style={styles.emptyDay}>Nothing scheduled</Text>
              ) : (
                items.map((item, index) => (
                  <View key={index} style={styles.taskRow}>
                    <Text style={styles.taskText}>{item.task}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#000" },
  label: { fontSize: 14, marginBottom: 4, fontWeight: "600", color: "#000" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: "#000",
    marginBottom: 16,
  },
  rescueButton: {
    backgroundColor: "#6c5ce7",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  rescueButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  results: { marginTop: 24 },
  dayBlock: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  dayTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#000" },
  emptyDay: { color: "#888", fontStyle: "italic" },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  taskText: { color: "#000", fontSize: 15 },
  hoursText: { color: "#6c5ce7", fontWeight: "600" },
});