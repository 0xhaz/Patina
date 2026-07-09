"""Pipeline orchestration — the staged agent loop.

Intake → Extraction → Validation → Memory-Consult → Exception-Route → Human-Gate → Learn

Each stage is a discrete function over an explicit PipelineState (persisted per vendor
for pause/resume + audit). Memory-Consult is the novel stage: it decides which candidate
flags are genuine novel exceptions vs known, already-resolved patterns — the source of
the 'it learned in front of you' compounding behaviour.
"""
