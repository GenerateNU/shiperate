"""
Python Module for interfacing with Generate's AWS S3 Infrastructure
"""

from argparse import ArgumentParser, Namespace
from typing import Any

from config import ShiperateConfig
from botocore.exceptions import ClientError
import sys
import json

import boto3


class _aws_client:
    _config: ShiperateConfig
    _s3_client: Any
    _iam_client: Any
    _region: str

    def __init__(self, config: ShiperateConfig) -> None:
        aws_secret = config.configuration.get("aws_secret_access_key")
        aws_access_key = config.configuration.get("aws_access_key_id")
        if aws_secret is None or aws_access_key is None:
            raise RuntimeError("Missing aws credentials")
        self._config = config
        self._s3_client = boto3.client(
            "s3",
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret,
        )
        self._iam_client = boto3.client(
            "iam",
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret,
        )
        self._region = "us-east-1"

    def _wrap_error(self, fn):
        try:
            res = fn()
            if res is not None:
                print(res)
        except ClientError as e:
            print(e.response, file=sys.stderr)

    def list_s3_buckets(self, _) -> None:
        """List all buckets associated with the current AWS account"""

        def impl():
            return self._s3_client.list_buckets()["Buckets"]

        self._wrap_error(impl)

    def delete_s3_bucket(self, bucket_name: str) -> None:
        """Delets the s3 bucket"""

        def impl():
            return self._s3_client.delete_bucket(Bucket=bucket_name)

        self._wrap_error(impl)

    def create_s3_bucket(self, bucket_name: str) -> None:
        """Creates an S3 Bucket for the given team with all the proper permissions"""

        def impl():
            return self._s3_client.create_bucket(
                Bucket=bucket_name,
            )

        self._wrap_error(impl)

    def attach_iam_policy_for_role(self, role_name: str) -> None:
        def impl():
            role_iam = self._iam_client.get_role(RoleName=role_name)
            assume_role_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": "sts:AssumeRole",
                        "Resource": f"{role_iam['Role']['Arn']}",
                    }
                ],
            }
            return self._iam_client.put_user_policy(
                UserName=role_name,
                PolicyName=role_name,
                PolicyDocument=json.dumps(assume_role_policy),
            )

        self._wrap_error(impl)

    def create_iam_account_with_username(self, role_name: str) -> None:
        def impl():
            # First get the associated role name
            return self._iam_client.create_user(UserName=role_name)

        self._wrap_error(impl)

    def create_iam_user(self, role_name: str, password: str) -> None:
        def impl():
            return self._iam_client.create_login_profile(
                UserName=role_name, Password=password, PasswordResetRequired=False
            )

        self._wrap_error(impl)

    def add_s3_bucket_permissions_to_iam(self, role_name, bucket_name) -> None:
        """Retrieves the existing role policy and adds standard s3 bucket permissions"""

        def impl():
            res = self._s3_client.head_bucket(Bucket=bucket_name)
            if res["HTTPStatusCode"] != "200":
                raise RuntimeError(
                    f"{bucket_name} does not exist. Or you do not have permission for this bucket"
                )
            role_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "ListObjectsInBucket",
                        "Effect": "Allow",
                        "Action": ["s3:ListBucket"],
                        "Resource": [f"arn:aws:s3:::{bucket_name}"],
                    },
                    {
                        "Sid": "AllObjectActions",
                        "Effect": "Allow",
                        "Action": "s3:*Object",
                        "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
                    },
                ],
            }

            return self._iam_client.put_role_policy(
                RoleName=role_name,
                PolicyName=f"{role_name}_{bucket_name}_s3_policy",
                PolicyDocument=json.dumps(role_policy),
            )

        self._wrap_error(impl)

    def create_iam_role(self, role_name) -> None:
        """Creates an IAM Role for the given team with default service access as well as an associated policy"""

        def impl():
            role_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": ["lambda.amazonaws.com", "s3.amazonaws.com"]
                        },
                        "Action": "sts:AssumeRole",
                    }
                ],
            }

            return self._iam_client.create_role(
                RoleName=role_name, AssumeRolePolicyDocument=json.dumps(role_policy)
            )

        return self._wrap_error(impl)


def Handle_AWS_Parser(aws_parser: ArgumentParser, config: ShiperateConfig) -> None:
    sub_parser = aws_parser.add_subparsers(dest="aws_type")
    # Create S3 Parser for Team S3 CRUD
    s3_parser = sub_parser.add_parser("s3")
    s3_parser.add_argument("--bucket-name", type=str)
    s3_parser.add_argument(
        "--operation",
        choices=["create-bucket", "delete-bucket", "update-bucket", "list-bucket"],
        type=str,
    )

    # Create IAM Parser for each team
    iam_parser = sub_parser.add_parser("iam")
    iam_parser.add_argument(
        "--operation",
        choices=[
            "create-role",
            "add-s3-permissions",
            "create-user",
            "create-account",
            "attach_role_to_user_iam",
        ],
        type=str,
    )
    iam_parser.add_argument("--role-name", choices=config.teams, type=str)
    iam_parser.add_argument("--bucket-name", type=str)
    iam_parser.add_argument(
        "--password", type=str, help="For authenticating or setting iam user accounts"
    )


def handle_s3(ctx: Namespace, aws_client: _aws_client, parser: ArgumentParser):
    if ctx.operation is None:
        parser.print_help()
    else:
        if ctx.bucket_name is None and ctx.operation != "list-bucket":
            raise RuntimeError("Bucket name required")
        bucket_name = ctx.bucket_name
        s3_ops = {
            "create-bucket": aws_client.create_s3_bucket,
            "delete-bucket": aws_client.delete_s3_bucket,
            "list-bucket": aws_client.list_s3_buckets,
        }
        op = ctx.operation
        s3_ops[op](bucket_name)


def handle_iam(ctx: Namespace, aws_client: _aws_client, parser: ArgumentParser):
    if ctx.operation is not None:

        def create_iam_role_validator():
            role_name = ctx.role_name
            if role_name is None:
                raise RuntimeError("Please specify a name with the --role_name flag")
            return {"role_name": role_name}

        def add_s3_bucket_validator():
            role_name = ctx.role_name
            bucket_name = ctx.bucket_name
            if role_name is None or bucket_name is None:
                raise RuntimeError(
                    "Please add role_name and bucket_name to add s3 bucket permissions to IAM"
                )
            return {"role_name": role_name, "bucket_name": bucket_name}

        def create_iam_account_validator():
            role_name = ctx.role_name
            password = ctx.password
            if role_name is None or password is None:
                raise RuntimeError(
                    "Need username and password to create the IAM account"
                )
            return {"role_name": role_name, "password": password}

        iam_ops = {
            "create-role": (aws_client.create_iam_role, create_iam_role_validator),
            "add-s3-permissions": (
                aws_client.add_s3_bucket_permissions_to_iam,
                add_s3_bucket_validator,
            ),
            "attach_role_to_user_iam": (
                aws_client.attach_iam_policy_for_role,
                create_iam_role_validator,
            ),
            "create-user": (
                aws_client.create_iam_account_with_username,
                create_iam_role_validator,
            ),
            "create-account": (
                aws_client.create_iam_user,
                create_iam_account_validator,
            ),
        }
        op = ctx.operation
        fn, arg_fn = iam_ops[op]
        args = arg_fn()
        fn(**args)
    else:
        parser.print_help()


def Handle_AWS_Functionality(
    aws_type: str, ctx: Namespace, config: ShiperateConfig, parser: ArgumentParser
):
    aws_client = _aws_client(config=config)
    aws_type_map = {"s3": handle_s3, "iam": handle_iam}
    if aws_type in aws_type_map:
        aws_type_map[aws_type](ctx, aws_client, parser)
    else:
        parser.print_help()
