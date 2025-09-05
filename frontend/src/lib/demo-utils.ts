// Clean PrivyBallot localStorage data utility
// Run this in browser console to reset data

function clearPrivyBallotData() {
  console.log("🧹 Clearing PrivyBallot data...");

  // Clear DAO data
  localStorage.removeItem("privyballot_proposals");
  localStorage.removeItem("privyballot_votes");
  localStorage.removeItem("privyballot_next_id");

  // Clear user votes and deleted proposals
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("votes-") || key.startsWith("deleted-proposals-")) {
      localStorage.removeItem(key);
    }
  });

  console.log("✅ All PrivyBallot data cleared!");
  console.log("🔄 Refresh the page to see fresh data");
}

// Auto-export for use
if (typeof window !== "undefined") {
  (
    window as typeof window & {
      clearPrivyBallotData: typeof clearPrivyBallotData;
    }
  ).clearPrivyBallotData = clearPrivyBallotData;
}

export { clearPrivyBallotData };
