# Domain Model (Initial)

## Entities
- Ingredient
  - id, name, functionalRoles[], potencyScore (0–1), dosageRange {unit, min, max, default}, notes, citations[], availability {regions[], status}, substitutes[] (ranked)
- Region
  - id, name, isoCodes[], notes
- RecipeTemplate
  - id, name, description, cropTypes[], stage, ingredients[{ingredientId, role, quantity, unit, optional}], steps[], cautions[], citations[]
- Batch
  - id, templateId, startedAt, duration, volume, params {temp, aeration}, steps[], photos[], notes
- ApplicationLog
  - id, batchId, date, field/plot, rate, method, weather, outcomes {greenness, vigor, notes}
- Crop & Stage
  - cropId, name; stageId, name (seedling, veg, early-flower, late-flower)
- KnowledgeItem
  - id, topic, content, citations[]
- Inventory (post-MVP optional)
  - itemId, ingredientId, qty, unit, location
- UserPrefs
  - locale, units, telemetryOptIn, syncTargets[]

## Functional Roles (examples)
- surfactant (e.g., yucca, quillaja)
- prebiotic (molasses, pearl millet, JA inulin)
- inoculant (castings, bacillus, AMF)
- biostimulant (seaweed, phycocyanin, humic/fulvic)
- elicitor (chitosan)

## Substitution Rule Inputs
- desiredRole(s), region, onHand[], targetCropStage, constraints (organic-only, cost cap)

## Outputs
- ranked list of ingredient options with dosage and rationale (citation ids)
