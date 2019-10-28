const mongoose = require("mongoose");
//Project Schema
const projectSchema = mongoose.Schema({
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
module.exports = mongoose.model("Project", projectSchema);