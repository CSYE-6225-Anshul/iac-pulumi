const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const vpcCidrBlock = new pulumi.Config("myVpc").require("cidrBlock");
const publicRouteTableCidrBlock = new pulumi.Config("myPublicRouteTable").require("cidrBlock");
const region = new pulumi.Config("aws").require("region");
const amiId = new pulumi.Config("myAmiID").require("amiId");
const keyId = new pulumi.Config("myKeyId").require("keyId");
const mySubnetMask = new pulumi.Config("mySubnetMask").require("subnetMask");
const applicationPort = new pulumi.Config("myApplicationPort").require("applicationPort");
const dbName = new pulumi.Config("database").require("dbName");
const dbUsername = new pulumi.Config("database").require("dbUsername");
const dbPassword = new pulumi.Config("database").require("dbPassword");

// get available AWS availability zones
const getAvailableAvailabilityZones = async () => {
    const zones = await aws.getAvailabilityZones({ state: "available" });
    const i = Math.min(zones.names.length, 3);
    console.log('zones now: ', i);
    return zones.names.slice(0, i);
};

// Function to calculate CIDR block for subnets
const calculateSubnetCidrBlock = (baseCIDRBlock, index) => {
    const subnetMask = mySubnetMask; // Adjust the subnet mask as needed
    const baseCidrParts = baseCIDRBlock.split("/");
    const networkAddress = baseCidrParts[0].split(".");
    const newSubnetAddress = `${networkAddress[0]}.${networkAddress[1]}.${index}.${networkAddress[2]}`;
    return `${newSubnetAddress}/${subnetMask}`;
};

// Create VPC
const myVpc = new aws.ec2.Vpc("myVpc", {
    cidrBlock: vpcCidrBlock,
    instanceTenancy: "default",
    tags: {
        Name: "myVpc",
    },
});

// Get available zones
const createSubnetsAndEC2 = async () => {
// -----------------------------------------------------------------------------------------
// --------------------------------ZONES/GATEWAYS-------------------------------------------
// -----------------------------------------------------------------------------------------

    const availabilityZones = await getAvailableAvailabilityZones();

    // Create an Internet Gateway resource and attach it to the VPC
    const myInternetGateway = new aws.ec2.InternetGateway("myInternetGateway", {
        vpcId: myVpc.id,
        tags: {
            Name: "myInternetGateway",
        },
    });

// -----------------------------------------------------------------------------------------
// --------------------------------ROUTES/SUBNETS-------------------------------------------
// -----------------------------------------------------------------------------------------

    // Create a public route table and associate all public subnets
    const myPublicRouteTable = new aws.ec2.RouteTable("myPublicRouteTable", {
        vpcId: myVpc.id,
        routes: [
            {
                cidrBlock: publicRouteTableCidrBlock, // destination CIDR block for the internet
                gatewayId: myInternetGateway.id, // internet gateway as the target
            },
        ],
        tags: {
            Name: "myPublicRouteTable",
        },
    });

    const publicRoute = new aws.ec2.Route("publicRoute", {
        routeTableId: myPublicRouteTable.id,
        destinationCidrBlock: publicRouteTableCidrBlock,
        gatewayId: myInternetGateway.id,
    });
    const myPublicSubnets = [];
    const myPrivateSubnets = [];

    for (let i = 0; i < availabilityZones.length; i++) {
        // Create public subnet
        const publicSubnetCidrBlock = calculateSubnetCidrBlock(vpcCidrBlock, i * 2 + 1);
        const privateSubnetCidrBlock = calculateSubnetCidrBlock(vpcCidrBlock, i * 2 + 2);

        const publicSubnet = new aws.ec2.Subnet(`myPublicSubnets${i + 1}`, {
            vpcId: myVpc.id,
            availabilityZone: availabilityZones[i],
            // cidrBlock: `10.0.1${i + 1}.0/24`, // Adjust CIDR blocks as needed
            cidrBlock: publicSubnetCidrBlock,
            mapPublicIpOnLaunch: true, // Enable auto-assign public IPv4 address
            tags: {
                Name: `myPublicSubnets${i + 1}`,
            },
        });
        myPublicSubnets.push(publicSubnet);

        // Create private subnet
        const privateSubnet = new aws.ec2.Subnet(`myPrivateSubnets${i + 1}`, {
            vpcId: myVpc.id,
            availabilityZone: availabilityZones[i],
            // cidrBlock: `10.0.2${i + 1}.0/24`, // Adjust CIDR blocks as needed
            cidrBlock: privateSubnetCidrBlock,
            tags: {
                Name: `myPrivateSubnets${i + 1}`,
            },
        });
        myPrivateSubnets.push(privateSubnet);
    }

    for (let i = 0; i < myPublicSubnets.length; i++) {
        new aws.ec2.RouteTableAssociation(`myPublicRouteTableAssociation-${i}`, {
            subnetId: myPublicSubnets[i].id,
            routeTableId: myPublicRouteTable.id,
        });
    }

    // Create a private route table and associate all private subnets
    const myPrivateRouteTable = new aws.ec2.RouteTable("myPrivateRouteTable", {
        vpcId: myVpc.id,
        tags: {
            Name: "myPrivateRouteTable",
        },
    });

    for (let i = 0; i < myPrivateSubnets.length; i++) {
        new aws.ec2.RouteTableAssociation(`myPrivateRouteTableAssociation-${i}`, {
            subnetId: myPrivateSubnets[i].id,
            routeTableId: myPrivateRouteTable.id,
        });
    }

// -----------------------------------------------------------------------------------------
// --------------------------------SECURITY GROUP-------------------------------------------
// -----------------------------------------------------------------------------------------

    const applicationSecurityGroup = new aws.ec2.SecurityGroup("applicationSecurityGroup", {
        vpcId: myVpc.id,
        ingress: [
            {
                fromPort: 22,
                toPort: 22,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
            },
            {
                fromPort: 80,
                toPort: 80,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
            },
            {
                fromPort: 443,
                toPort: 443,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
            },
            // Add ingress rule for your application port
            {
                fromPort: applicationPort,
                toPort: applicationPort,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
            },
        ],
        egress: [
            // Add egress rule for your application port
            {
               fromPort: 0,
               toPort: 0,
               protocol: "-1",
               cidrBlocks: ["0.0.0.0/0"],
           },
        ]
    }); 
    pulumi.log.info(
        pulumi.interpolate`Application Security Group VPC ID: ${applicationSecurityGroup.vpcId}, ID: ${applicationSecurityGroup.id}`
    );
    
// -----------------------------------------------------------------------------------------
// --------------------------------RDS CONFIG-----------------------------------------------
// -----------------------------------------------------------------------------------------
    
    const databaseSecurityGroup = new aws.ec2.SecurityGroup("databaseSecurityGroup", {
        vpcId: myVpc.id,
        ingress: [
            // Add ingress rule for your application port
            {
                fromPort: 3306,
                toPort: 3306,
                protocol: "tcp",
                securityGroups: [applicationSecurityGroup.id]
            }
        ],
        egress: [
             // Add egress rule for your application port
             {
                fromPort: 3306,
                toPort: 3306,
                protocol: "tcp",
                securityGroups: [applicationSecurityGroup.id]
            }
        ]
    });

    pulumi.log.info(
        pulumi.interpolate`Database Security Group VPC ID: ${databaseSecurityGroup.id}`
    );

    // Create an RDS parameter group
    const rdsParameterGroup = new aws.rds.ParameterGroup("myRdsParameterGroup", {
        vpcId: myVpc.id,
        family: "mariadb10.6", // Change this to match your database engine and version
        name: "my-rds-parameter-group",
        parameters: [
            {
                name: "character_set_server",
                value: "utf8",
            },
            {
                name: "collation_server",
                value: "utf8_general_ci",
            },
        ],
        tags: {
            Name: "myRdsParameterGroup",
        },
    });

    // Create a DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup("myDbSubnetGroup", {
        subnetIds: [myPrivateSubnets[0].id, myPrivateSubnets[1].id],
        name: "my-db-subnet-group",
        tags: {
            Name: "myDbSubnetGroup",
        },
    });

    // Create an RDS instance
    const rdsInstance = new aws.rds.Instance("myRDSInstance", {
        vpcId: myVpc.id,
        vpcSecurityGroupIds: [databaseSecurityGroup.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        engine: "mariadb",
        instanceClass: "db.t2.micro",
        multiAz: false,
        identifier: "csye6225",
        dbName: dbName,
        username: dbUsername,
        password: dbPassword,
        allocatedStorage: 20, // Adjust as needed
        maxAllocatedStorage: 20, // Adjust as needed
        skipFinalSnapshot: true,
        publiclyAccessible: false, // Set to false to restrict access to the internet
        parameterGroupName: rdsParameterGroup.name,
        tags: {
            Name: "myRDSInstance",
        },
    });
    pulumi.log.info(
        pulumi.interpolate`RDS instance id: ${rdsInstance.id}`
    );

// -----------------------------------------------------------------------------------------
// --------------------------------USER DATA CONFIG-----------------------------------------
// -----------------------------------------------------------------------------------------

    // Specify the database configuration
    // const dbUsername = "root";
    // const dbPassword = "anshul";
    const dbHostname = pulumi.interpolate`${rdsInstance.address}`;

    // User data script to configure the EC2 instance
    const userDataScript = pulumi.interpolate`#!/bin/bash
    echo "MYSQL_DATABASE=${dbName}" >> /opt/csye6225/.env
    echo "MYSQL_USER=${dbUsername}" >> /opt/csye6225/.env
    echo "MYSQL_PASSWORD=${dbPassword}" >> /opt/csye6225/.env
    echo "MYSQL_HOST=${dbHostname}" >> /opt/csye6225/.env
    `;
    pulumi.log.info(
        pulumi.interpolate`DB data: dbHostname, userDataScript - ${dbHostname}, ${userDataScript}`
    );

// -----------------------------------------------------------------------------------------
// --------------------------------START EC2 INSTANCE---------------------------------------
// -----------------------------------------------------------------------------------------

    // Create an EC2 instance
    const ec2Instance = new aws.ec2.Instance("myEc2Instance", {
        vpcId: myVpc.id,
        vpcSecurityGroupIds: [applicationSecurityGroup.id],
        subnetId: myPublicSubnets[0].id,
        ami: amiId, // Replace with your AMI ID
        keyName: keyId,
        instanceType: "t2.micro",
        rootBlockDevice: {
            volumeSize: 25,
            volumeType: "gp2",
            deleteOnTermination: true,
        },
        protectFromTermination: false,
        userData: userDataScript, // Attach the user data script
        tags: {
            Name: "myEc2Instance",
        },
    });
}

// Create a public route in the public route table with the internet gateway as the target
// Invoking create subnets
createSubnetsAndEC2();
