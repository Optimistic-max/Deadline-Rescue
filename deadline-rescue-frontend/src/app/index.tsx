import { useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { API_BASE_URL } from "@/constants/api";

type Task = {
  id: number;
  title: string;
  course: string;
  deadline: string;
  estimated_hours: number;
  hours_completed: number;
  priority: string;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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
            <Text>{item.course} • Due: {item.deadline}</Text>
            <Text>{item.estimated_hours}h estimated • Priority: {item.priority}</Text>
            {item.hours_completed >= item.estimated_hours && (
              <Text style={styles.completeBadge}>✓ Completed</Text>
            )}
          </View>
          <View style={styles.actionButtons}>
            {item.hours_completed < item.estimated_hours && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleComplete(item.id)}
              >
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id, item.title)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
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
  
  actionButtons: { flexDirection: "column", gap: 6 },
  completeButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  completeButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  completeBadge: { color: "#2ecc71", fontWeight: "700", marginTop: 4 },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 10,
  },
  deleteButtonText: { color: "#fff", fontWeight: "600" },
});