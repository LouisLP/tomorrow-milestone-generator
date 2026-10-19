import type en from './en'

export default {
  challenges: {
    list: {
      title: 'Sfide',
      create: 'Nuova sfida',
      loading: 'Caricamento delle sfide',
      milestoneCount: 'Nessuna milestone | 1 milestone | {count} milestone',
      updated: 'Aggiornata {time}',
      empty: {
        title: 'Ancora nessuna sfida',
        body: 'Scrivi un titolo e un brief: l\'IA propone le milestone e tu le rivedi.',
      },
    },
    new: {
      title: 'Nuova sfida',
      detailsLabel: 'Dettagli della sfida',
      editDetails: 'Modifica dettagli',
    },
    form: {
      title: 'Titolo della sfida',
      brief: 'Brief',
      briefHint: 'Cosa devono imparare o costruire i partecipanti? L\'IA propone le milestone nella lingua del brief.',
      generate: 'Genera milestone',
      generating: 'Preparazione delle milestone…',
    },
    detail: {
      title: 'Sfida',
      notFound: 'Sfida non trovata',
      loading: 'Caricamento della sfida',
      titleLabel: 'Titolo della sfida',
      brief: 'Brief',
      briefHint: 'Le modifiche al brief valgono solo per le milestone generate d\'ora in poi.',
      milestones: 'Milestone',
      milestoneTitleLabel: 'Titolo della milestone {n}',
      milestoneDescriptionLabel: 'Descrizione della milestone {n}',
      deleteMilestone: 'Elimina la milestone {n}',
      deleteMilestoneDialog: {
        title: 'Eliminare questa milestone?',
        description: '«{title}» verrà rimossa dalla sfida. L\'operazione non può essere annullata.',
      },
      newMilestones: 'Nuove milestone',
      generateMore: 'Genera altre milestone',
      capReached: 'Una sfida può avere al massimo {cap} milestone. Eliminane una per generarne altre.',
      deleteChallenge: 'Elimina sfida',
      deleteChallengeDialog: {
        title: 'Eliminare questa sfida?',
        description: '«{title}» e le sue {count} milestone verranno eliminate. L\'operazione non può essere annullata. | «{title}» e la sua milestone verranno eliminate. L\'operazione non può essere annullata. | «{title}» e le sue {count} milestone verranno eliminate. L\'operazione non può essere annullata.',
      },
    },
    notFound: {
      title: 'Pagina non trovata',
    },
  },
} satisfies typeof en
