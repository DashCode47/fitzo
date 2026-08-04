import { Routine } from "@/api/routines";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "expo-router";
import { useState } from "react";

function buildActiveWorkout(routine: Routine) {
  return {
    routineId: routine.id,
    routineName: routine.name,
    startTime: new Date().toISOString(),
    exercises:
      routine.exercises?.map((re) => ({
        exerciseId: re.exercise_id,
        name: re.exercise?.name || "Ejercicio",
        sets: Array.from({ length: re.sets }).map((_, i) => ({
          set: i + 1,
          reps: parseInt(re.reps) || 10,
          weight: 0,
          completed: false,
        })),
      })) || [],
  };
}

export function useStartWorkout() {
  const router = useRouter();
  const { activeWorkout, setActiveWorkout } = useAppStore();
  const [pendingRoutine, setPendingRoutine] = useState<Routine | null>(null);

  const startWorkout = (routine: Routine) => {
    if (activeWorkout) {
      if (activeWorkout.routineId === routine.id) {
        router.push("/workout-session");
        return;
      }
      setPendingRoutine(routine);
      return;
    }
    setActiveWorkout(buildActiveWorkout(routine));
    router.push("/workout-session");
  };

  const confirmReplace = () => {
    if (!pendingRoutine) return;
    setActiveWorkout(buildActiveWorkout(pendingRoutine));
    router.push("/workout-session");
    setPendingRoutine(null);
  };

  const cancelReplace = () => setPendingRoutine(null);

  return {
    startWorkout,
    replaceModalProps: {
      visible: !!pendingRoutine,
      type: "confirm" as const,
      title: "¿Reemplazar Entrenamiento?",
      message: `Tienes una sesión en curso (${activeWorkout?.routineName ?? ""}). Si empiezas "${pendingRoutine?.name ?? ""}" ahora, perderás su progreso.`,
      onClose: cancelReplace,
      onConfirm: confirmReplace,
      buttonText: "SÍ, REEMPLAZAR",
      cancelText: "CANCELAR",
    },
  };
}
