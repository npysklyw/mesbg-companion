# Army validation foundation

`validateArmy` checks only constraints already enforced by the current army
builder: warband capacity, Independent Hero duplication and warbands, the
current one-third bow limit, and catalogue-declared mandatory heroes and
Generals. Control helpers prevent removing a selected mandatory profile.

Coverage is intentionally incomplete. This layer does not infer alliance,
composition, equipment, profile uniqueness, leader-selection, historical
alliance, or other MESBG rules. Those rules require authoritative source
material and explicit product decisions before implementation.

`mustBeLeader` remains supported for existing persisted armies. New catalogue
requirements use separate `mandatory` and `mustBeGeneral` flags so presence and
General status are represented independently.
