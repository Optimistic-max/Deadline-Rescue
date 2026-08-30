import { useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { API_BASE_URL } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";

type Task = {
  id: number;
  title: string;
  course: string;
  deadline: string;
  estimated_hours: number;
  hours_completed: number;
  priority: string;
};

function getTaskLabel(task: Task): { icon: string; text: string; color: string } | null {
  if (task.hours_completed >= task.estimated_hours) return null; // completed, no label

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(task.deadline);
  const daysLeft = Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { icon: "⚠️", text: "Overdue", color: "#ff4d4d" };
  }
  if (task.hours_completed === 0 && daysLeft <= 2) {
    return { icon: "⏰", text: "Due soon, not started", color: "#e67e22" };
  }
  return null;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [overdueCount, setOverdueCount] = useState(0);
  const [notStartedCount, setNotStartedCount] = useState(0);

  const fetchTasks = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/tasks`)
      .then((response) => response.json())
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      });

    fetch(`${API_BASE_URL}/tasks/status`)
      .then((response) => response.json())
      .then((data) => {
        setOverdueCount(data.overdue.length);
        setNotStartedCount(data.not_started.length);
      })
      .catch((error) => console.error("Error fetching status:", error));
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );
  const handleComplete = async (taskId: number) => {
    try {
      await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
        method: "PATCH",
      });
      fetchTasks();
    } catch (error) {
      console.error("Error marking task complete:", error);
      Alert.alert("Error", "Could not mark task complete.");
    }
  };
  const handleDelete = (taskId: number, taskTitle: string) => {
    Alert.alert(
      "Delete task?",
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: "DELETE",
              });
              fetchTasks();
            } catch (error) {
              console.error("Error deleting task:", error);
              Alert.alert("Error", "Could not delete task.");
            }
          },
        },
      ]
    );
  };


  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Deadlines</Text>
      {(overdueCount > 0 || notStartedCount > 0) && (
        <View style={styles.statusBanner}>
          {overdueCount > 0 && (
            <Text style={styles.statusText}>
              ⚠️ {overdueCount} task{overdueCount > 1 ? "s" : ""} overdue
            </Text>
          )}
          {notStartedCount > 0 && (
            <Text style={styles.statusText}>
              ⏰ {notStartedCount} task{notStartedCount > 1 ? "s" : ""} not started, due soon
            </Text>
          )}
        </View>
      )}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No deadlines yet</Text>
            <Text style={styles.emptyStateSubtext}>Tap Explore to add your first one</Text>
          </View>
        }

        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskMeta}>{item.course} • Due: {item.deadline}</Text>
              <Text style={styles.taskMeta}>{item.estimated_hours}h estimated • Priority: {item.priority}</Text>
              {(() => {
                const label = getTaskLabel(item);
                return label ? (
                  <Text style={[styles.taskLabel, { color: label.color }]}>
                    {label.icon} {label.text}
                  </Text>
                ) : null;
              })()}
              {item.hours_completed >= item.estimated_hours && (
                <Text style={styles.completeBadge}>✓ Completed</Text>
              )}
            </View>
            <View style={styles.actionButtons}>
              {item.hours_completed < item.estimated_hours && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleComplete(item.id)}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.iconButton, styles.deleteIconButton]}
                onPress={() => handleDelete(item.id, item.title)}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#000" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyStateText: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 6 },
  emptyStateSubtext: { fontSize: 14, color: "#888" },
  taskCard: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 18, fontWeight: "600", color: "#000" },
  taskMeta: { color: "#555", fontSize: 13, marginTop: 2 },
  taskLabel: { fontWeight: "700", marginTop: 4 },
  actionButtons: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2ecc71",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconButton: { backgroundColor: "#ff4d4d" },
  iconButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  completeBadge: { color: "#2ecc71", fontWeight: "700", marginTop: 4 },
  statusBanner: {
    backgroundColor: "#fff4e5",
    borderColor: "#ffb84d",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  statusText: { color: "#8a5a00", fontWeight: "600", marginBottom: 4 },
});