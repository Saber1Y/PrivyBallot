// Clean IPFS localStorage data utility
// Run this in browser console to reset demo data

function clearPrivyBallotData() {
  console.log("🧹 Clearing PrivyBallot IPFS demo data...");
  
  // Clear IPFS-only DAO data
  localStorage.removeItem('ipfs_proposals');
  localStorage.removeItem('ipfs_votes');
  localStorage.removeItem('ipfs_next_id');
  
  // Clear user votes and deleted proposals
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('votes-') || key.startsWith('deleted-proposals-')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log("✅ All PrivyBallot demo data cleared!");
  console.log("🔄 Refresh the page to see a clean demo with fresh data");
}

// Auto-export for use
if (typeof window !== 'undefined') {
  (window as typeof window & { clearPrivyBallotData: typeof clearPrivyBallotData }).clearPrivyBallotData = clearPrivyBallotData;
}

export { clearPrivyBallotData };
