import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ActivityType = "prompt" | "workflow" | "employee";

export type Activity = {
  id: string;
  title: string;
  detail: string;
  type: ActivityType;
  createdAt: Date;
};

type ActivityContextValue = {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, "id" | "createdAt">) => void;
};

const initialActivities: Activity[] = [
  {
    id: "initial-1",
    title: "Meeting summary generated",
    detail: "Weekly strategy meeting",
    type: "prompt",
    createdAt: new Date(Date.now() - 8 * 60 * 1000),
  },
  {
    id: "initial-2",
    title: "Client follow-up email drafted",
    detail: "For Sarah Johnson",
    type: "employee",
    createdAt: new Date(Date.now() - 24 * 60 * 1000),
  },
  {
    id: "initial-3",
    title: "Content workflow completed",
    detail: "5 social posts created",
    type: "workflow",
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
  },
];

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  function addActivity(activity: Omit<Activity, "id" | "createdAt">) {
    setActivities((currentActivities) => {
      const nextActivities = [
        {
          ...activity,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        },
        ...currentActivities,
      ];

      console.log("ACTIVITIES UPDATED", nextActivities);

      return nextActivities;
    });
  }

  const value = useMemo(() => ({ activities, addActivity }), [activities]);

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);

  if (!context) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }

  return context;
}