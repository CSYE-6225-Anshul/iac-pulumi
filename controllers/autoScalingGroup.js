const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
// const amiId = new pulumi.Config("myAmiID").require("amiId");
const keyId = new pulumi.Config("myKeyId").require("keyId");

const asg = async (amiId, myVpc, subnets, securityGroups, userDataScript, cloudWatchAgent, loadBalancer, rdsInstance) => {
    let myPublicSubnets = subnets.myPublicSubnets;
    let applicationSecurityGroup = securityGroups.applicationSecurityGroup;
    let ec2InstanceRoleAttachment = cloudWatchAgent.ec2InstanceRoleAttachment;
    let lbTargetGroup = loadBalancer.targetGroup;
    
    const asgLaunchTemplate = new aws.ec2.LaunchTemplate("myLaunchTemplate", {
        vpcId: myVpc.id,
        securityGroups: [applicationSecurityGroup.id],
        vpcSecurityGroupIds: [applicationSecurityGroup.id],
        // subnetId: myPublicSubnets[0].id,
        imageId: amiId,
        keyName: keyId,
        instanceType: "t2.micro",
        rootBlockDevice: {
            volumeSize: 25,
            volumeType: "gp2",
            deleteOnTermination: true,
        },
        protectFromTermination: false,
        userData: userDataScript,
        tags: {
            Name: "myAutoScalingGroup",
        },
        iamInstanceProfile: {
            name: ec2InstanceRoleAttachment.name
        },
        associatePublicIpAddress: true,
    },
    {
        dependsOn: rdsInstance
    });

    const autoScalingGroup = new aws.autoscaling.Group("myAutoScalingGroup", {
        vpcZoneIdentifiers: myPublicSubnets.map(subnet => subnet.id),
        launchTemplate: {
            id: asgLaunchTemplate.id,
            version: "$Latest",
        },
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 1,
        cooldown: 60,
        tags: [{
            key: "Name",
            value: "autoscaling-group",
            propagateAtLaunch: true,
        }],
        targetGroupArns: [lbTargetGroup.arn],
        instanceRefresh: {
            strategy: "Rolling",
            preferences: {
                minHealthyPercentage: 70,
                instanceWarmup: 60,
            },
        },
        forceDelete: true
    });

    const autoScalingPolicyScaleOut = new aws.autoscaling.Policy("scaleOutPolicy", {
        scalingAdjustment: 1, // Increase capacity by 1 instance
        adjustmentType: "ChangeInCapacity",
        cooldown: 60, // 5 minutes cooldown
        autoscalingGroupName: autoScalingGroup.name,
        policyType: 'SimpleScaling'
    });
    
    const autoScalingPolicyScaleIn = new aws.autoscaling.Policy("scaleInPolicy", {
        scalingAdjustment: -1, // Decrease capacity by 1 instance
        adjustmentType: "ChangeInCapacity",
        cooldown: 60, // 5 minutes cooldown
        autoscalingGroupName: autoScalingGroup.name,
        policyType: 'SimpleScaling'
    });

    // Define CPU utilization alarms for the autoscaling policies
    const highCpuAlarm = new aws.cloudwatch.MetricAlarm("HighCpuAlarm", {
        alarmDescription: "Scaling Up Alarm",
        comparisonOperator: "GreaterThanOrEqualToThreshold",
        evaluationPeriods: "1",
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        period: "60",
        statistic: "Average",
        threshold: "5",
        actionsEnabled: true,
        alarmActions: [autoScalingPolicyScaleOut.arn],
        dimensions: {
            AutoScalingGroupName: autoScalingGroup.name,
        }
    });

    const lowCpuAlarm = new aws.cloudwatch.MetricAlarm("LowCpuAlarm", {
        alarmDescription: "Scaling Down Alarm",
        comparisonOperator: "LessThanOrEqualToThreshold",
        evaluationPeriods: "1",
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        period: "60",
        statistic: "Average",
        threshold: "3",
        actionsEnabled: true,
        alarmActions: [autoScalingPolicyScaleIn.arn],
        dimensions: {
            AutoScalingGroupName: autoScalingGroup.name,
        },
    });

    return {
        asgLaunchTemplate,
        autoScalingGroup,
        highCpuAlarm,
        lowCpuAlarm
    }
}

module.exports = asg;
