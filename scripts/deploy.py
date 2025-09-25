import os
import shutil
import docker
import subprocess

REQUIRED_DEPS = ["doctl", "docker"]
REQUIRED_ENV_VARS = ["DO_TOKEN", "DOCKERFILE", "CONTEXT", "REPO", "TAG"]


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


def _fail_on_push_errors(stream) -> None:
    for msg in stream:
        # Print everything for visibility
        print(msg)
        if isinstance(msg, dict) and "error" in msg:
            raise RuntimeError(f"Docker push failed: {msg['error']}")


def push_to_registry(client: docker.DockerClient) -> None:
    cwd = os.environ.get("CONTEXT")
    dockerfile_path = os.environ.get("DOCKERFILE")
    repo = os.environ["REPO"]
    tag = os.environ["TAG"]
    full_tag = f"{repo}:{tag}"
    image, _ = client.images.build(
        path=cwd,
        dockerfile=dockerfile_path,
        tag=full_tag,
    )
    print(f"Successfully built the latest image: {image.id}, pushing image...")
    # TODO: Utilize the Digital Ocean REST API to clean up images and collect garbage
    # requests.post()
    push_stream = client.images.push(repo, tag, stream=True, decode=True)
    _fail_on_push_errors(push_stream)


def authenticate() -> None:
    result = subprocess.run(
        f"doctl auth init --access-token {os.environ['DO_TOKEN']}",
        shell=True,
        capture_output=True,
        text=True,
        check=True,
    )
    print(result.stdout)
    result = subprocess.run(
        "doctl registry login",
        shell=True,
        capture_output=True,
        text=True,
        check=True,
    )
    print(result.stdout)


def main():
    # First verify we have all the tools necessary to deploy to digital ocean.
    check_dependecies()
    print("All dependencies have been verified!")
    # Build the image from the docker client
    print("Authenticating with doctl...")
    authenticate()
    client = docker.from_env()
    push_to_registry(client)


if __name__ == "__main__":
    main()
