import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { usePremiumStatus } from "@/hooks/use-premium-status";
import { API_BASE_URL } from "@/constants/api";
import { useThemeMode } from "@/hooks/use-theme-mode";

export default function AddDeadline() {
  const router = useRouter();
  const { colors } = useThemeMode();
  const { isPremium } = usePremiumStatus();
  const FREE_TASK_LIMIT = 5;

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [priority, setPriority] = useState("medium");

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!title || !course || !estimatedHours) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (!isPremium) {
      try {
        const tasksResponse = await fetch(`${API_BASE_URL}/tasks`);
        const currentTasks = await tasksResponse.json();
        if (currentTasks.length >= FREE_TASK_LIMIT) {
          Alert.alert(
            "Free limit reached",
            `You can track up to ${FREE_TASK_LIMIT} tasks on the free plan. Upgrade to Premium for unlimited tasks.`
          );
          return;
        }
      } catch (error) {
        console.error("Error checking task count:", error);
      }
    }

    const newTask = {
      title,
      course,
      deadline: formatDate(deadline),
      estimated_hours: parseFloat(estimatedHours),
      hours_completed: 0,
      priority,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Backend rejected the request:", errorBody);
        throw new Error("Failed to add task");
      }

      Alert.alert("Success", "Deadline added!");
      setTitle("");
      setCourse("");
      setDeadline(new Date());
      setEstimatedHours("");
      setPriority("medium");
      router.push("/");
    } catch (error) {
      Alert.alert("Error", "Could not add deadline. Is the backend running?");
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Add Deadline</Text>

      <Text style={[styles.label, { color: colors.text }]}>Title</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Math Assignment"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.label, { color: colors.text }]}>Course</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={course}
        onChangeText={setCourse}
        placeholder="e.g. Math 210"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.label, { color: colors.text }]}>Deadline</Text>
      <TouchableOpacity
        style={[styles.input, { borderColor: colors.border }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: colors.text }}>{formatDate(deadline)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={deadline}
          mode="date"
          display="default"
          onValueChange={(event, selectedDate) => {
            if (Platform.OS === "android") {
              setShowDatePicker(false);
            }
            if (selectedDate) {
              setDeadline(selectedDate);
            }
          }}
          onDismiss={() => setShowDatePicker(false)}
          minimumDate={new Date()}
        />
      )}

      <Text style={[styles.label, { color: colors.text }]}>Estimated Hours</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={estimatedHours}
        onChangeText={setEstimatedHours}
        placeholder="e.g. 3"
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
      />

      <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
      <View style={styles.priorityRow}>
        {["low", "medium", "high"].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.priorityButton,
              { borderColor: colors.border },
              priority === level && styles.priorityButtonActive,
            ]}
            onPress={() => setPriority(level)}
          >
            <Text style={priority === level ? styles.priorityTextActive : { color: colors.text }}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Add Deadline</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 14, marginTop: 12, marginBottom: 4, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    justifyContent: "center",
    minHeight: 44,
  },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  priorityButtonActive: { backgroundColor: "#6c5ce7", borderColor: "#6c5ce7" },
  priorityTextActive: { color: "#fff", fontWeight: "600" },
  submitButton: {
    backgroundColor: "#6c5ce7",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});