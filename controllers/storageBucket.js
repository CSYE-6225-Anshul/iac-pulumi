const gcp = require("@pulumi/gcp");

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
            origins: ["http://dev.anshulsharma.com"],
            responseHeaders: ["*"],
        }],
        forceDestroy: true,
        location: "US-EAST1",
        uniformBucketLevelAccess: true
    });
}

module.exports = createBucket;
