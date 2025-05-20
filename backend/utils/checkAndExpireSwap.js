import { revertBooksToAvailable } from "./revertBookstoAvailable.js";

export const checkAndExpireSwap = async (proposal) => {
  const now = new Date();

  // Handle pending swaps
  if (proposal.status === "pending") {
    const expirationDate = new Date(proposal.createdAt);
    expirationDate.setDate(expirationDate.getDate() + 7);

    if (now > expirationDate) {
      proposal.status = "expired";
      proposal.expiredAt = now;
      await revertBooksToAvailable(proposal);
      await proposal.save();
    }
  }

  // Handle accepted swaps
  if (proposal.status === "accepted") {
    const expirationDate = new Date(proposal.acceptedAt);
    expirationDate.setDate(expirationDate.getDate() + 7);

    const notFullyCompleted = !proposal.fromCompleted || !proposal.toCompleted;

    if (now > expirationDate && notFullyCompleted) {
      proposal.status = "expired";
      proposal.expiredAt = now;
      await revertBooksToAvailable(proposal);
      await proposal.save();
    }
  }
};
