import { useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "expo-router";

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
    fetch("http://localhost:8000/tasks")
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
              await fetch(`http://localhost:8000/tasks/${taskId}`, {
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
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text>{item.course} • Due: {item.deadline}</Text>
              <Text>{item.estimated_hours}h estimated • Priority: {item.priority}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id, item.title)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#000" },
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
  deleteButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 10,
  },
  deleteButtonText: { color: "#fff", fontWeight: "600" },
});