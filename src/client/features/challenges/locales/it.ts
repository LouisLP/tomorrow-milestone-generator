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
        body: 'Scrivi un titolo e un brief: l\'AI propone le milestone e tu le rivedi.',
      },
    },
    new: {
      title: 'Nuova sfida',
      placeholder: 'Segnaposto: scrivi titolo e brief, genera le bozze di milestone, rivedile, salva.',
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
