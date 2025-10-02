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
        self._lambda_client = boto3.client(
        "lambda",
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret,
        region_name="us-east-1",
        )
        self._sqs_client = boto3.client(
            "sqs",
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret,
            region_name="us-east-1",
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

    def create_lambda_function(self, function_name: str, role_name: str) -> None:
        """Creates a basic Lambda function stub that the team can configure"""
        
        def impl():
            import zipfile
            from io import BytesIO
            
            sts_client = boto3.client('sts',
                aws_access_key_id=self._config.configuration.get("aws_access_key_id"),
                aws_secret_access_key=self._config.configuration.get("aws_secret_access_key")
            )
            account_id = sts_client.get_caller_identity()['Account']
            
            # Basic starter code
            starter_code = """def lambda_handler(event, context):
        # TODO: Add your code here
        print("Event:", event)
        return {
            'statusCode': 200,
            'body': 'Lambda function created! Edit this code to add your logic.'
        }
    """
            
            # Create a zip file in memory
            zip_buffer = BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                zip_file.writestr('index.py', starter_code)
            
            zip_buffer.seek(0)
            
            return self._lambda_client.create_function(
                FunctionName=function_name,
                Runtime='python3.12',
                Role=f'arn:aws:iam::{account_id}:role/{role_name}-lambda-execution',
                Handler='index.lambda_handler',
                Code={'ZipFile': zip_buffer.read()},
                Description=f'Stub function for {role_name} - configure as needed',
                Timeout=30,
                MemorySize=128,
            )
        
        self._wrap_error(impl)


    def create_sqs_queue(self, queue_name: str) -> None:
        """Creates an SQS queue"""
        
        def impl():
            return self._sqs_client.create_queue(
                QueueName=queue_name,
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

    def update_role_policy_with_user(self, role_name: str) -> None:
        def impl():
            user_iam = self._iam_client.get_user(UserName=role_name)
            trust_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": f"{user_iam['User']['Arn']}"},
                        "Action": "sts:AssumeRole",
                    }
                ],
            }
            return self._iam_client.update_assume_role_policy(
                RoleName=role_name, PolicyDocument=json.dumps(trust_policy)
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

    def create_lambda_execution_role(self, role_name: str) -> None:
        """Creates a Lambda execution role for the team"""
        
        def impl():
            execution_role_name = f"{role_name}-lambda-execution"
            
            # Trust policy - allows Lambda to assume this role
            trust_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            
            # Create the role
            role_res = self._iam_client.create_role(
                RoleName=execution_role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description=f"Execution role for {role_name} Lambda functions"
            )
            
            # Attach basic Lambda execution policy (for CloudWatch logs)
            self._iam_client.attach_role_policy(
                RoleName=execution_role_name,
                PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
            )
            
            print(f"Created execution role: {execution_role_name}")
            return role_res
        
        self._wrap_error(impl)

    def add_s3_bucket_permissions_to_iam(self, role_name, bucket_name) -> None:
        """Retrieves the existing role policy and adds standard s3 bucket permissions"""

        def impl():
            res = self._s3_client.head_bucket(Bucket=bucket_name)
            if res["ResponseMetadata"]["HTTPStatusCode"] != 200:
                raise RuntimeError(
                    f"{bucket_name} does not exist. Or you do not have permission for this bucket"
                )
            role_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowListingBucketsInConsole",
                        "Effect": "Allow",
                        "Action": ["s3:ListAllMyBuckets", "s3:GetBucketLocation"],
                        "Resource": "*",
                    },
                    {
                        "Effect": "Allow",
                        "Action": "s3:*",
                        "Resource": [
                            f"arn:aws:s3:::{bucket_name}",
                            f"arn:aws:s3:::{bucket_name}/*",
                        ],
                    },
                ],
            }
            policy_name = f"{bucket_name}_s3_policy"

            policy_res = self._iam_client.create_policy(
                PolicyName=policy_name, PolicyDocument=json.dumps(role_policy)
            )
            if policy_res["ResponseMetadata"]["HTTPStatusCode"] != 200:
                raise RuntimeError("Policy does not exist.")

            return self._iam_client.attach_user_policy(
                UserName=role_name, PolicyArn=policy_res["Policy"]["Arn"]
            )

        self._wrap_error(impl)

    def add_lambda_permissions_to_iam(self, role_name, function_name) -> None:
        """Adds Lambda permissions for a specific function"""

        def impl():
            sts_client = boto3.client('sts',
                aws_access_key_id=self._config.configuration.get("aws_access_key_id"),
                aws_secret_access_key=self._config.configuration.get("aws_secret_access_key")
            )
            account_id = sts_client.get_caller_identity()['Account']
            
            role_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowListingLambdaFunctions",
                        "Effect": "Allow",
                        "Action": ["lambda:ListFunctions", "lambda:GetFunction"],
                        "Resource": "*",
                    },
                    {
                        "Effect": "Allow",
                        "Action": "lambda:*",
                        "Resource": f"arn:aws:lambda:{self._region}:{account_id}:function:{function_name}",
                    }
                ],
            }
            
            policy_name = f"{function_name}_lambda_policy"
            
            policy_res = self._iam_client.create_policy(
                PolicyName=policy_name, 
                PolicyDocument=json.dumps(role_policy)
            )
            
            return self._iam_client.attach_user_policy(
                UserName=role_name, 
                PolicyArn=policy_res["Policy"]["Arn"]
            )
        
        self._wrap_error(impl)


    def add_sqs_permissions_to_iam(self, role_name, queue_name) -> None:
        """Adds SQS permissions for a specific queue"""
        
        def impl():
            sts_client = boto3.client('sts',
                aws_access_key_id=self._config.configuration.get("aws_access_key_id"),
                aws_secret_access_key=self._config.configuration.get("aws_secret_access_key")
            )
            account_id = sts_client.get_caller_identity()['Account']
            
            role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["sqs:ListQueues"],
                    "Resource": "*",
                },
                {
                    "Effect": "Allow",
                    "Action": "sqs:*",
                    "Resource": f"arn:aws:sqs:{self._region}:{account_id}:{queue_name}",
                }
                ],
            }
            
            policy_name = f"{queue_name}_sqs_policy"
            
            policy_res = self._iam_client.create_policy(
                PolicyName=policy_name,
                PolicyDocument=json.dumps(role_policy)
            )
            
            return self._iam_client.attach_user_policy(
                UserName=role_name,
                PolicyArn=policy_res["Policy"]["Arn"]
            )
    
        self._wrap_error(impl)

    def detach_user_policy(self, role_name: str, policy_arn: str) -> None:
        """Detaches a policy from a user"""
        
        def impl():
            return self._iam_client.detach_user_policy(
                UserName=role_name,
                PolicyArn=policy_arn
            )
        
        self._wrap_error(impl)


    def delete_policy(self, policy_arn: str) -> None:
        """Deletes an IAM policy"""
        
        def impl():
            return self._iam_client.delete_policy(
                PolicyArn=policy_arn
            )
        
        self._wrap_error(impl)


    def list_user_policies(self, role_name: str) -> None:
        """Lists all policies attached to a user"""
        
        def impl():
            return self._iam_client.list_attached_user_policies(
                UserName=role_name
            )
        
        self._wrap_error(impl)

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
            "create-lambda-execution-role",
            "add-s3-permissions",
            "add-lambda-permissions",
            "add-sqs-permissions",
            "create-user",
            "create-account",
            "attach_role_to_user_iam",
            "update-role-policy",
            
        ],
        type=str,
    )
    iam_parser.add_argument("--role-name", choices=config.teams, type=str)
    iam_parser.add_argument("--bucket-name", type=str)
    iam_parser.add_argument("--function-name", type=str)
    iam_parser.add_argument("--queue-name", type=str)
    iam_parser.add_argument(
        "--password", type=str, help="For authenticating or setting iam user accounts"
    )

    lambda_parser = sub_parser.add_parser("lambda")
    lambda_parser.add_argument("--function-name", type=str)
    lambda_parser.add_argument("--role-name", choices=config.teams, type=str)
    lambda_parser.add_argument(
        "--operation",
        choices=["create-function"],
        type=str,
    )

    sqs_parser = sub_parser.add_parser("sqs")
    sqs_parser.add_argument("--queue-name", type=str)
    sqs_parser.add_argument(
        "--operation",
        choices=["create-queue"],
        type=str,
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

        def add_lambda_permissions_validator():
            role_name = ctx.role_name
            function_name = ctx.function_name
            if role_name is None or function_name is None:
                raise RuntimeError(
                    "Please add role_name and function_name to add Lambda permissions to IAM"
                )
            return {"role_name": role_name, "function_name": function_name}

        def add_sqs_permissions_validator():
            role_name = ctx.role_name
            queue_name = ctx.queue_name
            if role_name is None or queue_name is None:
                raise RuntimeError(
                    "Please add role_name and queue_name to add SQS permissions to IAM"
                )
            return {"role_name": role_name, "queue_name": queue_name}

        iam_ops = {
            "create-role": (aws_client.create_iam_role, create_iam_role_validator),
            "create-lambda-execution-role": (
                aws_client.create_lambda_execution_role,
                create_iam_role_validator,
            ),
            "update-role-policy": (
                aws_client.update_role_policy_with_user,
                create_iam_role_validator,
            ),
            "add-s3-permissions": (
                aws_client.add_s3_bucket_permissions_to_iam,
                add_s3_bucket_validator,
            ),
            "add-lambda-permissions": (
                aws_client.add_lambda_permissions_to_iam,
                add_lambda_permissions_validator,
            ),
            "add-sqs-permissions": (
                aws_client.add_sqs_permissions_to_iam,
                add_sqs_permissions_validator,
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

def handle_lambda(ctx: Namespace, aws_client: _aws_client, parser: ArgumentParser):
    if ctx.operation is None:
        parser.print_help()
    else:
        if ctx.function_name is None or ctx.role_name is None:
            raise RuntimeError("Function name and role name required")
        function_name = ctx.function_name
        role_name = ctx.role_name
        lambda_ops = {
            "create-function": lambda fn, rn: aws_client.create_lambda_function(fn, rn),
        }
        op = ctx.operation
        lambda_ops[op](function_name, role_name)


def handle_sqs(ctx: Namespace, aws_client: _aws_client, parser: ArgumentParser):
    if ctx.operation is None:
        parser.print_help()
    else:
        if ctx.queue_name is None:
            raise RuntimeError("Queue name required")
        queue_name = ctx.queue_name
        sqs_ops = {
            "create-queue": aws_client.create_sqs_queue,
        }
        op = ctx.operation
        sqs_ops[op](queue_name)

def Handle_AWS_Functionality(
    aws_type: str, ctx: Namespace, config: ShiperateConfig, parser: ArgumentParser
):
    aws_client = _aws_client(config=config)
    aws_type_map = {
        "s3": handle_s3, 
        "iam": handle_iam,
        "lambda": handle_lambda,
        "sqs": handle_sqs,
    }
    if aws_type in aws_type_map:
        aws_type_map[aws_type](ctx, aws_client, parser)
    else:
        parser.print_help()
