const pulumi = require("@pulumi/pulumi");
const getAmi = require('./controllers/getAmi');
const getAvailabilityZones = require('./controllers/availabilityZones');
const createVpc = require('./controllers/vpc');
const createInternetGateway = require('./controllers/internetGateway');
const createSubnets = require('./controllers/subnets'); 
const createSecurityGroups = require('./controllers/securityGroups');
const createRdsInstance = require('./controllers/rdsInstance');
const createCloudWatch = require('./controllers/cloudWatch');
const createUserData = require('./controllers/userData');
const createEc2Instance = require('./controllers/ec2Instance');
const createAutoScalingGroup = require('./controllers/autoScalingGroup');
const createLoadBalancer = require('./controllers/loadBalancer');
const createSnsTopic = require('./controllers/snsTopic');
const createRoute53 = require('./controllers/route53');
const createStorageBucket = require('./controllers/storageBucket');
const createServiceAccount = require('./controllers/serviceAccount');
const createDynamoDB = require('./controllers/dynamoDB');
const createLambdaRole = require('./controllers/lambdaRole');
const createLambdaFunction = require('./controllers/lambdaFunction');

const createCloud = async () => {
    // get latest ami
    const amiId = await getAmi();

    // get avaiable zones
    const zones = await getAvailabilityZones();

    // Create VPC
    const myVpc = createVpc();

    // Create an Internet Gateway resource and attach it to the VPC
    const myInternetGateway = createInternetGateway(myVpc);

    // Create Subnets 
    const subnets = createSubnets(myVpc, myInternetGateway, zones);

    // Create all security groups
    const securityGroups = createSecurityGroups(myVpc);

    // Create RDS instance
    const rdsInstance = createRdsInstance(myVpc, subnets, securityGroups);

    // Create Cloud Watch agent and logs
    const cloudWatchAgent = createCloudWatch();

    // Create SNS topic
    const snsTopic = createSnsTopic();

    // User data script to configure the EC2 instance
    const userDataScript = createUserData(rdsInstance.rdsInstance, snsTopic);
    
    // Create an EC2 instance
    // const ec2Instance = createEc2Instance(amiId, myVpc, subnets, securityGroups, userDataScript, cloudWatchAgent);

    // Create Load Balancer
    const loadBalancer = createLoadBalancer(myVpc, subnets, securityGroups);

    // Create Auto Scaling Group
    const autoScalingGroup = createAutoScalingGroup(amiId, myVpc, subnets, securityGroups, userDataScript, cloudWatchAgent, loadBalancer, rdsInstance.rdsInstance);

    // Create an A record
    const aRecord = createRoute53(loadBalancer);

    // Create gcp storage bucket
    const storageBucket = createStorageBucket();

    // Create gcp service account
    const serviceAccount = createServiceAccount();

    // Create Dynamo DB
    const dynamoDB = createDynamoDB();

    // Create lambda role
    const lambdaRole = createLambdaRole(snsTopic);

    // Create Lambda Function
    const lambdaFunction = createLambdaFunction(snsTopic, storageBucket, serviceAccount, dynamoDB, lambdaRole);
}

createCloud();
