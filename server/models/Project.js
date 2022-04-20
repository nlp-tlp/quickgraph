const mongoose = require("mongoose");

const ProjectSchema = mongoose.Schema(
  {
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    preprocessing: {
      lowerCase: { type: Boolean, required: false },
      removeDuplicates: { type: Boolean, required: false },
      charsRemoved: { type: Boolean, required: false },
      charset: { type: String, required: false },
    },
    texts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Text",
        required: true,
      },
    ],
    tasks: {
      entityAnnotation: { type: Boolean, default: true },
      relationAnnotation: { type: Boolean, required: true, default: false },
      relationAnnotationType: { type: String, required: false },
    },
    ontology: [
      {
        _id: { type: String, required: true },
        isEntity: { type: Boolean, required: true },
        name: { type: String, required: true },
        fullName: { type: String, required: true },
        description: { type: String, required: false, default: "" },
        colour: { type: String, required: false },
        active: { type: Boolean, default: true, required: true },
        children: { type: Array, required: true },
        domain: { type: Array, required: false },
        range: { type: Array, required: false },
      },
    ],
    annotators: [
      {
        _id: false,
        // If an anonymous annotator makes an account, this will become associated with their access_url
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        accessId: { type: String, required: false }, // TODO: Implemented
        role: { type: String, required: true },
        disabled: { type: Boolean, required: true, default: false },
        state: {
          type: String,
          required: true,
          enum: ["accepted", "declined", "invited"],
          default: "invited",
        }, // Is performed after url is accessed (true - anon accepted, false - anon declined, undefined - waiting) or active user accepts/declines invitation.
        assignment: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Text",
            required: false, // Can be added after annotator has been invited
          },
        ],
      },
    ],
    clusterDetails: {},
    settings: {
      performClustering: {
        type: Boolean,
        required: true,
        default: false,
      },
      annotatorsPerDoc: {
        type: Number,
        default: 1,
        // default: function () {
        //   this.annotators.filter((a) => a.state === "accepted").length;
        // },
      },
    },
  },
  { _id: true, timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
