const mongoose = require("mongoose");
//Project Schema
const issueSchema = mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  name: {
    type: String,
    required: [true, "is required"]
  },
  description: String,
  creationDate: Date
});

//ProjectModel
module.exports = mongoose.model("Issue", issueSchema);