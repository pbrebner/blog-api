const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");

const userSchema = new Schema({
    name: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    userDescription: { type: String, default: "" },
    avatar: {
        type: String,
        default:
            "https://blog-bucket-banana.s3.us-west-2.amazonaws.com/blogProfileDefault.png",
    },
    memberStatus: { type: Boolean, default: false },
    adminStatus: { type: Boolean, default: false },
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    timeStamp: { type: Date, default: Date.now, required: true },
});

userSchema.virtual("timeStampFormatted").get(function () {
    return DateTime.fromJSDate(this.timeStamp).toLocaleString(
        DateTime.DATE_MED
    );
});

// Export model
module.exports = mongoose.model("User", userSchema);
