document.addEventListener("DOMContentLoaded", function () {
  const calendarBody = document.getElementById("calendar-body");

  // Start generating the calendar dynamically
  const daysInMonth = 31; // Example month with 31 days
  let dayCounter = 1;

  for (let i = 0; i < 5; i++) { // Five rows for a typical calendar
      const row = document.createElement("tr");

      for (let j = 0; j < 7; j++) { // Seven days in a week
          const cell = document.createElement("td");

          if ((i === 0 && j < 3) || dayCounter > daysInMonth) {
              // Empty cells before the 1st or after the last day
              cell.textContent = "";
          } else {
              cell.textContent = dayCounter;
              dayCounter++;
          }

          row.appendChild(cell);
      }

      calendarBody.appendChild(row);

      if (dayCounter > daysInMonth) break;
  }
});
