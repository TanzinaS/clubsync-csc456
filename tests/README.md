# Tests

Test plans, test cases, and automated tests for ClubSync.

**QA Lead:** Ayman

Developers are also expected to test their own work before opening a pull request.

## Folders

| Folder | Purpose |
|---|---|
| `frontend/` | Tests for UI pages and components |
| `backend/` | Tests for API endpoints, backend logic, and server startup |

Both `tests/backend/` and `tests/frontend/` contain an empty `__init__.py` file to allow Python's `unittest` framework to discover tests in subdirectories.

## Automated Testing

ClubSync uses Python's built-in `unittest` framework for backend testing.

Backend tests should be placed in `tests/backend/` and follow the naming convention `test_*.py`.

### Running All Python Tests

From the project's root directory, run:

```bash
python -m unittest discover -s tests -v
```

This command automatically discovers and runs Python tests in the `tests/` directory and its importable subdirectories.

### Running Backend Tests Only

To run tests located in the backend test directory, use:

```bash
python -m unittest discover -s tests/backend -p "test_*.py" -v
```

### Expected Results

A successful test run should display the discovered tests followed by `OK`.

For example:

```text
test_backend_discovery ... ok
test_get_clubs ... ok
test_get_events ... ok
test_health ... ok
test_home ... ok

Ran 5 tests

OK
```

The `test_backend_discovery` test is only an example used to verify discovery and does not need to remain in the repository.

Before submitting a pull request, developers should run the relevant automated tests and confirm that all tests pass.

## Manual Test Cases

Manual test cases can be written in Markdown using this format:

```text
Test ID:       TC-001
Feature:       Landing page navigation
Steps:         1. Open the landing page
               2. Click "Events"
Expected:      Events feed page loads
Actual:
Status:        Pass / Fail
Tested by:
Date:
```

Manual testing should supplement automated testing when necessary, particularly for user interface behavior and features not yet covered by automated tests.

## Reporting Bugs

Report bugs as GitHub Issues using the **Bug Report** template.