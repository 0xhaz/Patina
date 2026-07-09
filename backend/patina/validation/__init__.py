"""Validation stage — deterministic policy + consistency checks in plain Python.

Arithmetic and date logic live in CODE (not the LLM); only fuzzy work would go to a
model. These produce *candidate* flags; the pipeline's Memory-Consult stage decides
which survive as genuine novel exceptions vs known, already-resolved patterns.
"""
