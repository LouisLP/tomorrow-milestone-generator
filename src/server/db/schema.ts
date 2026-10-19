import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const challenges = sqliteTable('challenges', {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  brief: text().notNull(),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull(),
})

export const milestones = sqliteTable('milestones', {
  id: integer().primaryKey({ autoIncrement: true }),
  challengeId: integer().notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  /** Server-owned: 0-based and contiguous per Challenge. */
  position: integer().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull(),
}, table => [
  index('milestones_challenge_id_position_idx').on(table.challengeId, table.position),
])

export type ChallengeRow = typeof challenges.$inferSelect
export type MilestoneRow = typeof milestones.$inferSelect
