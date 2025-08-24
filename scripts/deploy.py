import os
import shutil
import docker

REQUIRED_DEPS = ["doctl", "docker"]
REQUIRED_ENV_VARS = ["DO_TOKEN", "DOCKERFILE", "CONTEXT"]


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
        if os.environ.get(env_var) is None:
            raise RuntimeError(f"Missing environment variable: {env_var}")


def containerize(client: docker.DockerClient) -> None:
    image, _ = client.images.build(
        path=os.environ.get("CONTEXT"),
        dockerfile=os.environ.get("DOCKERFILE"),
        tag="latest",
    )
    print("Successfully built the latest image: ", image)


def main():
    # First verify we have all the tools necessary to deploy to digital ocean.
    check_dependecies()
    print("All dependencies have been verified!")
    # Build the image from the docker client
    client = docker.from_env()
    containerize(client)

    # Second interact with the digital ocean REST API to ensure we have routed the proper containers.


if __name__ == "__main__":
    main()
