---
trigger: always_on
---

## 15. Code Quality and Clean Code

Write clean, readable, maintainable, and idiomatic code.

Follow these principles:

- Keep functions small and focused on a single responsibility.
- Keep modules focused on a clear domain responsibility.
- Avoid deeply nested control flow when it can be simplified.
- Prefer descriptive names over short or ambiguous names.
- Avoid unnecessary abbreviations.
- Avoid duplicated business logic.
- Do not repeat the same validation or transformation logic across multiple layers.
- Keep business logic out of HTTP handlers when it belongs in services.
- Keep database queries inside repositories.
- Avoid unnecessary abstractions and premature generalization.
- Do not create helper functions or utilities unless they provide meaningful reuse or clarity.
- Prefer composition over excessive inheritance-like abstraction patterns.
- Keep types explicit and meaningful.
- Prefer immutable data when practical.
- Handle errors explicitly and preserve useful error context.
- Avoid `unwrap()` and `expect()` in production code unless the invariant is genuinely guaranteed and the reason is clear.
- Do not use comments to explain code that should instead be made self-explanatory.
- Use comments when they explain *why* something is done, especially for non-obvious architectural or security decisions.
- Remove dead code, unused imports, obsolete comments, and temporary debugging code before considering a task complete.

### Duplication

Do not blindly eliminate every repeated line of code.

Small amounts of duplication are preferable to creating premature or overly generic abstractions.

Extract shared logic when the duplication represents the same concept and is likely to evolve together.

### Complexity

Prefer the simplest implementation that satisfies the requirement.

Do not introduce design patterns, abstractions, generic systems, or additional layers solely to make the code appear more sophisticated.

Complexity must have a concrete reason.

### Consistency

Follow the existing project conventions.

When introducing a new pattern, use it consistently within the relevant module or layer.

Do not mix multiple approaches for solving the same problem without a concrete reason.

### Before Completion

Before considering a task complete:

1. Review the changed code for unnecessary complexity.
2. Check for duplicated logic.
3. Check naming and responsibility boundaries.
4. Remove temporary/debug code.
5. Run formatting and linting tools.
6. Run relevant tests.
7. Verify that unrelated code was not unnecessarily modified.