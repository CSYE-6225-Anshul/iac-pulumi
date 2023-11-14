const pulumi = require("@pulumi/pulumi");
const dbName = new pulumi.Config("database").require("dbName");
const dbUsername = new pulumi.Config("database").require("dbUsername");
const dbPassword = new pulumi.Config("database").require("dbPassword");
const metricsHostname = new pulumi.Config("metrics").require("hostname");
const metricsPort = new pulumi.Config("metrics").require("port");
const region = new pulumi.Config("aws").require("region");
const NODE_ENV = 'production';

// User data script to configure the EC2 instance
const userDataScript = (rdsInstance) => {
    const dbHostname = pulumi.interpolate`${rdsInstance.address}`;
    return pulumi.interpolate`#!/bin/bash
    echo "MYSQL_DATABASE=${dbName}" >> /opt/csye6225/.env
    echo "MYSQL_USER=${dbUsername}" >> /opt/csye6225/.env
    echo "MYSQL_PASSWORD=${dbPassword}" >> /opt/csye6225/.env
    echo "MYSQL_HOST=${dbHostname}" >> /opt/csye6225/.env
    echo "METRICS_HOSTNAME=${metricsHostname}" >> /opt/csye6225/.env
    echo "METRICS_PORT=${metricsPort}" >> /opt/csye6225/.env
    echo "NODE_ENV=${NODE_ENV}" >> /opt/csye6225/.env
    echo "REGION=${region}" >> /opt/csye6225/.env

    # Start the CloudWatch Agent and enable it to start on boot
    sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/csye6225/api/cloudwatch/config.json -s

    # Enable and start the systemd service
    sudo systemctl daemon-reload
    sudo systemctl enable amazon-cloudwatch-agent
    sudo systemctl start amazon-cloudwatch-agent

    sudo systemctl enable cloud.service
    sudo systemctl start cloud.service
    `;
}

module.exports = userDataScript;
