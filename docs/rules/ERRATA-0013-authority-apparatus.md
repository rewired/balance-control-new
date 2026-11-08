# ERRATA-0013 — Authority Apparatus activation

Date: 2026-11-07
Status: Accepted
Applies to: EXP-02 v1.0, EXP-02-05/-06 and EXP-02-08-M05
Decision: DD-0017, R14; approved by the user during the rules review.

## Defect

Authority Apparatus referred to an undefined normal effect without specifying activation timing or rights. Competence Conflict placed Administration on a Tile not defined to produce or convert Resources, conflicting with the ordinary Regulation target restrictions unless interpreted as an implicit exception.

## Approved correction

The authoritative correction is incorporated in `002-expansion02.md`:

- EXP-02-05-01/-02 define its complete base function as the Political Action ActivateAuthorityApparatus, requiring the active player's canonical control, including virtual control.
- The player moves or removes exactly one existing Regulation on Board. EXP-02-05-02A allows remote targets without an adjacency requirement and does not authorize creation from Supply.
- EXP-02-05-03 defines base cost zero, with any applicable cost modifiers paid before execution by the active player.
- Existing EXP-02-05-04/-05 retain the single Apparatus ContextTile, explicit source restrictions, and Regulation destination eligibility from R03.
- EXP-02-05-06 and -06-01 include the action in EXP-02 and allow it as the one otherwise legal extra action after PlayMeasure, without generating another action.
- EXP-02-08-M05-03 through -05 replace Administration with Control for Competence Conflict. After the next successful own activation this turn, the owner may separately pay normal placement costs to place one Control on the Apparatus.
- This subsequent Regulation changes later effects only. Declining or failing its placement does not roll back the activation; the card's existing price and This turn duration remain unchanged.

Existing rule IDs are preserved. No unknown normal effect or extra Resource function is introduced. Using Control preserves the ordinary type-to-target eligibility rule.

## Examples for later implementation verification

1. A controls the Apparatus through applicable virtual Influence and can activate it without an A-owned real marker on it.
2. An unmodified activation moves or removes one existing remote Regulation for zero Resources. Control on the Apparatus can add a cost; Surveillance on the Regulation's source can still prevent movement/removal.
3. PlayMeasure may be followed by one legal Apparatus activation, after which no further action is granted.
4. Competence Conflict played before that activation can then offer a normally paid Control placement. The new Control cannot retroactively increase the activation's already resolved cost.
5. If that optional placement is declined, prohibited, or unaffordable, the successful activation remains resolved and no Control is added by it.

## Scope and implementation status

This correction does not define SecurityLevel on nonnumeric operations (R16) or every automatic-effect payer and Settlement order (R15). The separate post-activation placement still uses the existing Regulation rules.

Only rule documents are changed. Game code has not yet been adapted or verified against this action or the amended card. Other open DD-0017 proposals remain separate.
