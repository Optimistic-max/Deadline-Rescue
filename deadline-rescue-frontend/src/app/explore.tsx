import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { usePremiumStatus } from "@/hooks/use-premium-status";

export default function AddDeadline() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [deadline, setDeadline] = useState(""); // format: YYYY-MM-DD
  const [estimatedHours, setEstimatedHours] = useState("");
  const [priority, setPriority] = useState("medium");
  const { isPremium } = usePremiumStatus();
  const FREE_TASK_LIMIT = 5;

const handleSubmit = async () => {
  if (!title || !course || !deadline || !estimatedHours) {
    Alert.alert("Missing info", "Please fill in all fields.");
    return;
  }
  if (!isPremium) {
    try {
      const tasksResponse = await fetch("http://localhost:8000/tasks");
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
    deadline,
    estimated_hours: parseFloat(estimatedHours),
    hours_completed: 0,
    priority,
  };

  try {
    const response = await fetch("http://localhost:8000/tasks", {
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
    setDeadline("");
    setEstimatedHours("");
    setPriority("medium");
    router.push("/");
  } catch (error) {
    Alert.alert("Error", "Could not add deadline. Is the backend running?");
    console.error(error);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Deadline</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Math Assignment" placeholderTextColor="#999"/>

      <Text style={styles.label}>Course</Text>
      <TextInput style={styles.input} value={course} onChangeText={setCourse} placeholder="e.g. Math 210" placeholderTextColor="#999" />

      <Text style={styles.label}>Deadline (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={deadline} onChangeText={setDeadline} placeholder="2026-09-02" placeholderTextColor="#999"/>

      <Text style={styles.label}>Estimated Hours</Text>
      <TextInput
        style={styles.input}
        value={estimatedHours}
        onChangeText={setEstimatedHours}
        placeholder="e.g. 3"
        keyboardType="numeric"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Priority</Text>
      <View style={styles.priorityRow}>
        {["low", "medium", "high"].map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.priorityButton, priority === level && styles.priorityButtonActive]}
            onPress={() => setPriority(level)}
          >
            <Text style={priority === level ? styles.priorityTextActive : styles.priorityText}>
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
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#000" },
  label: { fontSize: 14, marginTop: 12, marginBottom: 4, fontWeight: "600", color: "#000" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: "#000",
  },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  priorityButtonActive: { backgroundColor: "#6c5ce7", borderColor: "#6c5ce7" },
  priorityText: { color: "#333" },
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