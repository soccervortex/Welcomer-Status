async function fetchUserStatus() {
    try {
      const response = await fetch('/status');
      const data = await response.json();
  
      const statusElement = document.getElementById('status');
      
      if (data.status === 'online') {
        statusElement.textContent = 'Welcomer is online ✅';
        statusElement.className = 'status online';
      } else {
        statusElement.textContent = 'Welcomer is offline ❌';
        statusElement.className = 'status offline';
      }
    } catch (error) {
      console.error(`Error fetching Welcomer's status:`, error);
    }
  }
  
  // Fetch status when the page loads
  window.onload = fetchUserStatus;
  
  // Optionally, check status every 5 seconds
  setInterval(fetchUserStatus, 1000);
  