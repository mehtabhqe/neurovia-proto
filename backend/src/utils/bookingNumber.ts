import { Booking } from "../models/Booking";

export const generateBookingNumber = async (): Promise<string> => {
  const prefix = "NN";
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const count = await Booking.countDocuments();
  const serial = String(count + 1).padStart(4, "0");

  return `${prefix}${year}${month}-${serial}`;
};
