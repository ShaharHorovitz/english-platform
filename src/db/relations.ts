import { relations } from "drizzle-orm";
import {
  grades,
  units,
  tasks,
  vocabItems,
  profiles,
  userProgress,
  inviteCodes,
} from "./schema";

export const gradesRelations = relations(grades, ({ many }) => ({
  units: many(units),
  profiles: many(profiles),
  inviteCodes: many(inviteCodes),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  grade: one(grades, { fields: [units.gradeId], references: [grades.id] }),
  tasks: many(tasks),
  vocabItems: many(vocabItems),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  unit: one(units, { fields: [tasks.unitId], references: [units.id] }),
  progress: many(userProgress),
}));

export const vocabItemsRelations = relations(vocabItems, ({ one }) => ({
  unit: one(units, { fields: [vocabItems.unitId], references: [units.id] }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  grade: one(grades, { fields: [profiles.gradeId], references: [grades.id] }),
  progress: many(userProgress),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(profiles, {
    fields: [userProgress.userId],
    references: [profiles.id],
  }),
  task: one(tasks, { fields: [userProgress.taskId], references: [tasks.id] }),
}));

export const inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
  grade: one(grades, {
    fields: [inviteCodes.gradeId],
    references: [grades.id],
  }),
  createdBy: one(profiles, {
    fields: [inviteCodes.createdBy],
    references: [profiles.id],
  }),
}));
