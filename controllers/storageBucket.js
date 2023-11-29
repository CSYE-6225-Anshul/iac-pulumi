const pulumi = require("@pulumi/pulumi");
const gcp = require("@pulumi/gcp");
const region = new pulumi.Config("gcp").require("region");

// Create a Google Cloud Storage bucket
const createBucket = () => {
    return new gcp.storage.Bucket("my-bucket", {
        cors: [{
            maxAgeSeconds: 3600,
            methods: [
                "GET",
                "HEAD",
                "PUT",
                "POST",
                "DELETE",
            ],
            origins: ["http://dev.anshulsharma.me", "http://demo.anshulsharma.me", "https://dev.anshulsharma.me", "https://demo.anshulsharma.me"],
            responseHeaders: ["*"],
        }],
        forceDestroy: true,
        location: region,
        uniformBucketLevelAccess: true
    });
}

module.exports = createBucket;
