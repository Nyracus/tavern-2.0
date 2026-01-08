import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./lib/notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Protected from "./components/Protected";
import ProfileProtected from "./components/ProfileProtected";
import AdventurerLeaderboard from "./pages/AdventurerLeaderboard";
import AdminAnomalies from "./pages/AdminAnomalies";
import NPCQuestBoard from "./pages/NPCQuestBoard";
import NPCApplications from "./pages/NPCApplications";
import NPCCompletions from "./pages/NPCCompletions";
import AdventurerQuestBoard from "./pages/AdventurerQuestBoard";
import AdventurerApplications from "./pages/AdventurerApplications";
import GuildmasterChats from "./pages/GuildmasterChats";
import AdminConflicts from "./pages/AdminConflicts";
import AdminTransactions from "./pages/AdminTransactions";
import AdminUsers from "./pages/AdminUsers";
import SkillsShopPage from "./pages/SkillsShopPage";
import AdventurerChats from "./pages/AdventurerChats";
import NPCChats from "./pages/NPCChats";
import CreateAdventurerProfile from "./pages/CreateAdventurerProfile";
import CreateNPCProfile from "./pages/CreateNPCProfile";
import Onboarding from "./pages/Onboarding";
import NPCOrganization from "./pages/NPCOrganization";

const router = createBrowserRouter([
  // public routes
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  // Root should always start at login
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  
  // protected dashboard
  {
    path: "/dashboard",
    element: (
      <ProfileProtected>
        <Dashboard />
      </ProfileProtected>
    ),
  },
  {
    path: "/onboarding",
    element: (
      <Protected roles={["ADVENTURER", "NPC"]}>
        <Onboarding />
      </Protected>
    ),
  },
  {
    path: "/leaderboard",
    element: (
      <Protected>
        <AdventurerLeaderboard />
      </Protected>
    ),
  },
  {
    path: "/admin/anomalies",
    element: (
      <Protected roles={["GUILD_MASTER"]}>
        <AdminAnomalies />
      </Protected>
    ),
  },
  {
    path: "/npc/quests",
    element: (
      <ProfileProtected roles={["NPC"]}>
        <NPCQuestBoard />
      </ProfileProtected>
    ),
  },
  {
    path: "/npc/organization",
    element: (
      <ProfileProtected roles={["NPC"]}>
        <NPCOrganization />
      </ProfileProtected>
    ),
  },
  {
    path: "/npc/applications",
    element: (
      <ProfileProtected roles={["NPC"]}>
        <NPCApplications />
      </ProfileProtected>
    ),
  },
  {
    path: "/npc/completions",
    element: (
      <ProfileProtected roles={["NPC"]}>
        <NPCCompletions />
      </ProfileProtected>
    ),
  },
  {
    path: "/adventurer/quests",
    element: (
      <ProfileProtected roles={["ADVENTURER"]}>
        <AdventurerQuestBoard />
      </ProfileProtected>
    ),
  },
  {
    path: "/adventurer/applications",
    element: (
      <ProfileProtected roles={["ADVENTURER"]}>
        <AdventurerApplications />
      </ProfileProtected>
    ),
  },
  {
    path: "/admin/chats",
    element: (
      <Protected roles={["GUILD_MASTER"]}>
        <GuildmasterChats />
      </Protected>
    ),
  },
  {
    path: "/admin/conflicts",
    element: (
      <Protected roles={["GUILD_MASTER"]}>
        <AdminConflicts />
      </Protected>
    ),
  },
  {
    path: "/admin/transactions",
    element: (
      <Protected roles={["GUILD_MASTER"]}>
        <AdminTransactions />
      </Protected>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <Protected roles={["GUILD_MASTER"]}>
        <AdminUsers />
      </Protected>
    ),
  },
  {
    path: "/skills/shop",
    element: (
      <ProfileProtected roles={["ADVENTURER"]}>
        <SkillsShopPage />
      </ProfileProtected>
    ),
  },
  {
    path: "/adventurer/chats",
    element: (
      <ProfileProtected roles={["ADVENTURER"]}>
        <AdventurerChats />
      </ProfileProtected>
    ),
  },
  {
    path: "/npc/chats",
    element: (
      <ProfileProtected roles={["NPC"]}>
        <NPCChats />
      </ProfileProtected>
    ),
  },
  {
    path: "/create-adventurer-profile",
    element: (
      <Protected roles={["ADVENTURER"]}>
        <CreateAdventurerProfile />
      </Protected>
    ),
  },
  {
    path: "/create-npc-profile",
    element: (
      <Protected roles={["NPC"]}>
        <CreateNPCProfile />
      </Protected>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>
);
