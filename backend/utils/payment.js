async function simulatePayment(amount) {
  return {
    success: true,
    amount: Number(amount),
    transactionId: `SIM-${Date.now()}`
  };
}

module.exports = { simulatePayment };
