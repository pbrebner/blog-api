const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");

const commentSchema = new Schema({
    content: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    likes: { type: Number, default: 0 },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    timeStamp: { type: Date, default: Date.now, required: true },
});

commentSchema.virtual("timeStampFormatted").get(function () {
    return DateTime.fromJSDate(this.timeStamp).toLocaleString(
        DateTime.DATE_MED
    );
});

// Export model
module.exports = mongoose.model("Comment", commentSchema);
