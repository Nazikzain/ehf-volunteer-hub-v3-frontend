import { createContext, useContext } from "react";
import type { Actor } from "./attendance";
export const DemoActorContext = createContext<Actor>({
  role: "Technical System Administrator",
  name: "Demo Technical Administrator",
  projects: [],
});
export const useDemoActor = () => useContext(DemoActorContext);
