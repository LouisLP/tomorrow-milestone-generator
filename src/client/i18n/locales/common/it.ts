import type en from './en'

export default {
  app: {
    name: 'Generatore di milestone',
    skipToContent: 'Vai al contenuto principale',
  },
  language: {
    label: 'Lingua',
  },
  actions: {
    cancel: 'Annulla',
    confirm: 'Conferma',
    retry: 'Riprova',
    save: 'Salva',
    delete: 'Elimina',
    undo: 'Annulla',
    done: 'Fatto',
    edit: 'Modifica',
    close: 'Chiudi',
    backToList: 'Torna alle sfide',
  },
  errors: {
    validation_failed: 'Alcuni campi vanno corretti.',
    not_found: 'Questa sfida non esiste più.',
    milestone_cap_exceeded: 'Una sfida può avere al massimo {cap} milestone. Accetta meno bozze.',
    last_milestone: 'Una sfida deve avere almeno una milestone. Elimina invece la sfida.',
    generation_refused: 'L\'IA si è rifiutata di proporre milestone per questo brief. Prova a riformularlo.',
    generation_invalid: 'L\'IA ha restituito milestone che non possiamo usare. Riprova.',
    generation_rate_limited: 'Il servizio di IA è occupato al momento. Attendi un attimo e riprova.',
    generation_unavailable: 'Impossibile raggiungere il servizio di IA. Riprova.',
    internal: 'Qualcosa è andato storto. Riprova.',
    network_error: 'Sembra che tu sia offline. Controlla la connessione e riprova.',
    unexpected_response: 'Qualcosa è andato storto. Riprova.',
    unknown: 'Qualcosa è andato storto. Riprova.',
  },
  validation: {
    required: 'Campo obbligatorio.',
    tooLong: 'Usa al massimo {max} caratteri.',
    invalid: 'Valore non valido.',
  },
} satisfies typeof en
