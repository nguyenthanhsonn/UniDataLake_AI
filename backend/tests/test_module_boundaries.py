"""Architecture guard: enforce the module boundaries of the V1.0 baseline.

The rules mirror ``docs/architecture/system-architecture-baseline.md`` (section 5).
When a module legitimately needs a new dependency, update ``ALLOWED_DEPENDENCIES`` here
and the dependency matrix in the document in the same pull request.
"""

from __future__ import annotations

import ast
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[1] / "app"
MODULES_ROOT = APP_ROOT / "modules"

# Direct module -> module dependencies allowed in V1.0 (must stay acyclic).
ALLOWED_DEPENDENCIES: dict[str, set[str]] = {
    "auth": {"users"},
    "users": set(),
    "datasources": set(),
    "ingestion": {"datasources", "governance"},
    "governance": set(),
    "nlq": {"governance", "query_history"},
    "dashboard": set(),
    "query_history": set(),
}

# Compatibility aliases kept during the transition; they only re-export a new module.
LEGACY_MODULES = {"ingest", "pipeline", "query", "ai_engine"}

# A module may import another module only through its public surface.
PUBLIC_SURFACE = {"service", "schemas"}

# Third-party clients that must only be touched inside app/infra.
INFRA_ONLY_PACKAGES = {"openai", "anthropic", "minio", "duckdb", "langchain", "boto3"}


def _imports(path: Path) -> list[str]:
    """Return absolute dotted names imported by a Python file."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    names: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
            names.append(node.module)
            names.extend(f"{node.module}.{alias.name}" for alias in node.names)
    return names


def _python_files(root: Path) -> list[Path]:
    return sorted(p for p in root.rglob("*.py") if "__pycache__" not in p.parts)


def _module_names() -> set[str]:
    return {p.name for p in MODULES_ROOT.iterdir() if p.is_dir() and not p.name.startswith("_")}


def test_every_module_is_classified() -> None:
    """A new folder under app/modules must be added to the baseline before use."""
    assert _module_names() == set(ALLOWED_DEPENDENCIES) | LEGACY_MODULES


def test_allowed_dependencies_are_acyclic() -> None:
    visiting: set[str] = set()
    done: set[str] = set()

    def visit(name: str) -> None:
        assert name not in visiting, f"dependency cycle through module '{name}'"
        if name in done:
            return
        visiting.add(name)
        for dependency in ALLOWED_DEPENDENCIES[name]:
            visit(dependency)
        visiting.discard(name)
        done.add(name)

    for module in ALLOWED_DEPENDENCIES:
        visit(module)


def test_modules_only_depend_on_allowed_modules_via_public_surface() -> None:
    violations: list[str] = []
    for module, allowed in ALLOWED_DEPENDENCIES.items():
        for file in _python_files(MODULES_ROOT / module):
            for name in _imports(file):
                parts = name.split(".")
                if parts[:2] != ["app", "modules"] or len(parts) < 3 or parts[2] == module:
                    continue
                target = parts[2]
                location = f"{file.relative_to(APP_ROOT)} imports {name}"
                if target not in allowed:
                    violations.append(f"{location}: '{module}' may not depend on '{target}'")
                elif len(parts) > 3 and parts[3] not in PUBLIC_SURFACE:
                    violations.append(f"{location}: only {sorted(PUBLIC_SURFACE)} are public")
    assert not violations, "\n".join(violations)


def test_legacy_modules_only_reexport_from_new_modules() -> None:
    violations: list[str] = []
    for module in LEGACY_MODULES:
        for file in _python_files(MODULES_ROOT / module):
            for name in _imports(file):
                parts = name.split(".")
                if parts[:2] == ["app", "modules"] and parts[2] in LEGACY_MODULES:
                    violations.append(f"{file.relative_to(APP_ROOT)} imports legacy {name}")
    assert not violations, "\n".join(violations)


def test_core_infra_and_shared_do_not_import_modules() -> None:
    violations: list[str] = []
    for layer in ("core", "infra", "shared"):
        for file in _python_files(APP_ROOT / layer):
            violations.extend(
                f"{file.relative_to(APP_ROOT)} imports {name}"
                for name in _imports(file)
                if name.startswith("app.modules")
            )
    assert not violations, "\n".join(violations)


def test_external_clients_are_only_used_in_infra() -> None:
    violations: list[str] = []
    for file in _python_files(APP_ROOT):
        if "infra" in file.relative_to(APP_ROOT).parts:
            continue
        violations.extend(
            f"{file.relative_to(APP_ROOT)} imports {name}"
            for name in _imports(file)
            if name.split(".")[0] in INFRA_ONLY_PACKAGES
        )
    assert not violations, "\n".join(violations)
