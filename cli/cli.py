import argparse

from aws import Handle_AWS_Functionality, Handle_AWS_Parser
from config import ENV_PATH, FALL_2025_SW_TEAMS, ShiperateConfig


def main(config: ShiperateConfig):
    description = """
    Shiperate's CLI tool for creating and managing infrastructure.
    """
    parser = argparse.ArgumentParser(description=description)
    sub_parsers = parser.add_subparsers(dest="command")

    aws_parser = sub_parsers.add_parser("aws")

    # Split parsers into their respective functionalities
    Handle_AWS_Parser(aws_parser=aws_parser, config=config)
    args = parser.parse_args()

    if args.command == "aws":
        Handle_AWS_Functionality(args.aws_type, args, config, aws_parser)
    else:
        parser.print_help()


if __name__ == "__main__":
    config = ShiperateConfig(teams=FALL_2025_SW_TEAMS, env_path=ENV_PATH)
    main(config=config)
