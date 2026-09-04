# Army validation foundation

`validateArmy` checks only constraints already enforced by the current army
builder: warband capacity, Independent Hero duplication and warbands, and the
current one-third bow limit. Control helpers also preserve the existing rule
that a selected mandatory leader cannot be removed.

Coverage is intentionally incomplete. This layer does not infer alliance,
composition, equipment, profile uniqueness, leader-selection, historical
alliance, or other MESBG rules. Those rules require authoritative source
material and explicit product decisions before implementation.

An unselected `mustBeLeader` profile is not currently reported as invalid.
The existing UI only prevents removing that profile after it has been selected;
changing that behavior is outside this characterization pass.
