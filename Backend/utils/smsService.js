export const sendSMS = async (phoneNumber, message) => {
  // SIMULATED SMS GATEWAY
  // In a real production environment, integrate with Twilio, Dialog, Mobitel, or similar APIs.
  console.log("==================================================");
  console.log(`[SMS SIMULATION] Sending SMS to ${phoneNumber}`);
  console.log(`[MESSAGE] ${message}`);
  console.log("==================================================");
  
  return Promise.resolve({ success: true, message: "SMS simulated successfully" });
};
