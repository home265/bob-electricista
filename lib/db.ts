"use client";
import Dexie, { Table } from "dexie";
import type { Project } from "./project/types";

class ProjectDB extends Dexie {
  projects!: Table<Project, string>;
  constructor() {
    super("bob-projects"); // mismo esquema que Gas
    this.version(1).stores({
      projects: "id, name, updatedAt", // índices: id (pk), name, updatedAt
    });
  }
}

export const db = new ProjectDB();
