import os
from dotenv import load_dotenv


class ShiperateConfig:
    """
    Stores all configurations for interfacing with Shiperate
    """

    teams: list[str]
    env_vars: dict[str, str | None]
    configuration: dict[str, str | None]

    def __init__(self, teams: list[str], env_path: str) -> None:
        if not load_dotenv(env_path):
            raise RuntimeError(
                "No environment variables set, please ensure your dotenv file is non empty."
            )
        self.teams = teams
        self.configuration = {
            "aws_access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
            "aws_secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
        }


# Stores the team names for all SW teams
FALL_2025_SW_TEAMS = ["Karp", "CineCircle", "SpecialStandard", "Prisere"]
ENV_PATH = "./.env"
