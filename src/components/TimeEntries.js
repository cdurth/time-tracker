import React, { useState } from "react";

const groupEntriesByDay = (entries) => {
  return entries.reduce((acc, entry) => {
    const date = new Date(entry.date + "T00:00:00").toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {});
};

const TimeEntries = ({ entries, setEditEntry, copyEntry, dateInputRef }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekRange = (offset) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const endOfWeek = new Date(now);

    // Start of the week on Sunday
    startOfWeek.setDate(now.getDate() - now.getDay() + offset * 7); // Sunday
    endOfWeek.setDate(now.getDate() - now.getDay() + 6 + offset * 7); // Saturday

    startOfWeek.setHours(0, 0, 0, 0);
    endOfWeek.setHours(0, 0, 0, 0);

    return { startOfWeek, endOfWeek };
  };

  const { startOfWeek, endOfWeek } = getWeekRange(weekOffset);
  const currentWeekEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date + "T00:00:00");
    return entryDate >= startOfWeek && entryDate < endOfWeek;
  });

  const entriesByDay = groupEntriesByDay(currentWeekEntries);

  const getTotalHoursForDay = (dayEntries) => {
    return dayEntries.reduce((total, entry) => total + parseFloat(entry.timeSpent), 0);
  };

  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);

  const handleEditEntry = (entry) => {
    setEditEntry(entry);
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mt-4">
        <button className="btn btn-secondary" onClick={goToPreviousWeek}>
          ← Previous Week
        </button>
        <h2>
          Time Entries ({startOfWeek.toLocaleDateString('en-US')} - {endOfWeek.toLocaleDateString('en-US')})
        </h2>
        <button className="btn btn-secondary" onClick={goToNextWeek}>
          Next Week →
        </button>
      </div>

      {currentWeekEntries.length === 0 ? (
        <p>No entries for this week.</p>
      ) : (
        <table className="table table-striped mt-3">
          <thead>
            <tr>
              <th scope="col">Project Code</th>
              <th scope="col">Project Task</th>
              <th scope="col">Earning Type</th>
              <th scope="col">Date</th>
              <th scope="col">Time Spent</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(entriesByDay)
              .sort((a, b) => new Date(a) - new Date(b)) // Sort by date ascending
              .map((day, index) => {
                const dayEntries = entriesByDay[day];
                const totalHours = getTotalHoursForDay(dayEntries);
                const dateObj = new Date(dayEntries[0].date + "T00:00:00");
                const dayOfWeek = dateObj
                  .toLocaleDateString('en-US', { weekday: 'long' })
                  .toUpperCase();

                // Format day to MM/DD/YYYY
                const formattedDate = dateObj.toLocaleDateString('en-US');

                return (
                  <React.Fragment key={index}>
                    {dayEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.projectCode}</td>
                        <td>{entry.projectTask}</td>
                        <td>{entry.earningType}</td>
                        <td>{new Date(entry.date + "T00:00:00").toLocaleDateString('en-US')}</td>
                        <td>{entry.timeSpent} hrs</td>
                        <td>
                          <button 
                            className="btn btn-warning btn-sm"
                            onClick={() => handleEditEntry(entry)}
                          >
                            Edit
                          </button>
                          {/* <button 
                            className="btn btn-info btn-sm ml-2"
                            onClick={() => copyEntry(entry)} // Call the copyEntry prop
                          >
                            Copy
                          </button> */}
                        </td>
                      </tr>
                    ))}
                    <tr className="summary-row">
                      <td colSpan="7" className="text-center">
                        Total hours for {dayOfWeek}, {formattedDate}: {totalHours.toFixed(2)} hrs
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TimeEntries;
