import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ProjectId = "ripplify" | "watchtower" | "shopalize" | "forms";

export interface Project {
  id: ProjectId;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const PROJECTS: Project[] = [
  { id: "ripplify", name: "Ripplify", color: "text-emerald-400", bgColor: "bg-emerald-500", icon: "⚡" },
  { id: "shopalize", name: "Shopalize", color: "text-blue-400", bgColor: "bg-blue-500", icon: "🛒" },
  { id: "watchtower", name: "Watchtower", color: "text-purple-400", bgColor: "bg-purple-500", icon: "👁" },
  { id: "forms", name: "Forms", color: "text-orange-400", bgColor: "bg-orange-500", icon: "📝" },
];

interface ProjectContextType {
  currentProject: Project;
  setProject: (id: ProjectId) => void;
  projectApiBase: string;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [currentProjectId, setCurrentProjectId] = useState<ProjectId>(() => {
    const saved = localStorage.getItem("admin_project");
    return (saved as ProjectId) || "ripplify";
  });

  const currentProject = PROJECTS.find((p) => p.id === currentProjectId) || PROJECTS[0];

  useEffect(() => {
    localStorage.setItem("admin_project", currentProjectId);
  }, [currentProjectId]);

  const setProject = (id: ProjectId) => {
    setCurrentProjectId(id);
  };

  // The API base path for the current project
  const projectApiBase = `/admin/${currentProjectId}`;

  return (
    <ProjectContext.Provider value={{ currentProject, setProject, projectApiBase }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjectContext must be used within ProjectProvider");
  return context;
};
