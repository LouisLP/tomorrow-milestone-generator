import type en from './en'

export default {
  app: {
    name: 'Meilenstein-Generator',
    skipToContent: 'Zum Hauptinhalt springen',
  },
  actions: {
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    retry: 'Erneut versuchen',
    save: 'Speichern',
    delete: 'Löschen',
    undo: 'Rückgängig',
    done: 'Fertig',
    edit: 'Bearbeiten',
    close: 'Schließen',
    backToList: 'Zurück zu den Challenges',
  },
  errors: {
    validation_failed: 'Einige Felder müssen korrigiert werden.',
    not_found: 'Diese Challenge existiert nicht mehr.',
    milestone_cap_exceeded: 'Eine Challenge kann höchstens {cap} Meilensteine haben. Akzeptiere weniger Entwürfe.',
    last_milestone: 'Eine Challenge braucht mindestens einen Meilenstein. Lösche stattdessen die Challenge.',
    generation_refused: 'Die KI hat es abgelehnt, für dieses Briefing Meilensteine zu entwerfen. Versuche, es umzuformulieren.',
    generation_invalid: 'Die KI hat Meilensteine geliefert, die wir nicht verwenden konnten. Versuche es erneut.',
    generation_rate_limited: 'Der KI-Dienst ist gerade ausgelastet. Warte einen Moment und versuche es erneut.',
    generation_unavailable: 'Der KI-Dienst ist nicht erreichbar. Versuche es erneut.',
    internal: 'Etwas ist schiefgelaufen. Versuche es erneut.',
    network_error: 'Du scheinst offline zu sein. Prüfe deine Verbindung und versuche es erneut.',
    unexpected_response: 'Etwas ist schiefgelaufen. Versuche es erneut.',
    unknown: 'Etwas ist schiefgelaufen. Versuche es erneut.',
  },
  validation: {
    required: 'Dieses Feld ist erforderlich.',
    tooLong: 'Verwende höchstens {max} Zeichen.',
    invalid: 'Dieser Wert ist ungültig.',
  },
} satisfies typeof en
