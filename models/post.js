const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");

const postSchema = new Schema({
    title: { type: String, required },
    content: { type: String, required },
    user: { type: Schema.Types.ObjectId, ref: "User", required },
    published: { type: Boolean, default: false },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    timeStamp: { type: Date, default: Date.now, required },
});
// Might add likes at a later time

postSchema.virtual("url").get(function () {
    return `/api/posts/${this._id}`;
});

postSchema.virtual("timeStampFormatted").get(function () {
    return DateTime.fromJSDate(this.timeStamp).toLocaleString(
        DateTime.DATE_MED
    );
});

// Export model
module.exports = mongoose.model("Post", postSchema);
