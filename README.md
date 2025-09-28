# Generate's Shipping Repository

## Shiperate CLI

### AWS Functionality

Commands to create, delete, and update IAM Roles for each team. Current support for s3 and iam roles.

```bash
$ python3 cli.py aws
usage: cli.py aws [-h] {s3,iam} ...

positional arguments:
  {s3,iam}
```

#### Standard S3 Bucket IAM Creation Policy + Console Creation

1. First create an S3 Bucket for a team using the command below

```bash
$ python3 cli.py aws s3 --bucket-name {bucket_name} --operation create-bucket
```

2. Next create an IAM role for the given team

```bash
$ python3 cli.py aws iam --operation create-role --role-name {role_name}
```

3. Finally attach the necessary permissions for the given IAM role

```bash
$ python3 cli.py aws iam --operation add-s3-permissions --role-name {role_name} --bucket-name {bucket-name}
```

4. Optional create an IAM login for the TLs for console access
