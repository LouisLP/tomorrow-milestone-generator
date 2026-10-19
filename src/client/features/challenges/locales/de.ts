import type en from './en'

export default {
  challenges: {
    list: {
      title: 'Challenges',
      create: 'Neue Challenge',
      loading: 'Challenges werden geladen',
      milestoneCount: 'Keine Meilensteine | 1 Meilenstein | {count} Meilensteine',
      updated: 'Aktualisiert {time}',
      empty: {
        title: 'Noch keine Challenges',
        body: 'Schreibe einen Titel und ein Briefing, und die KI entwirft Meilensteine, die du prüfst.',
      },
    },
    new: {
      title: 'Neue Challenge',
      placeholder: 'Platzhalter: Titel und Briefing schreiben, Meilenstein-Entwürfe generieren, prüfen, speichern.',
    },
    detail: {
      title: 'Challenge',
      notFound: 'Challenge nicht gefunden',
      loading: 'Challenge wird geladen',
      titleLabel: 'Titel der Challenge',
      brief: 'Briefing',
      briefHint: 'Änderungen am Briefing wirken sich nur auf künftig generierte Meilensteine aus.',
      milestones: 'Meilensteine',
      milestoneTitleLabel: 'Titel von Meilenstein {n}',
      milestoneDescriptionLabel: 'Beschreibung von Meilenstein {n}',
      deleteMilestone: 'Meilenstein {n} löschen',
      deleteMilestoneDialog: {
        title: 'Diesen Meilenstein löschen?',
        description: '„{title}“ wird aus der Challenge entfernt. Das lässt sich nicht rückgängig machen.',
      },
      deleteChallenge: 'Challenge löschen',
      deleteChallengeDialog: {
        title: 'Diese Challenge löschen?',
        description: '„{title}“ und ihre {count} Meilensteine werden gelöscht. Das lässt sich nicht rückgängig machen. | „{title}“ und ihr Meilenstein werden gelöscht. Das lässt sich nicht rückgängig machen. | „{title}“ und ihre {count} Meilensteine werden gelöscht. Das lässt sich nicht rückgängig machen.',
      },
    },
    notFound: {
      title: 'Seite nicht gefunden',
    },
  },
} satisfies typeof en
