# AWS and Google Cloud Infrastructure Deployment

This repository contains infrastructure-as-code (IaC) scripts for deploying a scalable and highly available web application on AWS and on Google Cloud using Pulumi.

## AWS Infrastructure

### VPC and Subnets

The AWS infrastructure includes a Virtual Private Cloud (VPC) with public and private subnets across multiple availability zones. The VPC is created with the following components:

- **VPC**: The main Virtual Private Cloud.
- **Public Subnets**: Subnets with internet access for deploying load balancers.
- **Private Subnets**: Subnets for deploying backend services.

### Load Balancer

An Application Load Balancer (ALB) is deployed in the public subnet to distribute incoming traffic to the backend instances.

### Auto Scaling Group

An Auto Scaling Group is created to ensure that the desired number of EC2 instances is maintained across availability zones.

### RDS (Relational Database Service)

A MariaDB RDS instance is deployed in the private subnet for storing application data.

### Security Groups

Various security groups are implemented to control inbound and outbound traffic to the deployed resources.

### IAM Roles

IAM roles are defined for the EC2 instances, Lambda function, and other services for secure communication and resource access.

### CloudWatch Alarms and Scaling Policies

CloudWatch alarms are set up to monitor CPU utilization, and corresponding scaling policies are defined to automatically adjust the number of instances based on demand.

## Google Cloud Infrastructure

### Google Cloud Storage

A Google Cloud Storage bucket is created for storing application artifacts.

### Google Cloud Identity and Access Management (IAM)

IAM roles are defined to grant necessary permissions to the service account used by the application.

## Lambda Function for GitHub Repo Processing

This repository also includes a Lambda function designed to process GitHub repository submissions triggered by an Amazon Simple Notification Service (SNS) event. The function performs tasks such as downloading GitHub repositories, uploading to Google Cloud Storage, sending email notifications, and saving details to DynamoDB.

### Environment Variables

Ensure that the Lambda function has the following environment variables configured:

- **BUCKET_NAME**: The name of the Google Cloud Storage bucket.
- **DYNAMODB_TABLE**: The name of the DynamoDB table for storing email details.
- **SOURCE_EMAIL**: The source email address for sending notifications.
- **REGION**: The AWS region.
- **GOOGLE_CREDENTIALS**: Base64-encoded JSON credentials for Google Cloud Storage.
- **GOOGLE_PROJECT_ID**: The Google Cloud project ID.

### Dependencies

- **AWS SDK**: Used for interacting with AWS services.
- **dotenv**: Used for loading environment variables from a .env file.
- **download**: A library for downloading files.
- **@google-cloud/storage**: The official Google Cloud Storage library for Node.js.
- **uuid**: A library for generating UUIDs.

## Prerequisites
1. [Install Pulumi](https://www.pulumi.com/docs/get-started/install/)
2. [Configure AWS and GCP Credentials](https://www.pulumi.com/docs/intro/cloud-providers/aws/setup/)
3. [Node.js](https://nodejs.org/) installed (required for Pulumi JavaScript/TypeScript projects)

### Installation and Deployment

1. Clone the repository.
2. Run `npm install` to install the required dependencies.
3. Configure the environment variables in a `.env` file.
4. Deploy the Lambda function in your AWS environment using the AWS Management Console, AWS CLI, or any other preferred deployment method.

### Running Pulumi
1. Navigate to the `infra` directory.
2. Run `pulumi up` to create the infrastructure.
3. Confirm the changes when prompted.
4. Wait for the deployment to complete.

### Import SSL Certificate to AWS Certificate Manager using command:
- **aws acm import-certificate --certificate fileb://path-to-file --private-key fileb://path-to-file --certificate-chain fileb://path-to-file**

### Create Load Balancer Listener using above imported certificate:
- **aws elbv2 create-listener --load-balancer-arn <lb-arn> --protocol HTTPS --port 443 --certificates CertificateArn=<cert-arn> --default-actions Type=forward,TargetGroupArn=<lb-target-grp-arn>**

### To perfrom instance refresh:
- **aws autoscaling start-instance-refresh --auto-scaling-group-name <auto-scaling-group-name> --preferences MinHealthyPercentage=90,InstanceWarmup=60 --strategy Rolling**

### Pulumi States
1. Refreshing State: If the infrastructure is updated outside of Pulumi, run the following command to refresh the state:
- **pulumi refresh**

2. Destroying Infrastructure: To destroy the entire infrastructure, run:
- **pulumi destroy**

3. Updating Infrastructure: To update the infrastructure with code changes, run:
- **pulumi up**

### Usage

1. Configure an SNS topic to trigger the Lambda function.
2. Send an SNS message with the required information (email and GitHub repository URL) to the configured SNS topic.
3. The Lambda function will process the submission, download the GitHub repository, upload it to GCS, send email notifications, and save details to DynamoDB.

### Steps

#### Pulumi Configuration

1. Configure Pulumi settings in the respective files (AWS, GCP, etc.).

#### Run Pulumi Commands

2. Execute `pulumi up` to deploy the infrastructure.
3. Use `pulumi refresh` for updates and `pulumi destroy` for teardown.

#### SNS Topic and Lambda Function

4. Configure an SNS topic for Lambda triggers.
5. Send an SNS message with email and GitHub repo details to initiate processing.

#### Complete Workflow

6. Lambda function processes submissions, downloads GitHub repos, and uploads to GCS.
7. Email notifications are sent, and details are saved to DynamoDB.

#### Optional: CI/CD Integration

8. Integrate with CI/CD pipelines for automated testing and deployment.

#### Logging and Monitoring

9. Utilize CloudWatch for logging and monitoring.
10. Ensure IAM roles and permissions are reviewed for security.

#### Documentation

11. Maintain comprehensive documentation for the deployment process.
12. Share knowledge with the team for effective troubleshooting.
  
### Troubleshooting

- Check CloudWatch Logs for Lambda function logs to identify any errors or issues.
- Ensure that the required IAM roles and permissions are set for their respective execution.
- Verify that the provided environment variables are correct and accessible.

### Contributors

- **Author:** Anshul Sharma
- **Maintainer:** Anshul Sharma

Feel free to contribute by submitting issues or pull requests.
