#!/bin/bash
# Stores aliases to shiperate commands

list_buckets() {
  python3 ./cli.py aws s3 --operation list-bucket
}

create_bucket() {
  if [ "$#" -ne 1 ]; then
    echo "Error: Expected exactly 1 arguments, got $#"
    return 1
  fi
  local bucket_name="$1"
  python3 ./cli.py aws s3 --bucket-name $bucket_name --operation create-bucket
}

create_iam_role() {
  if [ "$#" -ne 1 ]; then
    echo "Error: Expected exactly 1 arguments, got $#"
    return 1
  fi
  local role_name="$1"
  python3 cli.py aws iam --operation create-role --role-name $role_name
}

add_s3_permissions() {
  if [ "$#" -ne 2 ]; then
    echo "Error: Expected exactly 1 arguments, got $#"
    return 1
  fi
  local role_name="$1"
  local bucket_name="$2"
  python3 cli.py aws iam --operation add-s3-permissions --role-name $role_name --bucket-name $bucket_name
}

create_iam_user() {
  if [ "$#" -ne 1 ]; then
    echo "Error: Expected exactly 1 arguments, got $#"
    return 1
  fi
  local user_name="$1"
  python3 cli.py aws iam --operation create-user --role-name $user_name
}

attach_role_to_iam_user() {
  if [ "$#" -ne 1 ]; then
    echo "Error: Expected exactly 1 arguments, got $#"
    return 1
  fi
  local user_name="$1"
  python3 cli.py aws iam --operation attach_role_to_user_iam --role-name $user_name
}

create_iam_account() {
  if [ "$#" -ne 2 ]; then
    echo "Error: Expected exactly 1 arguments, got $#"
    return 1
  fi
  local user_name="$1"
  local password="$2"
  python3 cli.py aws iam --operation create-account --role-name $user_name --password $password
}

update_role_policy_with_user() {
  if [ "$#" -ne 1 ]; then
    echo "Error: Expected exactly 1 arguments, got $#"
    return 1
  fi
  local user_name="$1"
  python3 cli.py aws iam --operation update-role-policy --role-name $user_name
}

create_lambda_function() {
  if [ "$#" -ne 2 ]; then
    echo "Error: Expected exactly 2 arguments, got $#"
    return 1
  fi
  local role_name="$1"
  local function_name="$2"
  python3 cli.py aws lambda --operation create-function --role-name $role_name --function-name $function_name
}

create_lambda_execution_role() {
  if [ "$#" -ne 1 ]; then
    echo "Error: Expected exactly 1 argument, got $#"
    return 1
  fi
  local role_name="$1"
  python3 cli.py aws iam --operation create-lambda-execution-role --role-name $role_name
}

add_lambda_permissions() {
  if [ "$#" -ne 2 ]; then
    echo "Error: Expected exactly 2 arguments, got $#"
    return 1
  fi
  local role_name="$1"
  local function_name="$2"
  python3 cli.py aws iam --operation add-lambda-permissions --role-name $role_name --function-name $function_name
}

create_sqs_queue() {
  if [ "$#" -ne 1 ]; then
    echo "Error: Expected exactly 1 arguments, got $#"
    return 1
  fi
  local queue_name="$1"
  python3 cli.py aws sqs --operation create-queue --queue-name $queue_name
}

add_sqs_permissions() {
  if [ "$#" -ne 2 ]; then
    echo "Error: Expected exactly 2 arguments, got $#"
    return 1
  fi
  local role_name="$1"
  local queue_name="$2"
  python3 cli.py aws iam --operation add-sqs-permissions --role-name $role_name --queue-name $queue_name
}

"$@"
