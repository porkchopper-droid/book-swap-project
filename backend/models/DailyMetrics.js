import mongoose from "mongoose";

const dailyMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true, // Only one doc per day!
  },
  newUsers: { type: Number, default: 0 },
  messagesSent: { type: Number, default: 0 },
  swapsInitiated: { type: Number, default: 0 },
  swapsAccepted: { type: Number, default: 0 },
  swapsCompleted: { type: Number, default: 0 },
  swapsReported: { type: Number, default: 0 },
  swapsCancelled: { type: Number, default: 0 },
  swapsExpired: { type: Number, default: 0 },
  // Breakdown by country:
  usersByCountry: {
    type: Map, // A MongoDB Map: key is country, value is count
    of: Number,
    default: {},
  },
});

const DailyMetrics = mongoose.model("DailyMetrics", dailyMetricsSchema);

export default DailyMetrics;
