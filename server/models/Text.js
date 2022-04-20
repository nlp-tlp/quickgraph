const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const TextSchema = mongoose.Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
    original: {
      type: String,
      required: true,
    },
    tokens: [
      {
        index: {
          type: Number,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],
    // markup: [
    //   {
    //     start: {
    //       type: Number,
    //     },
    //     end: {
    //       type: Number,
    //     },
    //     label: {
    //       type: String,
    //     },
    //     labelId: {
    //       type: String,
    //     },
    //     suggested: { type: Boolean },
    //     createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    //     createdAt: { type: Date, default: Date.now },
    //   },
    // ],
    // relations: [
    //   {
    //     source: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Text.markup",
    //     },
    //     source_label: { type: String }, // Differentiates on multi-label entity spans
    //     target: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Text.markup",
    //     },
    //     target_label: { type: String }, // Differentiates on multi-label entity spans
    //     label: {
    //       type: String,
    //     },
    //     labelId: {
    //       type: String,
    //     },
    //     labelStart: { type: Number },
    //     labelEnd: { type: Number },
    //     suggested: { type: Boolean },
    //     createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    //     createdAt: { type: Date, default: Date.now },
    //   },
    // ],
    saved: [
      {
        _id: false,
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now, required: true },
      },
    ],
    iaa: {
      overall: { type: Schema.Types.Number, required: false, default: null },
      entity: { type: Schema.Types.Number, required: false, default: null },
      relation: { type: Schema.Types.Number, required: false, default: null },
    },
    weight: {
      type: Number,
      required: false,
    },
    rank: {
      type: Number,
    },
    cluster: {
      type: Number,
    },
  },
  { _id: true, timestamps: true }
);

TextSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("Text", TextSchema);
