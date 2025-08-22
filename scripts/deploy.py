import os
import shutil

REQUIRED_DEPS = ["doctl", "docker"]
REQUIRED_ENV_VARS = ["DIGITAL_OCEAN_TOKEN"]


def exists(program: str) -> bool:
    return shutil.which(program) is not None


def check_dependecies() -> None:
    """Checks for all dependencies, environment variables necessary to run deployment."""
    # Check for required dependencies
    for dependency in REQUIRED_DEPS:
        if not exists(dependency):
            raise RuntimeError(f"Missing dependency: {dependency}")
    # Check for required environment variables
    for env_var in REQUIRED_ENV_VARS:
        if os.environ[env_var] is None:
            raise RuntimeError(f"Missing environment variable: {env_var}")


def main():
    check_dependecies()


if __name__ == "__main__":
    main()
