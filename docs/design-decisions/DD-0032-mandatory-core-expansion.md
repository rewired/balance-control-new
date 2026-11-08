# DD-0032 — CORE als Pflichterweiterung

Stand 2026-11-08.

Die Registry stellt `core` vor die nach ID geordneten optionalen Erweiterungen. Auch ein expliziter Modulsatz für den Resolver enthält immer genau einmal das eingebaute CORE-Modul. Die Konfigurationsflags gelten für EXP-01 bis EXP-03.

CORE registriert seine Ressorts und Tiles über die gemeinsamen Modulschnittstellen. Aus dem Material aller aktiven Module erstellt CORE den Startzustand, einschließlich Start Committee, gemischtem DrawPile und Starting Influence. Danach können aktive Module ihre eigenen Zonen initialisieren. CORE-01-02-01 bis -04A und CORE-01-03-01 bis -09.

Ausführung und Vorschau verwenden denselben Aktionskatalog. CORE registriert seine politischen Aktionen über den gemeinsamen Builder und verwendet den kanonischen Resolver. CORE-01-04-09 und CORE-01-06-00-11 bis -12.

Die Spielstände behielten bei der Einführung der Registry ihre Struktur. Die nachfolgende Kapselung und Migration beschreibt [DD-0033](./DD-0033-core-save-migration.md).
