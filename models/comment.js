const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");

const commentSchema = new Schema({
    comment: { type: String, required },
    user: { type: Schema.Types.ObjectId, ref: "User", required },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required },
    timeStamp: { type: Date, default: Date.now, required },
});

commentSchema.virtual("timeStampFormatted").get(function () {
    return DateTime.fromJSDate(this.timeStamp).toLocaleString(
        DateTime.DATE_MED
    );
});

// Export model
module.exports = mongoose.model("Comment", commentSchema);
